export type CmcAssetQuote = {
  id: number;
  name: string;
  symbol: string;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  change7d: number | null;
  change1h: number | null;
  change30d: number | null;
  change90d: number | null;
  marketCap: number | null;
  marketCapDominance: number | null;
  fullyDilutedMarketCap: number | null;
  volume24h: number | null;
  cexVolume24h: number | null;
  dexVolume24h: number | null;
  volumeChange24h: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  marketPairs: number | null;
  dateAdded: string | null;
  lastUpdated: string | null;
};

export type CmcCategory = {
  id: string;
  name: string;
  tokenCount: number | null;
  marketCap: number | null;
  volume24h: number | null;
  change24h: number | null;
  volumeChange24h: number | null;
};

export type CmcBenchmark = {
  value: number | null;
  change24h: number | null;
  updatedAt: string | null;
  constituents: Array<{ id: number; symbol: string; name: string; weight: number | null }>;
};

export type CmcRwaAsset = {
  id: number;
  rank: number | null;
  name: string;
  symbol: string;
  type: string;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  updatedAt: string | null;
};

export type CmcHistorySeries = {
  id: number;
  name: string;
  symbol: string;
  points: Array<{ timestamp: string; price: number; volume24h: number | null; marketCap: number | null }>;
};

export type CmcLiquidationLeader = {
  id: number;
  name: string;
  symbol: string | null;
  total24h: number | null;
  longs24h: number | null;
  shorts24h: number | null;
};

export type CmcDexSnapshot = {
  token: {
    name: string;
    symbol: string;
    address: string;
    platform: string;
    price: number | null;
    marketCap: number | null;
    liquidity: number | null;
    riskLevel: string | null;
    volume24h: number | null;
    transactions24h: number | null;
    buys24h: number | null;
    sells24h: number | null;
    change24h: number | null;
  } | null;
  pools: Array<{ address: string; pair: string; venue: string; liquidity: number | null; volume24h: number | null }>;
  security: { level: string | null; category: string | null; checks: Array<{ label: string; hit: boolean }> } | null;
  holderCount: number | null;
  swaps: Array<{ timestamp: string; side: string; pair: string; venue: string; valueUsd: number | null }>;
  liquidityChanges: Array<{ timestamp: string; side: string; pair: string; venue: string; valueUsd: number | null }>;
};

export type CmcOverview = {
  health?: "healthy" | "partial" | "unavailable";
  feeds?: Record<string, { status: "ok" | "error" | "pending"; updatedAt: string | null; message?: string }>;
  mode: "full" | "public";
  retrievedAt: string;
  assets: CmcAssetQuote[];
  listings: CmcAssetQuote[];
  categories: CmcCategory[];
  benchmarks: { cmc20: CmcBenchmark | null; cmc100: CmcBenchmark | null };
  rwaAssets: CmcRwaAsset[];
  history: CmcHistorySeries[];
  assetProfile: {
    name: string;
    symbol: string;
    description: string | null;
    category: string | null;
    logo: string | null;
    website: string | null;
    tags: string[];
  } | null;
  conversion: { from: string; amount: number; usdValue: number | null; updatedAt: string | null } | null;
  exchangeDirectory: Array<{ id: number; name: string; slug: string; active: boolean }>;
  fiats: Array<{ id: number; name: string; symbol: string; sign: string | null }>;
  derivativeVenues: Array<{ id: number; name: string; rank: number | null; openInterest: number | null; volume24h: number | null; marketPairs: number | null }>;
  liquidationLeaders: { assets: CmcLiquidationLeader[]; exchanges: CmcLiquidationLeader[] };
  dex: CmcDexSnapshot;
  rwaDetail: {
    name: string;
    symbol: string;
    price: number | null;
    marketCap: number | null;
    volume24h: number | null;
    tokens: Array<{ name: string; symbol: string; issuer: string; price: number | null; marketCap: number | null; volume24h: number | null }>;
    issuers: Array<{ id: string; name: string; website: string | null; tokenCount: number | null }>;
  } | null;
  capabilities: Array<{ name: string; status: "live" | "locked"; detail: string }>;
  apiUsage: {
    monthlyLimit: number | null;
    monthlyUsed: number | null;
    monthlyLeft: number | null;
    minuteLimit: number | null;
    minuteUsed: number | null;
    minuteLeft: number | null;
    resetsAt: string | null;
  } | null;
  global: {
    totalMarketCap: number | null;
    totalVolume24h: number | null;
    btcDominance: number | null;
    ethDominance: number | null;
    marketCapChange24h: number | null;
  };
  fearAndGreed: { value: number | null; label: string | null; updatedAt: string | null };
  altcoinSeason: { value: number | null; label: string | null; updatedAt: string | null };
  liquidations: {
    total1h: number | null;
    total4h: number | null;
    total24h: number | null;
    longs24h: number | null;
    shorts24h: number | null;
    updatedAt: string | null;
    available: boolean;
  };
  derivatives: {
    fundingRate: number | null;
    openInterest: number | null;
    venue: string | null;
    pair: string | null;
    updatedAt: string | null;
    available: boolean;
  };
  errors: string[];
};

