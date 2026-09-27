import assert from "node:assert/strict";
import { test } from "node:test";
import {
  templateBoard,
  makeBlock,
  parseWorkspaceBoard,
  metricValue,
  evaluateRule,
  duplicateBlock,
  removeBlock,
  safeSource,
  migrateBoard,
} from "../lib/workspace.ts";
import { defaultBoard, WIDGET_IDS, parseBoard } from "../lib/plan3-board.ts";
import { mergeBoard, applyDraft, boardChanges, boardRevision, applyChanges } from "../lib/workspace-edits.ts";

test("proposal revision is stable for a snapshot and changes with edited content", () => {
  const board = templateBoard(), copy = structuredClone(board);
  assert.equal(boardRevision(board), boardRevision(copy));
  copy.blocks[0].rect.x += 10;
  assert.notEqual(boardRevision(board), boardRevision(copy));
});

test("concurrent additions from two tabs merge without loss", () => {
  const base = templateBoard();
  const local = structuredClone(base), remote = structuredClone(base);
  local.blocks.push(makeBlock("note"));
  remote.blocks.push(makeBlock("metric"));
  const result = mergeBoard(base, local, remote);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.board.blocks.length, base.blocks.length + 2);
});
test("layer ordering persists through merge, while simultaneous reorder is a conflict", () => {
  const base = templateBoard(), local = structuredClone(base), remote = structuredClone(base);
  local.blocks.push(local.blocks.shift());
  assert.deepEqual(mergeBoard(base, local, remote).board.blocks.map(b => b.id), local.blocks.map(b => b.id));
  remote.blocks.reverse();
  assert.ok(mergeBoard(base, local, remote).conflicts.includes("widgets.order"));
});
test("simultaneous field edits are explicit conflicts, disjoint properties merge", () => {
  const base = templateBoard(), local = structuredClone(base), remote = structuredClone(base);
  local.blocks[0].title = "Local title";
  remote.blocks[0].rect.x = 80;
  let result = mergeBoard(base, local, remote);
  assert.equal(result.conflicts.length, 0);
  assert.equal(result.board.blocks[0].title, "Local title");
  assert.equal(result.board.blocks[0].rect.x, 80);
  remote.blocks[0].title = "Remote title";
  result = mergeBoard(base, local, remote);
  assert.equal(result.conflicts.length, 1);
});
test("inspector Apply preserves movement since opening and commits staged links", () => {
  const base = templateBoard(), current = structuredClone(base);
  const original = base.blocks[0], draft = structuredClone(original);
  draft.title = "Edited title";
  current.blocks[0].rect.x = 120;
  const link = { id: "draft-link", from: original.id, to: base.blocks[2].id, relation: "supports" };
  const next = applyDraft(current, original, draft, [link], []);
  assert.equal(next.blocks[0].rect.x, 120);
  assert.equal(next.blocks[0].title, "Edited title");
  assert.equal(next.connections.length, base.connections.length + 1);
  assert.equal(current.connections.length, base.connections.length);
});
test("draft link removal is transactional and unrelated relationships survive", () => {
  const board = templateBoard(), original = board.blocks[1];
  const existing = board.connections.filter(c => c.from === original.id || c.to === original.id);
  const next = applyDraft(board, original, original, [], existing);
  assert.equal(next.connections.length, board.connections.length - existing.length);
  assert.equal(board.connections.length, 2);
});
test("selective agent patches change only approved widgets and context", () => {
  const base = templateBoard(), proposed = structuredClone(base);
  proposed.blocks[0].title = "Approved";
  proposed.blocks[1].title = "Not approved";
  proposed.asset = "BTC";
  assert.equal(boardChanges(base, proposed).length, 3);
  const next = applyChanges(base, proposed, [`widget:${base.blocks[0].id}`]);
  assert.equal(next.blocks[0].title, "Approved");
  assert.equal(next.blocks[1].title, base.blocks[1].title);
  assert.equal(next.asset, "SOL");
  assert.equal(next.id, base.id);
});
test("excluding a proposed widget cannot create dangling links", () => {
  const base = templateBoard(), proposed = structuredClone(base), note = makeBlock("note");
  proposed.blocks.push(note);
  proposed.connections.push({ id: "new-edge", from: base.blocks[0].id, to: note.id, relation: "supports" });
  const next = applyChanges(base, proposed, ["link:new-edge"]);
  assert.equal(next.connections.length, base.connections.length);
});
test("table columns, filters and chart window persist and validate", () => {
  const board = templateBoard();
  board.blocks[0].config.columns = ["price", "turnover", "change7d"];
  board.blocks[0].config.minimum = 0;
  board.blocks[1].config.historyDays = 7;
  assert.deepEqual(parseWorkspaceBoard(board, WIDGET_IDS), board);
  board.blocks[0].config.columns = ["__proto__"];
  assert.equal(parseWorkspaceBoard(board, WIDGET_IDS), null);
});

