import assert from "node:assert/strict";
import { test } from "node:test";
import { getCmcOverview } from "../lib/cmc.ts";

test("CMC distinguishes total outage from partial success, and every request is bounded", async () => {
  const originalFetch = globalThis.fetch;
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
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.CMC_PRO_API_KEY;
    else process.env.CMC_PRO_API_KEY = originalKey;
  }
});
