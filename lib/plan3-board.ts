export const WIDGET_IDS = [
  "market", "watchlist", "regime", "fear", "season", "liquidations", "funding", "thesis", "agent",
  "leaderboard", "performance", "movers", "breadth", "dominance", "volume", "valuation", "venues",
  "categories", "benchmark", "rwa", "stablecoins", "apihealth", "chart", "relative", "profile",
  "conversion", "exchangeDirectory", "fiats", "derivativeVenues", "liquidationAssets",
  "liquidationExchanges", "dexToken", "dexPools", "dexSecurity", "dexHolders", "dexSwaps",
  "dexLiquidity", "rwaGold", "rwaIssuers", "capabilities", "discovery", "cmcAi", "airdrops",
] as const;

export type WidgetId = typeof WIDGET_IDS[number];
export type WidgetRect = { x: number; y: number; w: number; h: number };
export type ProposalStatus = "pending" | "accepted" | "rejected";

export type BoardThesis = {
  summary: string;
  confidence: number;
  evidence: string[];
  risks: string[];
  sourceRetrievedAt: string | null;
};

export type BoardMonitor = {
  status: ProposalStatus;
  volumeChangeBelow: number;
  fundingAbove: number;
  description: string;
};

export type BoardState = {
  version: 1;
  name: string;
  widgets: WidgetId[];
  layout: Partial<Record<WidgetId, WidgetRect>>;
  thesis: BoardThesis;
  monitor: BoardMonitor;
  activity: Array<{ at: string; label: string }>;
};

export type BoardProposal = {
  prompt: string;
  createdAt: string;
  widgets: WidgetId[];
  thesis: BoardThesis;
  monitor: BoardMonitor;
  rationale: string;
  sourceRetrievedAt: string;
};

export const BOARD_STORAGE_KEY = "plan3.board.v1";

const LEGACY_WIDE = new Set<WidgetId>(["watchlist", "regime", "performance", "categories", "rwa", "agent"]);
const TALL_WIDGETS = new Set<WidgetId>(["performance", "categories", "rwa", "leaderboard", "chart", "agent"]);

function preferredRect(id: WidgetId, wide = LEGACY_WIDE.has(id)): WidgetRect {
  return { x: 0, y: 0, w: wide ? 532 : 344, h: TALL_WIDGETS.has(id) ? 290 : 250 };
}

function readRect(value: unknown): WidgetRect | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (![input.x, input.y, input.w, input.h].every((part) => typeof part === "number" && Number.isFinite(part))) return null;
  const { x, y, w, h } = input as WidgetRect;
  return { x: Math.max(0, Math.min(50000, Math.round(x))), y: Math.max(0, Math.min(50000, Math.round(y))), w: Math.max(240, Math.min(10000, Math.round(w))), h: Math.max(160, Math.min(10000, Math.round(h))) };
}

export function completeLayout(widgets: WidgetId[], existing: Partial<Record<WidgetId, WidgetRect>> = {}, legacySizes: Record<string, unknown> = {}): BoardState["layout"] {
  const layout: BoardState["layout"] = {};
  for (const id of widgets) {
    const rect = readRect(existing[id]);
    if (rect) layout[id] = rect;
  }
  const hasSavedPositions = Object.keys(layout).length > 0;
  let rowY = hasSavedPositions ? Math.max(...Object.values(layout).map((rect) => rect!.y + rect!.h)) + 16 : 0;
  let rowX = 0;
  let rowHeight = 0;
  for (const id of widgets) {
    if (layout[id]) continue;
    const rect = preferredRect(id, legacySizes[id] === "wide" || (legacySizes[id] !== "standard" && LEGACY_WIDE.has(id)));
    if (rowX && rowX + rect.w > 1120) { rowX = 0; rowY += rowHeight + 16; rowHeight = 0; }
    layout[id] = { ...rect, x: rowX, y: rowY };
    rowX += rect.w + 16;
    rowHeight = Math.max(rowHeight, rect.h);
  }
  return layout;
}

