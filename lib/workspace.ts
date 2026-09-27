import type { CmcAssetQuote, CmcOverview } from "./cmc";
import type { BoardState, WidgetId, WidgetRect } from "./plan3-board";

export const WORKSPACE_KEY = "plan3.workspace.v2";
export const KINDS = [
  "metric",
  "chart",
  "table",
  "ranking",
  "rule",
  "note",
  "source",
  "preset",
] as const;
export type BlockKind = (typeof KINDS)[number];
export const METRICS = {
  price: { label: "Price", unit: "$", formula: "Latest USD quote" },
  change1h: {
    label: "1h return",
    unit: "%",
    formula: "CMC percent change · 1 hour",
  },
  change24h: {
    label: "24h return",
    unit: "%",
    formula: "CMC percent change · 24 hours",
  },
  change7d: {
    label: "7d return",
    unit: "%",
    formula: "CMC percent change · 7 days",
  },
  change30d: {
    label: "30d return",
    unit: "%",
    formula: "CMC percent change · 30 days",
  },
  volume24h: {
    label: "24h volume",
    unit: "$",
    formula: "Reported USD trading volume · 24 hours",
  },
  volumeChange24h: {
    label: "Volume change",
    unit: "%",
    formula: "CMC volume change · 24 hours",
  },
  marketCap: {
    label: "Market cap",
    unit: "$",
    formula: "CMC circulating market capitalization",
  },
  marketCapDominance: {
    label: "Market dominance",
    unit: "%",
    formula: "CMC share of total market capitalization",
  },
  turnover: {
    label: "Volume / market cap",
    unit: "%",
    formula: "24h volume ÷ market cap × 100",
  },
  dilution: {
    label: "FDV / market cap",
    unit: "×",
    formula: "Fully diluted market cap ÷ circulating market cap",
  },
} as const;
export type Metric = keyof typeof METRICS;
export type Block = {
  id: string;
  kind: BlockKind;
  title: string;
  rect: WidgetRect;
  config: {
    asset: string;
    metric: Metric;
    symbols: string[];
    limit: number;
    ascending: boolean;
    operator: "gt" | "lt";
    threshold: number;
    text: string;
    url: string;
    preset?: WidgetId;
  };
};
export type Connection = {
  id: string;
  from: string;
  to: string;
  relation: "supports" | "contradicts" | "watches" | "derived from";
};
export type WorkspaceBoard = {
  version: 2;
  id: string;
  name: string;
  asset: string;
  blocks: Block[];
  connections: Connection[];
  legacy?: BoardState;
};
export type Workspace = { activeId: string; boards: WorkspaceBoard[] };
export const uid = () => crypto.randomUUID();
export function makeBlock(kind: BlockKind, patch: Partial<Block> = {}): Block {
  return {
    id: uid(),
    kind,
    title: {
      metric: "Market instrument",
      chart: "Price history",
      table: "My watchlist",
      ranking: "Momentum ranking",
      rule: "Invalidation condition",
      note: "Working thesis",
      source: "Research source",
      preset: "CMC widget",
    }[kind],
    rect: {
      x: 0,
      y: 0,
      w: kind === "chart" || kind === "table" ? 520 : 340,
      h: kind === "chart" || kind === "table" ? 320 : 250,
    },
    config: {
      asset: "$asset",
      metric: kind === "ranking" ? "change24h" : "price",
      symbols: ["BTC", "ETH", "SOL"],
      limit: 6,
      ascending: false,
      operator: "lt",
      threshold: 0,
      text: "Write the hypothesis, evidence, and what would change your mind.",
      url: "",
    },
    ...patch,
  };
}
export function templateBoard(kind = "momentum"): WorkspaceBoard {
  const board: WorkspaceBoard = {
    version: 2,
    id: uid(),
    name:
      kind === "blank"
        ? "Untitled workspace"
        : kind === "risk"
          ? "Risk & invalidation"
          : "Momentum research",
    asset: "SOL",
    blocks: [],
    connections: [],
  };
  if (kind === "blank") return board;
  const metric = makeBlock("metric", {
    title: "Liquidity intensity",
    rect: { x: 0, y: 0, w: 300, h: 240 },
  });
  metric.config.metric = "turnover";
  const chart = makeBlock("chart", {
    title: "Price structure",
    rect: { x: 316, y: 0, w: 620, h: 320 },
  });
  const note = makeBlock("note", { rect: { x: 952, y: 0, w: 350, h: 320 } });
  note.config.text =
    "Hypothesis\nPrice strength should be supported by trading activity.\n\nEvidence to inspect\nCompare returns and volume across the watchlist.\n\nChange my mind if\nThe linked condition is met. This is a research example, not a trade recommendation.";
  const table = makeBlock("table", {
    title: "Compare the leaders",
    rect: { x: 0, y: 336, w: 620, h: 320 },
  });
  table.config.metric = "change7d";
  const rule = makeBlock("rule", {
    title: "Volume deterioration",
    rect: { x: 636, y: 336, w: 330, h: 320 },
  });
  rule.config.metric = "volumeChange24h";
  rule.config.threshold = -20;
  const ranking = makeBlock("ranking", {
    title: kind === "risk" ? "Weakest 24h returns" : "Strongest 24h returns",
    rect: { x: 982, y: 336, w: 320, h: 320 },
  });
  ranking.config.ascending = kind === "risk";
  board.blocks = [metric, chart, note, table, rule, ranking];
  board.connections = [
    { id: uid(), from: chart.id, to: note.id, relation: "supports" },
    { id: uid(), from: rule.id, to: note.id, relation: "watches" },
  ];
  return board;
}
export function migrateBoard(old: BoardState): WorkspaceBoard {
  return {
    version: 2,
    id: uid(),
    name: old.name,
    asset: "SOL",
    legacy: old,
    connections: [],
    blocks: old.widgets.map((id) => {
      const block = makeBlock("preset", {
        title: id,
        rect: old.layout[id] ?? { x: 0, y: 0, w: 340, h: 260 },
      });
      block.config.preset = id;
      return block;
    }),
  };
}
export function assetsFrom(data: CmcOverview | null): CmcAssetQuote[] {
  return [
    ...new Map(
      [...(data?.listings ?? []), ...(data?.assets ?? [])].map((asset) => [
        asset.symbol,
        asset,
      ]),
    ).values(),
  ];
}
export function metricValue(
  asset: CmcAssetQuote | undefined,
  metric: Metric,
): number | null {
  if (!asset) return null;
  const numerator =
    metric === "turnover" ? asset.volume24h : asset.fullyDilutedMarketCap;
  const value =
    metric === "turnover" || metric === "dilution"
      ? numerator != null && asset.marketCap != null && asset.marketCap > 0
        ? (numerator / asset.marketCap) * (metric === "turnover" ? 100 : 1)
        : null
      : asset[metric];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function formatMetric(value: number | null, metric: Metric): string {
  if (value == null) return "—";
  const unit = METRICS[metric].unit;
  const formatted = new Intl.NumberFormat("en-US", {
    notation: Math.abs(value) >= 1e6 ? "compact" : "standard",
    maximumFractionDigits: value !== 0 && Math.abs(value) < 0.01 ? 6 : 2,
  }).format(value);
  return unit === "$" ? `$${formatted}` : `${formatted}${unit}`;
}
export function evaluateRule(
  block: Block,
  board: WorkspaceBoard,
  data: CmcOverview | null,
  now = Date.now(),
  failed = false,
): "met" | "not met" | "unknown" {
  const age = data ? now - Date.parse(data.retrievedAt) : NaN;
  if (failed || !Number.isFinite(age) || age > 180_000 || age < -60_000)
    return "unknown";
  const asset = assetsFrom(data).find(
    (a) =>
      a.symbol ===
      (block.config.asset === "$asset" ? board.asset : block.config.asset),
  );
  if (asset?.lastUpdated) {
    const quoteAge = now - Date.parse(asset.lastUpdated);
    if (!Number.isFinite(quoteAge) || quoteAge > 600_000 || quoteAge < -60_000)
      return "unknown";
  }
  const value = metricValue(asset, block.config.metric);
  if (value == null) return "unknown";
  return (
    block.config.operator === "gt"
      ? value > block.config.threshold
      : value < block.config.threshold
  )
    ? "met"
    : "not met";
}
export function safeSource(value: string): string | null {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function parseWorkspaceBoard(
  value: unknown,
  presetIds: readonly string[],
  parseLegacy?: (value: unknown) => BoardState | null,
): WorkspaceBoard | null {
  if (!value || typeof value !== "object") return null;
  const b = value as WorkspaceBoard;
  if (
    b.version !== 2 ||
    typeof b.id !== "string" ||
    !b.id ||
    b.id.length > 100 ||
    typeof b.name !== "string" ||
    typeof b.asset !== "string" ||
    !Array.isArray(b.blocks) ||
    b.blocks.length > 100 ||
    !Array.isArray(b.connections) ||
    b.connections.length > 200
  )
    return null;
  const ids = new Set<string>();
  for (const w of b.blocks) {
    if (
      !w ||
      typeof w.id !== "string" ||
      !w.id ||
      w.id.length > 100 ||
      ids.has(w.id) ||
      !KINDS.includes(w.kind) ||
      typeof w.title !== "string" ||
      !w.rect ||
      !w.config
    )
      return null;
    ids.add(w.id);
    if (
      ![w.rect.x, w.rect.y, w.rect.w, w.rect.h].every(
        (v) =>
          typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 50000,
      ) ||
      w.rect.w < 240 ||
      w.rect.h < 160
    )
      return null;
    const c = w.config;
    if (
      typeof c.asset !== "string" ||
      c.asset.length > 40 ||
      !Object.hasOwn(METRICS, c.metric) ||
      !Array.isArray(c.symbols) ||
      c.symbols.length > 40 ||
      !c.symbols.every((s) => typeof s === "string" && s.length <= 40) ||
      !Number.isInteger(c.limit) ||
      c.limit < 1 ||
      c.limit > 30 ||
      typeof c.ascending !== "boolean" ||
      !["lt", "gt"].includes(c.operator) ||
      typeof c.threshold !== "number" ||
      !Number.isFinite(c.threshold) ||
      typeof c.text !== "string" ||
      c.text.length > 8000 ||
      typeof c.url !== "string" ||
      c.url.length > 2000 ||
      (w.kind === "preset" && !presetIds.includes(c.preset ?? ""))
    )
      return null;
  }
  if (
    b.connections.some(
      (c) =>
        !c ||
        typeof c.id !== "string" ||
        !ids.has(c.from) ||
        !ids.has(c.to) ||
        c.from === c.to ||
        !["supports", "contradicts", "watches", "derived from"].includes(
          c.relation,
        ),
    ) ||
    new Set(b.connections.map((c) => c.id)).size !== b.connections.length
  )
    return null;
  // Reconstruct the public manifest; legacy board content is accepted only through its own validator.
  return {
    ...(b.legacy && parseLegacy
      ? { legacy: parseLegacy(b.legacy) ?? undefined }
      : {}),
    version: 2,
    id: b.id,
    name: b.name.slice(0, 100),
    asset: b.asset.slice(0, 40),
    blocks: b.blocks.map((w) => ({
      id: w.id,
      kind: w.kind,
      title: w.title.slice(0, 100),
      rect: { x: w.rect.x, y: w.rect.y, w: w.rect.w, h: w.rect.h },
      config: {
        asset: w.config.asset,
        metric: w.config.metric,
        symbols: w.config.symbols,
        limit: w.config.limit,
        ascending: w.config.ascending,
        operator: w.config.operator,
        threshold: w.config.threshold,
        text: w.config.text,
        url: w.config.url,
        ...(w.kind === "preset" ? { preset: w.config.preset } : {}),
      },
    })),
    connections: b.connections.map((c) => ({
      id: c.id,
      from: c.from,
      to: c.to,
      relation: c.relation,
    })),
  };
}
export function duplicateBlock(block: Block): Block {
  return {
    ...structuredClone(block),
    id: uid(),
    title: `${block.title} copy`.slice(0, 100),
    rect: { ...block.rect, x: block.rect.x + 24, y: block.rect.y + 24 },
  };
}
export function removeBlock(board: WorkspaceBoard, id: string): WorkspaceBoard {
  return {
    ...board,
    blocks: board.blocks.filter((b) => b.id !== id),
    connections: board.connections.filter((c) => c.from !== id && c.to !== id),
  };
}
