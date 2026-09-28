import type { CmcOverview } from "./cmc";

/** Retain last-known values for pending/failed feeds without relabelling them fresh. */
export function mergeMarket(previous: CmcOverview | null, incoming: CmcOverview): CmcOverview {
  if (!previous) return incoming;
  const next = { ...incoming };
  const ownership: Partial<Record<keyof CmcOverview, string>> = {
    assets: "assets", listings: "listings", categories: "categories", history: "history",
    assetProfile: "profile", conversion: "conversion", exchangeDirectory: "exchangeDirectory",
    fiats: "fiats", derivativeVenues: "derivativeVenues", rwaAssets: "rwa", rwaDetail: "rwaGold",
    apiUsage: "keyInfo", global: "global", fearAndGreed: "fear", altcoinSeason: "season",
    liquidations: "liquidations", derivatives: "derivatives",
  };
  for (const [property, feed] of Object.entries(ownership)) {
    if (incoming.feeds?.[feed]?.status !== "ok") Object.assign(next, { [property]: previous[property as keyof CmcOverview] });
  }
  const keep = (feed: string) => incoming.feeds?.[feed]?.status !== "ok";
  next.benchmarks = { cmc20: keep("cmc20") ? previous.benchmarks.cmc20 : incoming.benchmarks.cmc20, cmc100: keep("cmc100") ? previous.benchmarks.cmc100 : incoming.benchmarks.cmc100 };
  next.liquidationLeaders = { assets: keep("liquidationAssets") ? previous.liquidationLeaders.assets : incoming.liquidationLeaders.assets, exchanges: keep("liquidationExchanges") ? previous.liquidationLeaders.exchanges : incoming.liquidationLeaders.exchanges };
  next.dex = { token: keep("dexToken") ? previous.dex.token : incoming.dex.token, pools: keep("dexToken") ? previous.dex.pools : incoming.dex.pools, security: keep("dexSecurity") ? previous.dex.security : incoming.dex.security, holderCount: keep("dexHolders") ? previous.dex.holderCount : incoming.dex.holderCount, swaps: keep("dexSwaps") ? previous.dex.swaps : incoming.dex.swaps, liquidityChanges: keep("dexLiquidity") ? previous.dex.liquidityChanges : incoming.dex.liquidityChanges };
  return next;
}

export async function readMarketStream(response: Response, receive: (data: CmcOverview, done: boolean) => void) {
  if (!response.ok || !response.body) throw new Error("Market connection failed. Try again.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "", finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
        if (!line.trim()) continue;
        const message = JSON.parse(line);
        if (message.error) throw new Error(message.error);
        if (!message.data || typeof message.done !== "boolean") throw new Error("Invalid market response. Try again.");
        receive(message.data, message.done);
        finished ||= message.done;
      }
    }
    if (!finished) throw new Error("Connection interrupted. Some feeds may be stale. Retry to finish loading.");
  } finally { reader.releaseLock(); }
}
