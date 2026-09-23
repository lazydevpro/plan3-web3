import type { CmcOverview } from "@/lib/cmc";
import type { BoardProposal, WidgetId } from "@/lib/plan3-board";

function signed(value: number, digits = 2) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** A bounded, inspectable analyst: every statement is derived from the current CMC response. */
export function createBoardProposal(prompt: string, data: CmcOverview): BoardProposal {
  const question = prompt.trim().slice(0, 500);
  const lower = question.toLowerCase();
  const rwaIntent = /rwa|real.world|tokeniz|gold|treasur|issuer/.test(lower);
  const dexIntent = /dex|jup|pool|holder|swap|liquidit|security|token risk/.test(lower);
  const riskIntent = /risk|crowd|funding|liquidat|leverage|sustain|breakout|momentum|alert|monitor/.test(lower);
  const comparisonIntent = /compare|relative|bitcoin|btc|ethereum|eth|history|chart|trend/.test(lower);
  const widgets: WidgetId[] = ["market", "chart", "regime", "thesis"];
  const add = (...ids: WidgetId[]) => ids.forEach((id) => { if (!widgets.includes(id)) widgets.push(id); });
  if (comparisonIntent) add("relative", "performance");
  if (riskIntent || (!rwaIntent && !dexIntent)) add("funding", "liquidations", "liquidationAssets", "agent");
  if (rwaIntent) add("rwa", "rwaGold", "rwaIssuers");
  if (dexIntent) add("dexToken", "dexPools", "dexSecurity", "dexHolders", "dexSwaps");

  const sol = data.assets.find((asset) => asset.symbol === "SOL");
  const evidence: string[] = [];
  const risks: string[] = [];
  if (sol?.price != null && sol.change24h != null) evidence.push(`SOL is ${dollars(sol.price)}, ${signed(sol.change24h)} over 24h (CMC latest quote).`);
  if (sol?.volume24h != null) evidence.push(`SOL 24h volume is ${dollars(sol.volume24h)}${sol.volumeChange24h == null ? "" : `, ${signed(sol.volumeChange24h)} versus the previous day`}.`);
  if (data.global.btcDominance != null && data.global.marketCapChange24h != null) evidence.push(`Total crypto market cap is ${signed(data.global.marketCapChange24h)} over 24h; BTC dominance is ${data.global.btcDominance.toFixed(1)}%.`);
  if (data.derivatives.fundingRate != null) evidence.push(`Reported SOL perpetual funding is ${(data.derivatives.fundingRate * 100).toFixed(4)}% at ${data.derivatives.venue ?? "the selected venue"}.`);
  if (data.liquidations.total24h != null) evidence.push(`Marketwide 24h liquidations total ${dollars(data.liquidations.total24h)}.`);
  if (rwaIntent && data.rwaDetail) evidence.push(`Tokenized ${data.rwaDetail.name.toLowerCase()} market cap is ${dollars(data.rwaDetail.marketCap ?? 0)} across ${data.rwaDetail.tokens.length} tokens in the current response.`);
  if (dexIntent && data.dex.token) evidence.push(`${data.dex.token.symbol} DEX liquidity is ${dollars(data.dex.token.liquidity ?? 0)}; 24h DEX volume is ${dollars(data.dex.token.volume24h ?? 0)}.`);
  if (dexIntent && data.dex.security?.level) evidence.push(`CMC DEX security classifies ${data.dex.token?.symbol ?? "the token"} as ${data.dex.security.level}.`);
  if (sol?.change24h != null && sol.volumeChange24h != null && sol.change24h > 0 && sol.volumeChange24h < 0) risks.push("Price is rising while reported 24h volume is falling; require volume confirmation.");
  if (data.derivatives.fundingRate != null && data.derivatives.fundingRate > 0) risks.push("Positive funding can indicate crowded long exposure; watch the next liquidation update.");
  if (data.fearAndGreed.value != null && data.fearAndGreed.value >= 75) risks.push("Fear & Greed is in the extreme greed range.");
  if (rwaIntent && !data.rwaDetail) risks.push("The detailed RWA feed is unavailable; issuer comparison is incomplete.");
  if (dexIntent && !data.dex.security) risks.push("DEX security checks are unavailable; do not treat the token as screened.");
  if (!evidence.length) risks.push("CMC data is unavailable; refresh the board before deciding.");
  const direction = sol?.change24h == null ? "requires a current quote" : sol.change24h >= 0 ? "is constructive" : "is under pressure";
  const summary = rwaIntent
    ? `The tokenized-asset thesis needs issuer and liquidity comparison before a decision. ${evidence[0] ?? "Refresh CMC data to begin."}`
    : dexIntent
      ? `DEX activity needs pool depth, security checks and holder context before a decision. ${evidence[0] ?? "Refresh CMC data to begin."}`
      : `SOL momentum ${direction}. Confirm the price move against volume and leverage before acting.`;
  const confidence = Math.min(85, Math.max(30, 40 + evidence.length * 7 - risks.length * 4));
  return {
    prompt: question,
    createdAt: new Date().toISOString(),
    widgets,
    thesis: { summary, confidence, evidence: evidence.slice(0, 6), risks: risks.slice(0, 5), sourceRetrievedAt: data.retrievedAt },
    monitor: {
      status: "pending",
      volumeChangeBelow: 0,
      fundingAbove: 0,
      description: "Flag when SOL price rises while 24h volume contracts and SOL funding is positive.",
    },
    rationale: rwaIntent ? "The board pairs RWA market totals with issuer level evidence." : dexIntent ? "The board links DEX activity, liquidity, holders and safety checks." : "The board connects price action, market regime and leverage signals to a reviewable thesis.",
    sourceRetrievedAt: data.retrievedAt,
  };
}