export function addWidgetsToBoard(board: BoardState, incoming: WidgetId[]): BoardState {
  const widgets = [...new Set([...board.widgets, ...incoming])];
  return { ...board, widgets, layout: completeLayout(widgets, board.layout) };
}

export const defaultBoard: BoardState = {
  version: 1,
  name: "SOL momentum thesis",
  widgets: ["market", "watchlist", "regime", "performance", "movers", "categories", "fear", "benchmark", "liquidations", "rwa", "agent"],
  layout: completeLayout(["market", "watchlist", "regime", "performance", "movers", "categories", "fear", "benchmark", "liquidations", "rwa", "agent"]),
  thesis: {
    summary: "SOL momentum needs volume confirmation and a check on leverage before a decision.",
    confidence: 50,
    evidence: [],
    risks: ["Check whether volume confirms the price move", "Check funding and liquidations"],
    sourceRetrievedAt: null,
  },
  monitor: {
    status: "pending",
    volumeChangeBelow: 0,
    fundingAbove: 0,
    description: "Watch for rising SOL price while volume weakens and funding turns positive.",
  },
  activity: [],
};

const widgetIdSet = new Set<string>(WIDGET_IDS);

export function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && widgetIdSet.has(value);
}

function readThesis(value: unknown): BoardThesis {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    summary: typeof input.summary === "string" ? input.summary.slice(0, 600) : defaultBoard.thesis.summary,
    confidence: typeof input.confidence === "number" && Number.isFinite(input.confidence) ? Math.max(0, Math.min(100, input.confidence)) : 50,
    evidence: Array.isArray(input.evidence) ? input.evidence.filter((entry): entry is string => typeof entry === "string").slice(0, 8).map((entry) => entry.slice(0, 240)) : [],
    risks: Array.isArray(input.risks) ? input.risks.filter((entry): entry is string => typeof entry === "string").slice(0, 8).map((entry) => entry.slice(0, 240)) : [],
    sourceRetrievedAt: typeof input.sourceRetrievedAt === "string" && Number.isFinite(Date.parse(input.sourceRetrievedAt)) ? input.sourceRetrievedAt : null,
  };
}

function readMonitor(value: unknown): BoardMonitor {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const status = input.status === "accepted" || input.status === "rejected" ? input.status : "pending";
  return {
    status,
    volumeChangeBelow: typeof input.volumeChangeBelow === "number" && Number.isFinite(input.volumeChangeBelow) ? Math.max(-100, Math.min(100, input.volumeChangeBelow)) : 0,
    fundingAbove: typeof input.fundingAbove === "number" && Number.isFinite(input.fundingAbove) ? Math.max(-1, Math.min(1, input.fundingAbove)) : 0,
    description: typeof input.description === "string" ? input.description.slice(0, 400) : defaultBoard.monitor.description,
  };
}

export function parseBoard(value: unknown): BoardState | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  if (input.version !== 1 || !Array.isArray(input.widgets)) return null;
  const widgets = [...new Set(input.widgets.filter(isWidgetId))].slice(0, WIDGET_IDS.length);
  const rawSizes = input.sizes && typeof input.sizes === "object" ? input.sizes as Record<string, unknown> : {};
  const rawLayout = input.layout && typeof input.layout === "object" ? input.layout as BoardState["layout"] : {};
  return {
    version: 1,
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : defaultBoard.name,
    widgets,
    layout: completeLayout(widgets, rawLayout, rawSizes),
    thesis: readThesis(input.thesis),
    monitor: readMonitor(input.monitor),
    activity: Array.isArray(input.activity) ? input.activity.map((entry) => {
      const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
      return { at: typeof item.at === "string" ? item.at : "", label: typeof item.label === "string" ? item.label.slice(0, 160) : "" };
    }).filter((entry) => entry.at && entry.label).slice(-30) : [],
  };
}

export function encodeBoard(board: BoardState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(board));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeBoard(encoded: string): BoardState | null {
  if (encoded.length > 16000 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return parseBoard(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
