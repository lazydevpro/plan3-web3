"use client";

import {
  Activity, ArrowDownLeft, ArrowUpRight, BadgeCheck, BarChart3, BookOpen, Bot,
  ChartNoAxesCombined, CircleAlert, Coins, Database, Globe2, Landmark, Layers3,
  LockKeyhole, Menu, Radar, Scale, ShieldCheck, Table2, Users, WalletCards,
} from "lucide-react";
import type { CmcHistorySeries, CmcOverview } from "@/lib/cmc";
import type { WidgetId } from "@/lib/plan3-board";

type ExtendedId = Exclude<WidgetId,
  "market" | "watchlist" | "regime" | "fear" | "season" | "liquidations" | "funding" | "thesis" | "agent" |
  "leaderboard" | "performance" | "movers" | "breadth" | "dominance" | "volume" | "valuation" | "venues" |
  "categories" | "benchmark" | "rwa" | "stablecoins" | "apihealth">;

const metadata: Record<ExtendedId, { title: string; kicker: string; icon: typeof Activity }> = {
  chart: { title: "SOL price history", kicker: "HISTORICAL QUOTES", icon: ChartNoAxesCombined },
  relative: { title: "SOL vs BTC vs ETH", kicker: "RELATIVE RETURN", icon: BarChart3 },
  profile: { title: "Solana profile", kicker: "ASSET REFERENCE", icon: BookOpen },
  conversion: { title: "BTC → USD", kicker: "PRICE CONVERSION", icon: Coins },
  exchangeDirectory: { title: "Exchange directory", kicker: "VENUE REFERENCE", icon: Landmark },
  fiats: { title: "Fiat coverage", kicker: "CURRENCY REFERENCE", icon: Globe2 },
  derivativeVenues: { title: "Derivatives venues", kicker: "OPEN INTEREST", icon: Table2 },
  liquidationAssets: { title: "Liquidations by asset", kicker: "LEVERAGE STRESS", icon: ArrowDownLeft },
  liquidationExchanges: { title: "Liquidations by venue", kicker: "LEVERAGE STRESS", icon: Landmark },
  dexToken: { title: "JUP DEX lens", kicker: "ONCHAIN MARKET", icon: Radar },
  dexPools: { title: "JUP pool depth", kicker: "DEX LIQUIDITY", icon: Layers3 },
  dexSecurity: { title: "JUP security checks", kicker: "TOKEN RISK", icon: ShieldCheck },
  dexHolders: { title: "JUP holders", kicker: "ONCHAIN DISTRIBUTION", icon: Users },
  dexSwaps: { title: "JUP swap tape", kicker: "DEX ACTIVITY", icon: ArrowUpRight },
  dexLiquidity: { title: "JUP liquidity changes", kicker: "POOL ACTIVITY", icon: Scale },
  rwaGold: { title: "Tokenized gold", kicker: "RWA UNDERLYING", icon: WalletCards },
  rwaIssuers: { title: "RWA issuer directory", kicker: "RWA ISSUERS", icon: BadgeCheck },
  capabilities: { title: "CMC coverage", kicker: "DATA CAPABILITIES", icon: Database },
  discovery: { title: "Discovery feeds", kicker: "CURRENT KEY LOCKED", icon: LockKeyhole },
  cmcAi: { title: "CMC AI briefing", kicker: "CURRENT KEY LOCKED", icon: Bot },
  airdrops: { title: "Airdrop feed", kicker: "CURRENT KEY LOCKED", icon: LockKeyhole },
};

function money(value: number | null | undefined) {
  return value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}
