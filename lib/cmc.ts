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

export type CmcOverview = {
  mode: "full" | "public";
  retrievedAt: string;
  assets: CmcAssetQuote[];
  listings: CmcAssetQuote[];
  categories: CmcCategory[];
  benchmarks: { cmc20: CmcBenchmark | null; cmc100: CmcBenchmark | null };
  rwaAssets: CmcRwaAsset[];
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

async function requestCmc(path: string, apiKey?: string, revalidate = 60): Promise<Record<string, unknown>> {
  const base = apiKey
    ? "https://pro-api.coinmarketcap.com"
    : "https://pro-api.coinmarketcap.com/public-api";
  const response = await fetch(`${base}${path}`, {
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

export async function getCmcOverview(): Promise<CmcOverview> {
  const apiKey = process.env.CMC_PRO_API_KEY?.trim();
  const errors: string[] = [];
  const coreTasks = [
    requestCmc(`/v3/cryptocurrency/quotes/latest?id=${ASSET_IDS}&convert=USD`, apiKey),
    requestCmc("/v1/global-metrics/quotes/latest?convert=USD", apiKey),
    requestCmc("/v3/fear-and-greed/latest", apiKey, 300),
    requestCmc("/v1/altcoin-season-index/latest", apiKey, 300),
    requestCmc("/v3/cryptocurrency/listings/latest?limit=30&convert=USD", apiKey),
    requestCmc("/v1/cryptocurrency/categories?limit=16&convert=USD", apiKey, 300),
    requestCmc("/v3/index/cmc20-latest", apiKey, 300),
    requestCmc("/v3/index/cmc100-latest", apiKey, 300),
  ];
  const premiumTasks = apiKey ? [
    requestCmc("/v5/derivatives/liquidations/quotes/latest?convert=USD", apiKey),
    requestCmc("/v5/cryptocurrency/derivatives/market-pairs/list/latest?crypto_id=5426&limit=100&convert=USD", apiKey),
    requestCmc("/v5/real-world-assets/assets/list?limit=8", apiKey, 300),
    requestCmc("/v1/key/info", apiKey, 300),
  ] : [];
  const results = await Promise.allSettled([...coreTasks, ...premiumTasks]);
  const [assetsResult, globalResult, fearResult, seasonResult, listingsResult, categoriesResult, cmc20Result, cmc100Result] = results;
  const [liquidationsResult, derivativesResult, rwaResult, keyInfoResult] = results.slice(8);

  const emptyLiquidations: CmcOverview["liquidations"] = { total1h: null, total4h: null, total24h: null, longs24h: null, shorts24h: null, updatedAt: null, available: false };
  const emptyDerivatives: CmcOverview["derivatives"] = { fundingRate: null, openInterest: null, venue: null, pair: null, updatedAt: null, available: false };
  let liquidations = emptyLiquidations;
  let derivatives = emptyDerivatives;
  let rwaAssets: CmcRwaAsset[] = [];
  let apiUsage: CmcOverview["apiUsage"] = null;

  if (apiKey) {
    if (liquidationsResult?.status === "fulfilled") liquidations = parseLiquidations(liquidationsResult.value);
    else errors.push(`Liquidations: ${liquidationsResult.reason instanceof Error ? liquidationsResult.reason.message : "unavailable"}`);
    if (derivativesResult?.status === "fulfilled") derivatives = parseDerivatives(derivativesResult.value);
    else errors.push(`Derivatives: ${derivativesResult.reason instanceof Error ? derivativesResult.reason.message : "unavailable"}`);
    if (rwaResult?.status === "fulfilled") rwaAssets = parseRwaAssets(rwaResult.value);
    else errors.push(`RWA: ${rwaResult.reason instanceof Error ? rwaResult.reason.message : "unavailable"}`);
    if (keyInfoResult?.status === "fulfilled") apiUsage = parseApiUsage(keyInfoResult.value);
    else errors.push(`API usage: ${keyInfoResult.reason instanceof Error ? keyInfoResult.reason.message : "unavailable"}`);
  }

  for (const [label, result] of [["Quotes", assetsResult], ["Global metrics", globalResult], ["Fear & Greed", fearResult], ["Altcoin Season", seasonResult], ["Listings", listingsResult], ["Categories", categoriesResult], ["CMC20", cmc20Result], ["CMC100", cmc100Result]] as const) {
    if (result.status === "rejected") errors.push(`${label}: ${result.reason instanceof Error ? result.reason.message : "unavailable"}`);
  }

  return {
    mode: apiKey ? "full" : "public",
    retrievedAt: new Date().toISOString(),
    assets: assetsResult.status === "fulfilled" ? parseAssets(assetsResult.value) : [],
    listings: listingsResult.status === "fulfilled" ? parseAssets(listingsResult.value) : [],
    categories: categoriesResult.status === "fulfilled" ? parseCategories(categoriesResult.value) : [],
    benchmarks: {
      cmc20: cmc20Result.status === "fulfilled" ? parseBenchmark(cmc20Result.value) : null,
      cmc100: cmc100Result.status === "fulfilled" ? parseBenchmark(cmc100Result.value) : null,
    },
    rwaAssets,
    apiUsage,
    global: globalResult.status === "fulfilled" ? parseGlobal(globalResult.value) : { totalMarketCap: null, totalVolume24h: null, btcDominance: null, ethDominance: null, marketCapChange24h: null },
    fearAndGreed: fearResult.status === "fulfilled" ? parseIndex(fearResult.value, "fear") : { value: null, label: null, updatedAt: null },
    altcoinSeason: seasonResult.status === "fulfilled" ? parseIndex(seasonResult.value, "season") : { value: null, label: null, updatedAt: null },
    liquidations,
    derivatives,
    errors,
  };
}
