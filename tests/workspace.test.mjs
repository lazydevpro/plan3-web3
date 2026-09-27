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
