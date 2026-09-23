export const WIDGET_IDS = [
  "market", "watchlist", "regime", "fear", "season", "liquidations", "funding", "thesis", "agent",
  "leaderboard", "performance", "movers", "breadth", "dominance", "volume", "valuation", "venues",
  "categories", "benchmark", "rwa", "stablecoins", "apihealth", "chart", "relative", "profile",
  "conversion", "exchangeDirectory", "fiats", "derivativeVenues", "liquidationAssets",
  "liquidationExchanges", "dexToken", "dexPools", "dexSecurity", "dexHolders", "dexSwaps",
  "dexLiquidity", "rwaGold", "rwaIssuers", "capabilities", "discovery", "cmcAi", "airdrops",
] as const;

export type WidgetId = typeof WIDGET_IDS[number];
export type WidgetSize = "standard" | "wide";
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
  sizes: Partial<Record<WidgetId, WidgetSize>>;
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

export const defaultBoard: BoardState = {
  version: 1,
  name: "SOL momentum thesis",
  widgets: ["market", "watchlist", "regime", "performance", "movers", "categories", "fear", "benchmark", "liquidations", "rwa", "agent"],
  sizes: { watchlist: "wide", regime: "wide", performance: "wide", categories: "wide", rwa: "wide", agent: "wide" },
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
  const sizes: BoardState["sizes"] = {};
  for (const id of widgets) if (rawSizes[id] === "wide" || rawSizes[id] === "standard") sizes[id] = rawSizes[id];
  return {
    version: 1,
    name: typeof input.name === "string" && input.name.trim() ? input.name.trim().slice(0, 80) : defaultBoard.name,
    widgets,
    sizes,
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