test("all starter boards round-trip without losing settings or links", () => {
  for (const kind of ["momentum", "risk", "blank"]) {
    const board = templateBoard(kind);
    assert.deepEqual(
      parseWorkspaceBoard(JSON.parse(JSON.stringify(board)), WIDGET_IDS),
      board,
    );
  }
});
test("imports reject duplicate IDs, dangling links, invalid presets, unsafe metric keys and nonfinite values", () => {
  const mutations = [
    (b) => b.blocks.push(b.blocks[0]),
    (b) =>
      b.connections.push({
        id: "bad",
        from: "missing",
        to: b.blocks[0].id,
        relation: "supports",
      }),
    (b) => {
      b.blocks[0].config.metric = "__proto__";
    },
    (b) => {
      b.blocks[0].config.threshold = Infinity;
    },
    (b) => {
      b.blocks[0].rect.x = -10;
    },
    (b) => {
      b.blocks[0].kind = "preset";
      b.blocks[0].config.preset = "not-a-widget";
    },
    (b) => {
      b.blocks[0].config.symbols = [42];
    },
    (b) => {
      b.connections[0].relation = "exec";
    },
  ];
  for (const mutate of mutations) {
    const board = templateBoard();
    mutate(board);
    assert.equal(parseWorkspaceBoard(board, WIDGET_IDS), null);
  }
});
test("derived metrics never turn absent data or zero denominators into valid signals", () => {
  assert.equal(
    metricValue({ volume24h: 250, marketCap: 1000 }, "turnover"),
    25,
  );
  assert.equal(
    metricValue({ fullyDilutedMarketCap: 2000, marketCap: 1000 }, "dilution"),
    2,
  );
  assert.equal(
    metricValue({ volume24h: null, marketCap: 1000 }, "turnover"),
    null,
  );
  assert.equal(metricValue({ volume24h: 250, marketCap: 0 }, "turnover"), null);
  assert.equal(metricValue(undefined, "price"), null);
  assert.equal(metricValue({ price: 0 }, "price"), 0);
});
test("conditions resolve linked and pinned context; stale, failed and missing inputs are unknown", () => {
  const board = templateBoard();
  const rule = makeBlock("rule");
  rule.config.metric = "change24h";
  rule.config.threshold = 0;
  const now = Date.now();
  const data = {
    retrievedAt: new Date(now).toISOString(),
    assets: [
      { symbol: "SOL", change24h: -3 },
      { symbol: "BTC", change24h: 2 },
    ],
    listings: [],
  };
  assert.equal(evaluateRule(rule, board, data, now), "met");
  rule.config.asset = "BTC";
  assert.equal(evaluateRule(rule, board, data, now), "not met");
  assert.equal(evaluateRule(rule, board, data, now + 180001), "unknown");
  assert.equal(evaluateRule(rule, board, data, now, true), "unknown");
  data.assets[1].lastUpdated = new Date(now - 600001).toISOString();
  assert.equal(evaluateRule(rule, board, data, now), "unknown");
  rule.config.asset = "MISSING";
  assert.equal(evaluateRule(rule, board, data, now), "unknown");
});
test("duplicates are independent, and deletion removes connected edges", () => {
  const board = templateBoard();
  const source = board.blocks[0];
  const copy = duplicateBlock(source);
  assert.notEqual(copy.id, source.id);
  copy.config.metric = "price";
  assert.equal(source.config.metric, "turnover");
  const target = board.connections[0].to;
  const removed = removeBlock(board, target);
  assert.equal(
    removed.blocks.some((b) => b.id === target),
    false,
  );
  assert.equal(
    removed.connections.some((c) => c.from === target || c.to === target),
    false,
  );
});
test("legacy migration preserves exact layout, thesis and accepted monitor across reload", () => {
  const old = structuredClone(defaultBoard);
  old.thesis.summary = "Human-authored conclusion";
  old.monitor.status = "accepted";
  const board = migrateBoard(old);
  const parsed = parseWorkspaceBoard(
    JSON.parse(JSON.stringify(board)),
    WIDGET_IDS,
    parseBoard,
  );
  assert.equal(parsed.legacy.thesis.summary, old.thesis.summary);
  assert.equal(parsed.legacy.monitor.status, "accepted");
  assert.deepEqual(parsed.blocks[0].rect, old.layout[old.widgets[0]]);
});
test("source links reject executable schemes and embedded credentials", () => {
  assert.equal(safeSource("javascript:alert(1)"), null);
  assert.equal(safeSource("data:text/html,test"), null);
  assert.equal(safeSource("https://user:password@example.com"), null);
  assert.equal(
    safeSource("https://example.com/report"),
    "https://example.com/report",
  );
});