const ASSET_IDS = "1,1027,5426";

function numberOrNull(value: unknown): number | null {
  if (value == null || typeof value === "boolean" || (typeof value === "string" && !value.trim())) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function findUsdQuote(value: unknown): Record<string, unknown> {
  const item = record(value);
  const quote = item.quote;
  if (Array.isArray(quote)) {
    return record(quote.find((entry) => record(entry).symbol === "USD") ?? quote[0]);
  }
  const quotes = record(quote);
  return record(quotes.USD ?? Object.values(quotes)[0]);
}

const endpointCache = new Map<string, { until: number; promise: Promise<Record<string, unknown>> }>();

async function requestCmc(path: string, apiKey?: string, revalidate = 60): Promise<Record<string, unknown>> {
  const cacheKey = `${apiKey ? "keyed" : "public"}:${path}`;
  const cached = endpointCache.get(cacheKey);
  if (cached && cached.until > Date.now()) return cached.promise;
  const base = apiKey
    ? "https://pro-api.coinmarketcap.com"
    : "https://pro-api.coinmarketcap.com/public-api";
  const promise = (async () => {
    const response = await fetch(`${base}${path}`, {
      signal: AbortSignal.timeout(12000),
      headers: apiKey ? { Accept: "application/json", "X-CMC_PRO_API_KEY": apiKey } : { Accept: "application/json" },
      next: { revalidate },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    const payload = record(await response.json());
    const status = record(payload.status);
    if (numberOrNull(status.error_code) && numberOrNull(status.error_code) !== 0) {
      throw new Error(stringOrNull(status.error_message) ?? "CoinMarketCap request failed");
    }
    return payload;
  });
  const pending = promise();
  endpointCache.set(cacheKey, { until: Date.now() + revalidate * 1000, promise: pending });
  try { return await pending; }
  catch (error) { endpointCache.delete(cacheKey); throw error; }
}

function parseAssets(payload: Record<string, unknown>): CmcAssetQuote[] {
  const raw = payload.data;
  const items = Array.isArray(raw) ? raw : Object.values(record(raw));
  return items.map((value) => {
    const item = record(value);
    const quote = findUsdQuote(item);
    return {
      id: numberOrNull(item.id) ?? 0,
      name: stringOrNull(item.name) ?? "Unknown",
      symbol: stringOrNull(item.symbol) ?? "—",
      rank: numberOrNull(item.cmc_rank),
      price: numberOrNull(quote.price),
      change24h: numberOrNull(quote.percent_change_24h),
      change7d: numberOrNull(quote.percent_change_7d),
      change1h: numberOrNull(quote.percent_change_1h),
      change30d: numberOrNull(quote.percent_change_30d),
      change90d: numberOrNull(quote.percent_change_90d),
      marketCap: numberOrNull(quote.market_cap),
      marketCapDominance: numberOrNull(quote.market_cap_dominance),
      fullyDilutedMarketCap: numberOrNull(quote.fully_diluted_market_cap),
      volume24h: numberOrNull(quote.volume_24h),
      cexVolume24h: numberOrNull(quote.cex_volume_24h),
      dexVolume24h: numberOrNull(quote.dex_volume_24h),
      volumeChange24h: numberOrNull(quote.volume_change_24h),
      circulatingSupply: numberOrNull(item.circulating_supply),
      totalSupply: numberOrNull(item.total_supply),
      maxSupply: numberOrNull(item.max_supply),
      marketPairs: numberOrNull(item.num_market_pairs),
      dateAdded: stringOrNull(item.date_added),
      lastUpdated: stringOrNull(quote.last_updated),
    };
  }).sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
}

function parseCategories(payload: Record<string, unknown>): CmcCategory[] {
  return array(payload.data).map((value) => {
    const item = record(value);
    return {
      id: stringOrNull(item.id) ?? "unknown",
      name: stringOrNull(item.name ?? item.title) ?? "Unknown category",
      tokenCount: numberOrNull(item.num_tokens),
      marketCap: numberOrNull(item.market_cap),
      volume24h: numberOrNull(item.volume),
      change24h: numberOrNull(item.market_cap_change ?? item.avg_price_change),
      volumeChange24h: numberOrNull(item.volume_change),
    };
  }).sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
}

function parseBenchmark(payload: Record<string, unknown>): CmcBenchmark | null {
  const data = record(payload.data);
  if (!Object.keys(data).length) return null;
  return {
    value: numberOrNull(data.value),
    change24h: numberOrNull(data.value_24h_percentage_change),
    updatedAt: stringOrNull(data.last_update),
    constituents: array(data.constituents).map((value) => {
      const item = record(value);
      return {
        id: numberOrNull(item.id) ?? 0,
        symbol: stringOrNull(item.symbol) ?? "—",
        name: stringOrNull(item.name) ?? "Unknown",
        weight: numberOrNull(item.weight),
      };
    }),
  };
}

function parseRwaAssets(payload: Record<string, unknown>): CmcRwaAsset[] {
  const data = record(payload.data);
  return array(data.rwa_assets).map((value) => {
    const item = record(value);
    const quote = record(array(item.quotes)[0]);
    return {
      id: numberOrNull(item.rwa_id) ?? 0,
      rank: numberOrNull(item.rwa_rank),
      name: stringOrNull(item.name) ?? "Unknown",
      symbol: stringOrNull(item.symbol) ?? "—",
      type: stringOrNull(item.asset_type) ?? "asset",
      price: numberOrNull(item.average_tokenized_price ?? quote.average_tokenized_price),
      marketCap: numberOrNull(item.tokenized_market_cap ?? quote.tokenized_market_cap),
      volume24h: numberOrNull(item.tokenized_volume_24h ?? quote.tokenized_volume_24h),
      updatedAt: stringOrNull(item.last_updated ?? quote.last_updated),
    };
  });
}

function parseApiUsage(payload: Record<string, unknown>): NonNullable<CmcOverview["apiUsage"]> {
  const data = record(payload.data);
  const plan = record(data.plan);
  const usage = record(data.usage);
  const minute = record(usage.current_minute);
  const month = record(usage.current_month);
  return {
    monthlyLimit: numberOrNull(plan.credit_limit_monthly),
    monthlyUsed: numberOrNull(month.credits_used),
    monthlyLeft: numberOrNull(month.credits_left),
    minuteLimit: numberOrNull(plan.rate_limit_minute),
    minuteUsed: numberOrNull(minute.requests_made),
    minuteLeft: numberOrNull(minute.requests_left),
    resetsAt: stringOrNull(plan.credit_limit_monthly_reset_timestamp),
  };
}

function parseGlobal(payload: Record<string, unknown>): CmcOverview["global"] {
  const data = record(payload.data);
  const quote = findUsdQuote(data);
  return {
    totalMarketCap: numberOrNull(quote.total_market_cap),
    totalVolume24h: numberOrNull(quote.total_volume_24h),
    btcDominance: numberOrNull(data.btc_dominance),
    ethDominance: numberOrNull(data.eth_dominance),
    marketCapChange24h: numberOrNull(quote.total_market_cap_yesterday_percentage_change),
  };
}

function parseIndex(payload: Record<string, unknown>, kind: "fear" | "season") {
  const raw = payload.data;
  const data = record(Array.isArray(raw) ? raw[0] : raw);
  const value = numberOrNull(data.value ?? data.score ?? data.altcoin_index ?? data.altcoin_season_index);
  const fallback = kind === "fear"
    ? value == null ? null : value < 25 ? "Extreme fear" : value < 45 ? "Fear" : value < 56 ? "Neutral" : value < 76 ? "Greed" : "Extreme greed"
    : value == null ? null : value >= 75 ? "Altcoin season" : value <= 25 ? "Bitcoin season" : "Neutral";
  return {
    value,
    label: stringOrNull(data.value_classification ?? data.name ?? data.label) ?? fallback,
    updatedAt: stringOrNull(data.update_time ?? data.snapshot_time ?? data.timestamp ?? data.last_updated),
  };
}

function parseLiquidations(payload: Record<string, unknown>): CmcOverview["liquidations"] {
  const data = record(payload.data);
  const quote = record(array(data.quotes)[0]);
  return {
    total1h: numberOrNull(quote.total_liquidations_1h),
    total4h: numberOrNull(quote.total_liquidations_4h),
    total24h: numberOrNull(quote.total_liquidations_24h),
    longs24h: numberOrNull(quote.long_liquidations_24h),
    shorts24h: numberOrNull(quote.short_liquidations_24h),
    updatedAt: stringOrNull(quote.last_updated),
    available: Object.keys(quote).length > 0,
  };
}

function parseDerivatives(payload: Record<string, unknown>): CmcOverview["derivatives"] {
  const data = record(payload.data);
  const pairs = array(data.market_pairs);
  const selected = record(pairs.find((entry) => array(record(entry).exchange_reported_quotes).some((quote) => numberOrNull(record(quote).open_interest) !== null)) ?? pairs[0]);
  const reports = array(selected.exchange_reported_quotes);
  const report = record(reports.find((entry) => record(entry).symbol === "USD") ?? reports[0]);
  const exchange = record(selected.exchange);
  return {
    fundingRate: numberOrNull(report.funding_rate),
    openInterest: numberOrNull(report.open_interest),
    venue: stringOrNull(exchange.exchange_name),
    pair: stringOrNull(selected.market_pair),
    updatedAt: stringOrNull(report.last_updated),
    available: pairs.length > 0,
  };
}

function parseHistory(payload: Record<string, unknown>): CmcHistorySeries[] {
  return Object.values(record(payload.data)).map((value) => {
    const item = record(value);
    return {
      id: numberOrNull(item.id) ?? 0,
      name: stringOrNull(item.name) ?? "Unknown",
      symbol: stringOrNull(item.symbol) ?? "—",
      points: array(item.quotes).map((entry) => {
        const point = record(entry);
        const quote = findUsdQuote(point);
        return {
          timestamp: stringOrNull(point.timestamp) ?? stringOrNull(quote.timestamp) ?? "",
          price: numberOrNull(quote.price) ?? 0,
          volume24h: numberOrNull(quote.volume_24h),
          marketCap: numberOrNull(quote.market_cap),
        };
      }).filter((point) => point.timestamp && point.price > 0),
    };
  });
}

function parseProfile(payload: Record<string, unknown>): CmcOverview["assetProfile"] {
  const item = record(record(payload.data)["5426"]);
  if (!Object.keys(item).length) return null;
  const urls = record(item.urls);
  return {
    name: stringOrNull(item.name) ?? "Solana",
    symbol: stringOrNull(item.symbol) ?? "SOL",
    description: stringOrNull(item.description),
    category: stringOrNull(item.category),
    logo: stringOrNull(item.logo),
    website: stringOrNull(array(urls.website)[0]),
    tags: array(item.tags).map((tag) => typeof tag === "string" ? tag : stringOrNull(record(tag).name)).filter((tag): tag is string => Boolean(tag)).slice(0, 8),
  };
}

function parseConversion(payload: Record<string, unknown>): CmcOverview["conversion"] {
  const data = record(payload.data);
  const quote = findUsdQuote(data);
  if (!Object.keys(data).length) return null;
  return {
    from: stringOrNull(data.symbol) ?? "BTC",
    amount: numberOrNull(data.amount) ?? 1,
    usdValue: numberOrNull(quote.price),
    updatedAt: stringOrNull(quote.last_updated),
  };
}

function parseExchangeDirectory(payload: Record<string, unknown>): CmcOverview["exchangeDirectory"] {
  return array(payload.data).map((value) => {
    const item = record(value);
    return {
      id: numberOrNull(item.id) ?? 0,
      name: stringOrNull(item.name) ?? "Unknown",
      slug: stringOrNull(item.slug) ?? "unknown",
      active: numberOrNull(item.is_active) !== 0,
    };
  }).filter((item) => item.id > 0);
}

function parseFiats(payload: Record<string, unknown>): CmcOverview["fiats"] {
  return array(payload.data).map((value) => {
    const item = record(value);
    return {
      id: numberOrNull(item.id) ?? 0,
      name: stringOrNull(item.name) ?? "Unknown",
      symbol: stringOrNull(item.symbol) ?? "—",
      sign: stringOrNull(item.sign),
    };
  }).filter((item) => item.id > 0);
}

function parseDerivativeVenues(payload: Record<string, unknown>): CmcOverview["derivativeVenues"] {
  return array(record(payload.data).exchanges).map((value) => {
    const item = record(value);
    const quote = record(array(item.quotes)[0]);
    return {
      id: numberOrNull(item.exchange_id) ?? 0,
      name: stringOrNull(item.exchange_name) ?? "Unknown",
      rank: numberOrNull(item.rank),
      openInterest: numberOrNull(quote.open_interest_usd),
      volume24h: numberOrNull(quote.derivative_volume_usd),
      marketPairs: numberOrNull(item.num_market_pairs),
    };
  });
}

function parseLiquidationLeaders(payload: Record<string, unknown>, kind: "assets" | "exchanges"): CmcLiquidationLeader[] {
  const data = record(payload.data);
  const items = kind === "assets" ? array(data.cryptocurrencies) : array(data.exchanges);
  return items.map((value) => {
    const item = record(value);
    const quote = record(array(item.quotes)[0]);
    return {
      id: numberOrNull(kind === "assets" ? item.crypto_id : item.exchange_id) ?? 0,
      name: stringOrNull(item.name) ?? "Unknown",
      symbol: stringOrNull(item.symbol),
      total24h: numberOrNull(quote.total_liquidations_24h),
      longs24h: numberOrNull(quote.long_liquidations_24h),
      shorts24h: numberOrNull(quote.short_liquidations_24h),
    };
  });
}

function parseDexToken(payload: Record<string, unknown>): Pick<CmcDexSnapshot, "token" | "pools"> {
  const data = record(payload.data);
  if (!Object.keys(data).length) return { token: null, pools: [] };
  const stats = record(array(data.sts).find((entry) => record(entry).tp === "24h"));
  return {
    token: {
      name: stringOrNull(data.n) ?? "Unknown",
      symbol: stringOrNull(data.sym) ?? "—",
      address: stringOrNull(data.addr) ?? "",
      platform: stringOrNull(data.plt) ?? "Unknown",
      price: numberOrNull(data.p),
      marketCap: numberOrNull(data.mcap),
      liquidity: numberOrNull(data.liqUsd),
      riskLevel: stringOrNull(data.rl),
      volume24h: numberOrNull(stats.vu),
      transactions24h: numberOrNull(stats.txs),
      buys24h: numberOrNull(stats.nb),
      sells24h: numberOrNull(stats.ns),
      change24h: numberOrNull(stats.pc) == null ? null : (numberOrNull(stats.pc) ?? 0) * 100,
    },
    pools: array(data.pls).slice(0, 6).map((value) => {
      const item = record(value);
      const token0 = record(item.t0);
      const token1 = record(item.t1);
      return {
        address: stringOrNull(item.addr ?? item.fa) ?? "",
        pair: `${stringOrNull(token0.sym) ?? "?"}/${stringOrNull(token1.sym) ?? "?"}`,
        venue: stringOrNull(item.exn) ?? "Unknown",
        liquidity: numberOrNull(item.liqUsd),
        volume24h: numberOrNull(item.v24),
      };
    }),
  };
}

function parseDexSecurity(payload: Record<string, unknown>): CmcDexSnapshot["security"] {
  const raw = payload.data;
  const item = record(Array.isArray(raw) ? raw[0] : raw);
  if (!Object.keys(item).length) return null;
  return {
    level: stringOrNull(item.securityLevel),
    category: stringOrNull(item.categoryLevel),
    checks: array(item.securityItems).slice(0, 8).map((value) => {
      const check = record(value);
      return { label: stringOrNull(check.code) ?? "Security check", hit: Boolean(check.isHit) };
    }),
  };
}

function parseDexSwaps(payload: Record<string, unknown>): CmcDexSnapshot["swaps"] {
  return array(record(payload.data).swaps).slice(0, 6).map((value) => {
    const item = record(value);
    return {
      timestamp: new Date(numberOrNull(item.ts) ?? Date.now()).toISOString(),
      side: stringOrNull(item.tp) ?? "swap",
      pair: `${stringOrNull(item.t0s) ?? "?"}/${stringOrNull(item.t1s) ?? "?"}`,
      venue: stringOrNull(item.en) ?? "Unknown",
      valueUsd: numberOrNull(item.v),
    };
  });
}

function parseLiquidityChanges(payload: Record<string, unknown>): CmcDexSnapshot["liquidityChanges"] {
  return array(record(payload.data).lcs).slice(0, 6).map((value) => {
    const item = record(value);
    return {
      timestamp: new Date(numberOrNull(item.ts) ?? Date.now()).toISOString(),
      side: stringOrNull(item.tp) ?? "change",
      pair: `${stringOrNull(item.t0s) ?? "?"}/${stringOrNull(item.t1s) ?? "?"}`,
      venue: stringOrNull(item.en) ?? "Unknown",
      valueUsd: numberOrNull(item.tu),
    };
  });
}

function parseRwaDetail(quotePayload: Record<string, unknown>, issuerPayload: Record<string, unknown>): CmcOverview["rwaDetail"] {
  const item = record(array(record(quotePayload.data).rwa_assets)[0]);
  if (!Object.keys(item).length) return null;
  const quote = record(array(item.quotes)[0]);
  return {
    name: stringOrNull(item.name) ?? "Unknown",
    symbol: stringOrNull(item.symbol) ?? "—",
    price: numberOrNull(item.average_tokenized_price ?? quote.average_tokenized_price),
    marketCap: numberOrNull(item.tokenized_market_cap ?? quote.tokenized_market_cap),
    volume24h: numberOrNull(item.tokenized_volume_24h ?? quote.tokenized_volume_24h),
    tokens: array(item.tokens).slice(0, 8).map((value) => {
      const token = record(value);
      return {
        name: stringOrNull(token.name) ?? "Unknown",
        symbol: stringOrNull(token.symbol) ?? "—",
        issuer: stringOrNull(token.issuer_name) ?? "Unknown",
        price: numberOrNull(token.price),
        marketCap: numberOrNull(token.market_cap),
        volume24h: numberOrNull(token.volume_24h),
      };
    }),
    issuers: array(record(issuerPayload.data).issuers).slice(0, 8).map((value) => {
      const issuer = record(value);
      return {
        id: stringOrNull(issuer.issuer_id) ?? "unknown",
        name: stringOrNull(issuer.name) ?? "Unknown",
        website: stringOrNull(issuer.website),
        tokenCount: numberOrNull(issuer.num_tokens),
      };
    }),
  };
}

export async function getCmcOverview(scope: "core" | "all" = "all", onProgress?: (data: CmcOverview) => void, selectedFeeds?: readonly string[]): Promise<CmcOverview> {
  const apiKey = process.env.CMC_PRO_API_KEY?.trim();
  const errors: string[] = [];
  const jupAddress = "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN";
  const endpoints: Record<string, [string, number]> = {
    assets: [`/v3/cryptocurrency/quotes/latest?id=${ASSET_IDS}&convert=USD`, 60],
    global: ["/v1/global-metrics/quotes/latest?convert=USD", 60],
    fear: ["/v3/fear-and-greed/latest", 300],
    season: ["/v1/altcoin-season-index/latest", 300],
    listings: ["/v3/cryptocurrency/listings/latest?limit=30&convert=USD", 60],
    categories: ["/v1/cryptocurrency/categories?limit=16&convert=USD", 300],
    cmc20: ["/v3/index/cmc20-latest", 300],
    cmc100: ["/v3/index/cmc100-latest", 300],
  };
  if (apiKey) Object.assign(endpoints, {
    liquidations: ["/v5/derivatives/liquidations/quotes/latest?convert=USD", 60],
    derivatives: ["/v5/cryptocurrency/derivatives/market-pairs/list/latest?crypto_id=5426&limit=100&convert=USD", 60],
    rwa: ["/v5/real-world-assets/assets/list?limit=8", 300],
    keyInfo: ["/v1/key/info", 300],
    history: ["/v3/cryptocurrency/quotes/historical?id=1,1027,5426&count=14&interval=daily&convert=USD", 300],
    profile: ["/v2/cryptocurrency/info?id=5426", 3600],
    conversion: ["/v2/tools/price-conversion?amount=1&id=1&convert=USD", 300],
    exchangeDirectory: ["/v1/exchange/map?limit=8", 3600],
    fiats: ["/v1/fiat/map?limit=12", 3600],
    derivativeVenues: ["/v5/exchange/derivatives/list?limit=8", 300],
    liquidationAssets: ["/v5/derivatives/liquidations/cryptocurrency/list/latest?limit=6&convert=USD", 60],
    liquidationExchanges: ["/v5/derivatives/liquidations/exchange/list/latest?limit=6&convert=USD", 60],
    dexToken: [`/v1/dex/token?platform=solana&address=${jupAddress}`, 60],
    dexSecurity: [`/v1/dex/security/detail?platformName=solana&address=${jupAddress}`, 300],
    dexHolders: [`/v1/dex/holders/count?platform=solana&tokenAddress=${jupAddress}`, 300],
    dexSwaps: [`/v1/dex/tokens/transactions?platform=solana&address=${jupAddress}&limit=6`, 60],
    dexLiquidity: [`/v1/dex/liquidity-change/list?platform=solana&address=${jupAddress}&sortBy=ts&sortType=desc`, 60],
    rwaGold: ["/v5/real-world-assets/quotes/latest?rwa_id=1&convert=USD", 300],
    rwaIssuers: ["/v5/real-world-assets/issuers/list?limit=8", 3600],
  });
  const selected = selectedFeeds ? new Set(selectedFeeds) : null;
  const entries = Object.entries(endpoints).filter(([name]) =>
    (scope === "all" || ["assets", "listings", "history"].includes(name)) &&
    (!selected || selected.has(name))
  );
  const results: Record<string, Record<string, unknown>> = {};
  const feeds: NonNullable<CmcOverview["feeds"]> = {};
  for (const [name] of entries) feeds[name] = { status: "pending", updatedAt: null };
  await Promise.all(entries.map(async ([name, [path, revalidate]]) => {
    try {
      const result = await requestCmc(path, apiKey, revalidate);
      results[name] = result;
      feeds[name] = { status: "ok", updatedAt: stringOrNull(record(result.status).timestamp) ?? new Date().toISOString() };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unavailable";
      errors.push(`${name}: ${message}`);
      feeds[name] = { status: "error", updatedAt: null, message };
    }
    onProgress?.(snapshot());
  }));
  return snapshot();
  function snapshot(): CmcOverview {
  const emptyLiquidations: CmcOverview["liquidations"] = { total1h: null, total4h: null, total24h: null, longs24h: null, shorts24h: null, updatedAt: null, available: false };
  const emptyDerivatives: CmcOverview["derivatives"] = { fundingRate: null, openInterest: null, venue: null, pair: null, updatedAt: null, available: false };
  const dexToken = results.dexToken ? parseDexToken(results.dexToken) : { token: null, pools: [] };
  return {
    health: !Object.keys(results).length ? "unavailable" : errors.length ? "partial" : "healthy",
    feeds: { ...feeds },
    mode: apiKey ? "full" : "public",
    retrievedAt: new Date().toISOString(),
    assets: results.assets ? parseAssets(results.assets) : [],
    listings: results.listings ? parseAssets(results.listings) : [],
    categories: results.categories ? parseCategories(results.categories) : [],
    benchmarks: {
      cmc20: results.cmc20 ? parseBenchmark(results.cmc20) : null,
      cmc100: results.cmc100 ? parseBenchmark(results.cmc100) : null,
    },
    rwaAssets: results.rwa ? parseRwaAssets(results.rwa) : [],
    history: results.history ? parseHistory(results.history) : [],
    assetProfile: results.profile ? parseProfile(results.profile) : null,
    conversion: results.conversion ? parseConversion(results.conversion) : null,
    exchangeDirectory: results.exchangeDirectory ? parseExchangeDirectory(results.exchangeDirectory) : [],
    fiats: results.fiats ? parseFiats(results.fiats) : [],
    derivativeVenues: results.derivativeVenues ? parseDerivativeVenues(results.derivativeVenues) : [],
    liquidationLeaders: {
      assets: results.liquidationAssets ? parseLiquidationLeaders(results.liquidationAssets, "assets") : [],
      exchanges: results.liquidationExchanges ? parseLiquidationLeaders(results.liquidationExchanges, "exchanges") : [],
    },
    dex: {
      ...dexToken,
      security: results.dexSecurity ? parseDexSecurity(results.dexSecurity) : null,
      holderCount: results.dexHolders ? numberOrNull(record(results.dexHolders.data).count) : null,
      swaps: results.dexSwaps ? parseDexSwaps(results.dexSwaps) : [],
      liquidityChanges: results.dexLiquidity ? parseLiquidityChanges(results.dexLiquidity) : [],
    },
    rwaDetail: results.rwaGold ? parseRwaDetail(results.rwaGold, results.rwaIssuers ?? {}) : null,
    capabilities: [
      { name: "Market, indices and categories", status: results.assets && results.categories ? "live" : "locked", detail: "Latest quotes, rankings and sector context" },
      { name: "Historical comparisons", status: results.history ? "live" : "locked", detail: "Daily BTC, ETH and SOL prices" },
      { name: "Derivatives and liquidations", status: results.derivativeVenues && results.liquidationAssets ? "live" : "locked", detail: "Venues, open interest and forced closures" },
      { name: "DEX token intelligence", status: results.dexToken && results.dexSecurity ? "live" : "locked", detail: "JUP pools, swaps, holders and risk checks" },
      { name: "Tokenized real-world assets", status: results.rwaGold ? "live" : "locked", detail: "Gold tokens and issuers" },
      { name: "CMC AI, discovery and airdrops", status: "locked", detail: "These endpoints returned 403 for this key during entitlement checks" },
    ],
    apiUsage: results.keyInfo ? parseApiUsage(results.keyInfo) : null,
    global: results.global ? parseGlobal(results.global) : { totalMarketCap: null, totalVolume24h: null, btcDominance: null, ethDominance: null, marketCapChange24h: null },
    fearAndGreed: results.fear ? parseIndex(results.fear, "fear") : { value: null, label: null, updatedAt: null },
    altcoinSeason: results.season ? parseIndex(results.season, "season") : { value: null, label: null, updatedAt: null },
    liquidations: results.liquidations ? parseLiquidations(results.liquidations) : emptyLiquidations,
    derivatives: results.derivatives ? parseDerivatives(results.derivatives) : emptyDerivatives,
    errors: [...errors],
  };
  }
}
