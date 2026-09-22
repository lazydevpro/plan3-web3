export type CmcAssetQuote = {
  id: number;
  name: string;
  symbol: string;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  change7d: number | null;
  marketCap: number | null;
  volume24h: number | null;
  volumeChange24h: number | null;
  lastUpdated: string | null;
};

export type CmcOverview = {
  mode: "full" | "public";
  retrievedAt: string;
  assets: CmcAssetQuote[];
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

async function requestCmc(path: string, apiKey?: string): Promise<Record<string, unknown>> {
  const base = apiKey
    ? "https://pro-api.coinmarketcap.com"
    : "https://pro-api.coinmarketcap.com/public-api";
  const response = await fetch(`${base}${path}`, {
    headers: apiKey ? { Accept: "application/json", "X-CMC_PRO_API_KEY": apiKey } : { Accept: "application/json" },
    next: { revalidate: 60 },
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
      marketCap: numberOrNull(quote.market_cap),
      volume24h: numberOrNull(quote.volume_24h),
      volumeChange24h: numberOrNull(quote.volume_change_24h),
      lastUpdated: stringOrNull(quote.last_updated),
    };
  }).sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
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
  const tasks = [
    requestCmc(`/v3/cryptocurrency/quotes/latest?id=${ASSET_IDS}&convert=USD`, apiKey),
    requestCmc("/v1/global-metrics/quotes/latest?convert=USD", apiKey),
    requestCmc("/v3/fear-and-greed/latest", apiKey),
    requestCmc("/v1/altcoin-season-index/latest", apiKey),
  ];
  const [assetsResult, globalResult, fearResult, seasonResult] = await Promise.allSettled(tasks);

  const emptyLiquidations: CmcOverview["liquidations"] = { total1h: null, total4h: null, total24h: null, longs24h: null, shorts24h: null, updatedAt: null, available: false };
  const emptyDerivatives: CmcOverview["derivatives"] = { fundingRate: null, openInterest: null, venue: null, pair: null, updatedAt: null, available: false };
  let liquidations = emptyLiquidations;
  let derivatives = emptyDerivatives;

  if (apiKey) {
    const [liquidationsResult, derivativesResult] = await Promise.allSettled([
      requestCmc("/v5/derivatives/liquidations/quotes/latest?convert=USD", apiKey),
      requestCmc("/v5/cryptocurrency/derivatives/market-pairs/list/latest?crypto_id=5426&limit=100&convert=USD", apiKey),
    ]);
    if (liquidationsResult.status === "fulfilled") liquidations = parseLiquidations(liquidationsResult.value);
    else errors.push(`Liquidations: ${liquidationsResult.reason instanceof Error ? liquidationsResult.reason.message : "unavailable"}`);
    if (derivativesResult.status === "fulfilled") derivatives = parseDerivatives(derivativesResult.value);
    else errors.push(`Derivatives: ${derivativesResult.reason instanceof Error ? derivativesResult.reason.message : "unavailable"}`);
  }

  for (const [label, result] of [["Quotes", assetsResult], ["Global metrics", globalResult], ["Fear & Greed", fearResult], ["Altcoin Season", seasonResult]] as const) {
    if (result.status === "rejected") errors.push(`${label}: ${result.reason instanceof Error ? result.reason.message : "unavailable"}`);
  }

  return {
    mode: apiKey ? "full" : "public",
    retrievedAt: new Date().toISOString(),
    assets: assetsResult.status === "fulfilled" ? parseAssets(assetsResult.value) : [],
    global: globalResult.status === "fulfilled" ? parseGlobal(globalResult.value) : { totalMarketCap: null, totalVolume24h: null, btcDominance: null, ethDominance: null, marketCapChange24h: null },
    fearAndGreed: fearResult.status === "fulfilled" ? parseIndex(fearResult.value, "fear") : { value: null, label: null, updatedAt: null },
    altcoinSeason: seasonResult.status === "fulfilled" ? parseIndex(seasonResult.value, "season") : { value: null, label: null, updatedAt: null },
    liquidations,
    derivatives,
    errors,
  };
}
