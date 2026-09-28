import assert from "node:assert/strict";
import { test } from "node:test";
import { getCmcOverview } from "../lib/cmc.ts";
import { mergeMarket, readMarketStream } from "../lib/market-stream.ts";

test("fast CMC feeds publish before the slowest feed settles", async () => {
  const originalFetch = globalThis.fetch, originalKey = process.env.CMC_PRO_API_KEY;
  process.env.CMC_PRO_API_KEY = "test-only-placeholder";
  let release;
  const slow = new Promise(resolve => { release = resolve; });
  const updates = [];
  try {
    globalThis.fetch = async url => {
      if (String(url).includes("historical")) await slow;
      return Response.json({ status: { timestamp: "2026-09-28T00:00:00Z" }, data: [] });
    };
    const completion = getCmcOverview("core", snapshot => updates.push(snapshot));
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.ok(updates.length > 0);
    assert.equal(updates.at(-1).feeds.history.status, "pending");
    assert.equal(updates.at(-1).feeds.assets.status, "ok");
    release();
    const final = await completion;
    assert.equal(final.feeds.history.status, "ok");
    assert.equal(updates[0].feeds.history.status, "pending", "earlier snapshots must not mutate");
    const previous = { ...final, assets: [{ symbol: "SOL", price: 123 }], history: [{ symbol: "SOL", points: [] }] };
    const failed = { ...final, assets: [], history: [], feeds: { ...final.feeds, assets: { status: "error", updatedAt: null }, history: { status: "pending", updatedAt: null } } };
    const merged = mergeMarket(previous, failed);
    assert.equal(merged.assets[0].price, 123);
    assert.equal(merged.feeds.assets.status, "error");
    assert.equal(merged.history.length, 1);
  } finally {
    release(); globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.CMC_PRO_API_KEY; else process.env.CMC_PRO_API_KEY = originalKey;
  }
});

test("market stream handles split packets and rejects interrupted connections", async () => {
  const received = [], encoder = new TextEncoder();
  const body = '{"data":{"health":"partial"},"done":false}\n{"data":{"health":"healthy"},"done":true}\n';
  const response = new Response(new ReadableStream({ start(controller) { controller.enqueue(encoder.encode(body.slice(0, 17))); controller.enqueue(encoder.encode(body.slice(17))); controller.close(); } }));
  await readMarketStream(response, (data, done) => received.push({ data, done }));
  assert.equal(received.length, 2);
  assert.equal(received[1].done, true);
  await assert.rejects(readMarketStream(new Response('{"data":{},"done":false}\n'), () => {}), /interrupted/);
});

test("CMC distinguishes total outage from partial success, and every request is bounded", async () => {
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  // Advance beyond successful endpoint caches populated by the streaming test.
  Date.now = () => originalNow() + 4_000_000;
  const originalKey = process.env.CMC_PRO_API_KEY;
  process.env.CMC_PRO_API_KEY = "test-only-placeholder";
  let requests = 0;
  try {
    globalThis.fetch = async (_url, options) => {
      requests++;
      assert.ok(options.signal instanceof AbortSignal);
      return new Response("Unavailable", { status: 503 });
    };
    const outage = await getCmcOverview();
    assert.equal(outage.health, "unavailable");
    assert.equal(outage.errors.length, requests);
    assert.equal(outage.assets.length, 0);
    assert.ok(Object.values(outage.feeds).every(f => f.status === "error" && f.updatedAt === null));
    globalThis.fetch = async url => String(url).includes("/quotes/latest?id=")
      ? Response.json({ status: { timestamp: "2026-09-28T00:00:00Z" }, data: [] })
      : new Response("Rate limited", { status: 429 });
    const partial = await getCmcOverview();
    assert.equal(partial.health, "partial");
    assert.equal(partial.feeds.assets.status, "ok");
    assert.equal(partial.feeds.assets.updatedAt, "2026-09-28T00:00:00Z");
    assert.equal(partial.feeds.history.status, "error");
  } finally {
    Date.now = originalNow;
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.CMC_PRO_API_KEY;
    else process.env.CMC_PRO_API_KEY = originalKey;
  }
});
