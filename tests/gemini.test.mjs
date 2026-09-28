import assert from "node:assert/strict";
import { test } from "node:test";
import { requestGemini, validateAgentPlan, researchSources, DEFAULT_GEMINI_MODEL } from "../lib/gemini-agent.ts";
import { templateBoard } from "../lib/workspace.ts";
import { boardRevision, boardChanges, applyChanges } from "../lib/workspace-edits.ts";

const plan = (changes = [], extra = {}) => ({ analysis: "Research observation, not a trade instruction.", evidence: [], caveats: ["Limited snapshot."], changes, links: [], ...extra });
const snapshot = { retrievedAt: "2026-09-28T00:00:00Z", assets: [], listings: [], feeds: {}, health: "unavailable" };

test("Gemini proposals preserve current work, place additions safely, and require selective application", () => {
  const base = templateBoard(), original = structuredClone(base);
  const note = base.blocks.find(b => b.kind === "note");
  const result = validateAgentPlan(plan([
    { op: "update", id: note.id, config: { text: "A revised hypothesis" } },
    { op: "add", id: "new-rule", kind: "rule", title: "Volume check", config: { metric: "volumeChange24h", threshold: -20 } },
  ], { links: [{ from: "new-rule", to: note.id, relation: "watches" }] }), base, []);
  assert.deepEqual(base, original);
  assert.deepEqual(result.proposal.blocks.find(b => b.id === note.id).rect, note.rect);
  assert.ok(result.proposal.blocks.at(-1).rect.y >= Math.max(...base.blocks.map(b => b.rect.y + b.rect.h)));
  const applied = applyChanges(base, result.proposal, [`widget:${note.id}`]);
  assert.equal(applied.blocks.length, base.blocks.length);
  assert.equal(applied.connections.length, base.connections.length);
});

test("Gemini rejects locked edits, unsafe URLs, invalid metrics, dangling links, and invented source IDs", () => {
  const board = templateBoard(); board.blocks[0].locked = true;
  for (const invalid of [
    plan([{ op: "remove", id: board.blocks[0].id }]),
    plan([{ op: "add", id: "source", kind: "source", title: "Bad source", config: { url: "javascript:alert(1)" } }]),
    plan([{ op: "add", id: "metric", kind: "metric", title: "Bad metric", config: { metric: "guaranteedProfit" } }]),
    plan([], { links: [{ from: "missing", to: board.blocks[0].id, relation: "supports" }] }),
    plan([], { evidence: [{ sourceId: "invented", claim: "Unverifiable" }] }),
  ]) assert.throws(() => validateAgentPlan(invalid, board, []));
});

test("analysis-only answers do not propose changes; citations retain feed health", () => {
  const board = templateBoard();
  const sources = researchSources(snapshot, board);
  assert.equal(sources.find(s => s.id === "quotes").status, "unavailable");
  const result = validateAgentPlan(plan([], { evidence: [{ sourceId: "quotes", claim: "Quote data is unavailable." }] }), board, sources);
  assert.equal(boardChanges(board, result.proposal).length, 0);
  assert.equal(result.evidence[0].status, "unavailable");
});

test("Gemini uses server header authentication, structured output, and the board revision", async () => {
  const board = templateBoard();
  const result = await requestGemini({ apiKey: "test-only-secret", model: DEFAULT_GEMINI_MODEL, board, prompt: "Review my current research", data: snapshot, fetcher: async (url, init) => {
    assert.ok(!url.includes("test-only-secret"));
    assert.equal(init.headers["x-goog-api-key"], "test-only-secret");
    const body = JSON.parse(init.body);
    assert.equal(body.generationConfig.responseFormat.text.mimeType, "APPLICATION_JSON");
    assert.equal(body.generationConfig.responseFormat.text.schema.type, "object");
    assert.ok(!init.body.includes("test-only-secret"));
    assert.equal(JSON.parse(body.contents[0].parts[0].text).board.id, board.id);
    assert.ok(init.signal);
    return Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: JSON.stringify(plan()) }] } }] });
  } });
  assert.equal(result.baseRevision, boardRevision(board));
  assert.equal(result.model, DEFAULT_GEMINI_MODEL);
});

test("Gemini failures are actionable and never leak upstream response bodies", async () => {
  const input = { apiKey: "test-only-secret", model: DEFAULT_GEMINI_MODEL, board: templateBoard(), prompt: "Review current research", data: snapshot };
  for (const status of [400, 401, 403, 404, 429, 500]) {
    await assert.rejects(requestGemini({ ...input, fetcher: async () => new Response("private provider body", { status }) }), error => !error.message.includes("private provider body") && error.status >= 400);
  }
  await assert.rejects(requestGemini({ ...input, fetcher: async () => { throw new Error("private network details"); } }), /did not respond/);
  await assert.rejects(requestGemini({ ...input, fetcher: async () => Response.json({ candidates: [{ finishReason: "MAX_TOKENS" }] }) }), /could not complete/);
  await assert.rejects(requestGemini({ ...input, fetcher: async () => Response.json({ candidates: [{ finishReason: "STOP", content: { parts: [{ text: "not json" }] } }] }) }), /invalid proposal data/);
});