function price(value: number | null | undefined) {
  if (value == null) return "—";
  return value >= 1 ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value) : `$${value.toLocaleString("en-US", { maximumSignificantDigits: 5 })}`;
}
function percent(value: number | null | undefined) { return value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`; }
function updated(iso: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso)); }

function Empty({ children }: { children: React.ReactNode }) { return <div className="widget-empty"><CircleAlert aria-hidden="true" /><span>{children}</span></div>; }
function Metric({ label, value, note }: { label: string; value: string; note?: string }) { return <div className="extended-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>; }
function Row({ label, value, detail }: { label: string; value: string; detail?: string }) { return <div className="extended-row"><span><strong>{label}</strong>{detail && <small>{detail}</small>}</span><b>{value}</b></div>; }
function Banner({ children }: { children: React.ReactNode }) { return <p className="extended-note">{children}</p>; }

function HistoryChart({ series }: { series: CmcHistorySeries }) {
  const points = series.points;
  const prices = points.map((point) => point.price);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const span = Math.max(high - low, 0.001);
  const coordinates = points.map((point, index) => `${(index / Math.max(1, points.length - 1)) * 300},${90 - ((point.price - low) / span) * 76}`).join(" ");
  const change = points.length > 1 ? ((points.at(-1)!.price / points[0].price) - 1) * 100 : null;
  return <div className="extended-chart"><div className="extended-chart-top"><strong>{price(points.at(-1)?.price)}</strong><span className={(change ?? 0) >= 0 ? "positive" : "negative"}>{percent(change)}</span></div><svg viewBox="0 0 300 100" role="img" aria-label={`SOL daily price history from ${updated(points[0].timestamp)} to ${updated(points.at(-1)!.timestamp)}`} preserveAspectRatio="none"><path d="M0 90 H300" className="chart-axis" /><polyline points={coordinates} className="chart-line" /></svg><div className="extended-chart-foot"><span>{updated(points[0].timestamp)}</span><span>Low {price(low)} · High {price(high)}</span><span>{updated(points.at(-1)!.timestamp)}</span></div></div>;
}

export function ExtendedWidget({ id, data, loading }: { id: ExtendedId; data: CmcOverview | null; loading: boolean }) {
  const meta = metadata[id];
  const Icon = meta.icon;
  const solHistory = data?.history.find((item) => item.symbol === "SOL");
  let body: React.ReactNode;
  if (loading) body = <div className="widget-skeleton" aria-label="Loading CMC data"><i /><i /><i /></div>;
  else if (id === "chart") body = solHistory?.points.length ? <HistoryChart series={solHistory} /> : <Empty>Historical SOL prices are unavailable.</Empty>;
  else if (id === "relative") {
    const ranked = (data?.history ?? []).map((series) => {
      const points = series.points;
      return { symbol: series.symbol, change: points.length > 1 ? ((points.at(-1)!.price / points[0].price) - 1) * 100 : null };
    });
    body = ranked.length ? <div className="extended-list">{ranked.map((item) => <Row key={item.symbol} label={item.symbol} value={percent(item.change)} detail="14-day change" />)}<Banner>Daily CMC historical quotes; returns use the first and last available point.</Banner></div> : <Empty>Comparison history is unavailable.</Empty>;
  } else if (id === "profile") body = data?.assetProfile ? <div className="extended-list"><Row label={data.assetProfile.name} value={data.assetProfile.symbol} detail={data.assetProfile.category ?? undefined} /><p className="extended-description">{data.assetProfile.description?.slice(0, 310) ?? "No description returned."}</p><div className="extended-tags">{data.assetProfile.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div></div> : <Empty>Solana metadata is unavailable.</Empty>;
  else if (id === "conversion") body = data?.conversion ? <div className="extended-hero"><span>{data.conversion.amount} {data.conversion.from}</span><strong>{price(data.conversion.usdValue)}</strong><Banner>CMC conversion quote, refreshed separately from the asset snapshot.</Banner></div> : <Empty>Currency conversion is unavailable.</Empty>;
  else if (id === "exchangeDirectory") body = data?.exchangeDirectory.length ? <div className="extended-list">{data.exchangeDirectory.slice(0, 6).map((item) => <Row key={item.id} label={item.name} value={item.active ? "Active" : "Inactive"} detail={item.slug} />)}</div> : <Empty>Exchange directory is unavailable.</Empty>;
  else if (id === "fiats") body = data?.fiats.length ? <div className="extended-list extended-columns">{data.fiats.slice(0, 10).map((item) => <Row key={item.id} label={item.symbol} value={item.sign ?? "—"} detail={item.name} />)}</div> : <Empty>Fiat directory is unavailable.</Empty>;
  else if (id === "derivativeVenues") body = data?.derivativeVenues.length ? <div className="extended-list">{data.derivativeVenues.slice(0, 6).map((item) => <Row key={item.id} label={`${item.rank ? `#${item.rank} ` : ""}${item.name}`} value={money(item.openInterest)} detail={`${money(item.volume24h)} 24h volume · ${item.marketPairs ?? "—"} pairs`} />)}</div> : <Empty>Derivative venue data is unavailable.</Empty>;
  else if (id === "liquidationAssets" || id === "liquidationExchanges") {
    const items = id === "liquidationAssets" ? data?.liquidationLeaders.assets : data?.liquidationLeaders.exchanges;
    body = items?.length ? <div className="extended-list">{items.slice(0, 6).map((item) => <Row key={item.id} label={item.symbol ?? item.name} value={money(item.total24h)} detail={`Long ${money(item.longs24h)} · Short ${money(item.shorts24h)}`} />)}</div> : <Empty>Liquidation ranking is unavailable.</Empty>;
  } else if (id === "dexToken") {
    const token = data?.dex.token;
    body = token ? <><div className="extended-hero"><span>{token.symbol} / USD · {token.platform}</span><strong>{price(token.price)}</strong><span className={(token.change24h ?? 0) >= 0 ? "positive" : "negative"}>{percent(token.change24h)} 24h</span></div><div className="extended-metrics"><Metric label="DEX volume" value={money(token.volume24h)} /><Metric label="Liquidity" value={money(token.liquidity)} /><Metric label="Transactions" value={token.transactions24h?.toLocaleString() ?? "—"} /></div></> : <Empty>JUP DEX token data is unavailable.</Empty>;
  } else if (id === "dexPools") body = data?.dex.pools.length ? <div className="extended-list">{data.dex.pools.slice(0, 6).map((pool) => <Row key={pool.address} label={pool.pair} value={money(pool.liquidity)} detail={`${pool.venue} · ${money(pool.volume24h)} 24h volume`} />)}</div> : <Empty>JUP pool data is unavailable.</Empty>;
  else if (id === "dexSecurity") body = data?.dex.security ? <div className="extended-list"><div className="extended-security"><ShieldCheck aria-hidden="true" /><strong>CMC classification: {data.dex.security.level ?? "unknown"}</strong></div>{data.dex.security.checks.slice(0, 6).map((check) => <Row key={check.label} label={check.label} value={check.hit ? "Flagged" : "Clear"} />)}<Banner>Screening is informational and does not guarantee token safety.</Banner></div> : <Empty>JUP security checks are unavailable.</Empty>;
  else if (id === "dexHolders") body = data?.dex.holderCount != null ? <div className="extended-hero"><span>Reported token holders</span><strong>{data.dex.holderCount.toLocaleString()}</strong><Banner>CMC DEX holder-count endpoint for the JUP token contract.</Banner></div> : <Empty>Holder count is unavailable.</Empty>;
  else if (id === "dexSwaps" || id === "dexLiquidity") {
    const items = id === "dexSwaps" ? data?.dex.swaps : data?.dex.liquidityChanges;
    body = items?.length ? <div className="extended-list">{items.slice(0, 6).map((item, index) => <Row key={`${item.timestamp}-${index}`} label={`${item.side.toUpperCase()} · ${item.pair}`} value={money(item.valueUsd)} detail={`${item.venue} · ${new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(new Date(item.timestamp))} UTC`} />)}</div> : <Empty>{id === "dexSwaps" ? "Recent swaps" : "Liquidity changes"} are unavailable.</Empty>;
  } else if (id === "rwaGold") body = data?.rwaDetail ? <><div className="extended-metrics"><Metric label="Tokenized cap" value={money(data.rwaDetail.marketCap)} /><Metric label="24h volume" value={money(data.rwaDetail.volume24h)} /></div><div className="extended-list">{data.rwaDetail.tokens.slice(0, 5).map((token) => <Row key={token.symbol} label={token.symbol} value={money(token.marketCap)} detail={`${token.issuer} · ${price(token.price)}`} />)}</div></> : <Empty>Tokenized gold data is unavailable.</Empty>;
  else if (id === "rwaIssuers") body = data?.rwaDetail?.issuers.length ? <div className="extended-list">{data.rwaDetail.issuers.slice(0, 6).map((issuer) => <Row key={issuer.id} label={issuer.name} value={`${issuer.tokenCount ?? "—"} tokens`} detail={issuer.website ?? undefined} />)}</div> : <Empty>Issuer directory is unavailable.</Empty>;
  else if (id === "capabilities") body = data?.capabilities.length ? <div className="extended-list">{data.capabilities.map((item) => <Row key={item.name} label={item.name} value={item.status === "live" ? "Live" : "Locked"} detail={item.detail} />)}</div> : <Empty>CMC capability status is unavailable.</Empty>;
  else body = <div className="extended-locked"><LockKeyhole aria-hidden="true" /><strong>Unavailable with this CMC key</strong><span>{id === "discovery" ? "Trending, new listings and gainers/losers returned 403." : id === "cmcAi" ? "CMC AI briefing returned 403." : "The airdrop endpoint returned 403."}</span></div>;
  return <><header className="widget-header"><div className="widget-heading"><span className="widget-kicker"><Icon aria-hidden="true" />{meta.kicker}</span><h2>{meta.title}</h2></div><span className="widget-menu" aria-hidden="true"><Menu /></span></header>{body}</>;
}

export function isExtendedWidget(id: WidgetId): id is ExtendedId { return id in metadata; }
