"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity, BadgeDollarSign, BarChart3, Bell, Bot, Boxes, BrainCircuit, Check,
  ChartNoAxesCombined, ChevronDown, CircleAlert, Clock3, Command,
  Crosshair, Database, ExternalLink, Eye, Flame, Focus, Gauge, Grid2X2,
  History, Landmark, Layers3, Link2, ListOrdered, Maximize2, Menu,
  MousePointer2, PanelRight, PieChart, Plus, RefreshCw, Scale, Search,
  ServerCog, Share2, ShieldAlert, Sparkles, Table2, TrendingDown, TrendingUp,
  Trophy, WalletCards, Waves, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCmcMarket } from "@/hooks/use-cmc-market";
import type { CmcAssetQuote, CmcOverview } from "@/lib/cmc";

type Mode = "Build" | "Live" | "Focus";
type WidgetId = "market" | "watchlist" | "regime" | "fear" | "season" | "liquidations" | "funding" | "thesis" | "agent" | "leaderboard" | "performance" | "movers" | "breadth" | "dominance" | "volume" | "valuation" | "venues" | "categories" | "benchmark" | "rwa" | "stablecoins" | "apihealth";

const widgetCatalog: Array<{ id: WidgetId; name: string; detail: string; icon: typeof Activity; access: "Live" | "Full access" | "Plan3" }> = [
  { id: "market", name: "Asset snapshot", detail: "Price, volume, market cap and momentum", icon: Activity, access: "Live" },
  { id: "watchlist", name: "Smart watchlist", detail: "Comparable market context for selected assets", icon: Eye, access: "Live" },
  { id: "leaderboard", name: "Market leaderboard", detail: "Top assets ranked by market capitalization", icon: ListOrdered, access: "Live" },
  { id: "performance", name: "Performance matrix", detail: "Compare 1h, 24h, 7d and 30d returns", icon: Table2, access: "Live" },
  { id: "movers", name: "Movers radar", detail: "Strongest and weakest assets in the top market", icon: Flame, access: "Live" },
  { id: "breadth", name: "Market breadth", detail: "Advancers, decliners and median market return", icon: BarChart3, access: "Live" },
  { id: "dominance", name: "Dominance map", detail: "Market-share concentration across leading assets", icon: PieChart, access: "Live" },
  { id: "volume", name: "Volume leaders", detail: "Where the most 24h trading activity sits", icon: ChartNoAxesCombined, access: "Live" },
  { id: "valuation", name: "Valuation & supply", detail: "Market cap, FDV and circulating supply ratios", icon: Scale, access: "Live" },
  { id: "venues", name: "CEX vs DEX flow", detail: "Reported centralized and decentralized volume split", icon: Boxes, access: "Live" },
  { id: "regime", name: "Market regime", detail: "Market cap, dominance and risk context", icon: Waves, access: "Live" },
  { id: "categories", name: "Category heatmap", detail: "Sector rotation by market cap and daily change", icon: Grid2X2, access: "Live" },
  { id: "fear", name: "Fear & Greed", detail: "CMC proprietary sentiment index", icon: Gauge, access: "Live" },
  { id: "season", name: "Altcoin Season", detail: "Bitcoin-to-altcoin rotation index", icon: Layers3, access: "Live" },
  { id: "benchmark", name: "CMC20 / CMC100", detail: "Institutional market benchmarks and constituent weights", icon: Trophy, access: "Live" },
  { id: "stablecoins", name: "Stablecoin monitor", detail: "Peg deviations, size and liquidity across leaders", icon: BadgeDollarSign, access: "Live" },
  { id: "liquidations", name: "Liquidation pulse", detail: "Long, short and total forced closures", icon: ShieldAlert, access: "Full access" },
  { id: "funding", name: "Funding & basis", detail: "SOL leverage and derivatives crowding", icon: Landmark, access: "Full access" },
  { id: "rwa", name: "RWA market map", detail: "Tokenized stocks, commodities and real-world assets", icon: WalletCards, access: "Full access" },
  { id: "apihealth", name: "API credit governor", detail: "Minute requests and monthly CMC credit usage", icon: ServerCog, access: "Full access" },
  { id: "thesis", name: "Thesis", detail: "Human-owned conclusion and confidence", icon: Sparkles, access: "Plan3" },
  { id: "agent", name: "Agent monitor", detail: "Inspectable rule with human approval", icon: Bot, access: "Plan3" },
];

const defaultWidgets: WidgetId[] = ["market", "watchlist", "regime", "performance", "movers", "categories", "fear", "benchmark", "liquidations", "rwa", "agent"];

export default function Home() {
  const market = useCmcMarket();
  const [mode, setMode] = useState<Mode>("Build");
  const [selected, setSelected] = useState<WidgetId>("agent");
  const [widgets, setWidgets] = useState<WidgetId[]>(defaultWidgets);
  const [proposal, setProposal] = useState<"pending" | "accepted" | "rejected">("pending");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const sol = market.data?.assets.find((asset) => asset.symbol === "SOL") ?? null;
  const selectedDefinition = widgetCatalog.find((widget) => widget.id === selected) ?? widgetCatalog[0];
  const filteredCatalog = useMemo(() => {
    const query = libraryQuery.trim().toLowerCase();
    if (!query) return widgetCatalog;
    return widgetCatalog.filter((widget) => `${widget.name} ${widget.detail} ${widget.access}`.toLowerCase().includes(query));
  }, [libraryQuery]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLibraryOpen(false);
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>("#agent-prompt")?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Parameters<NonNullable<typeof context.registerTool>>[0]) => {
      void Promise.resolve(context.registerTool?.(tool, { signal: lifecycle.signal })).catch(() => undefined);
    };
    register({
      name: "read_market_board",
      title: "Read market board",
      description: "Read the current Plan3 board, its widgets, and live SOL market context without changing anything.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ board: "SOL momentum thesis", mode, widgets, sol, monitorStatus: proposal }),
    });
    register({
      name: "add_market_widget",
      title: "Add market widget",
      description: "Add a supported CoinMarketCap or Plan3 widget to the board for human review.",
      inputSchema: { type: "object", properties: { widget: { type: "string", enum: widgetCatalog.map((item) => item.id) } }, required: ["widget"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const id = (input as { widget?: WidgetId }).widget;
        if (!id || !widgetCatalog.some((item) => item.id === id)) throw new Error("Unsupported widget");
        setWidgets((current) => current.includes(id) ? current : [...current, id]);
        setSelected(id);
        return { widget: id, status: "added", requiresHumanApproval: id === "agent" };
      },
    });
    register({
      name: "stage_crowding_monitor",
      title: "Stage crowding monitor",
      description: "Stage a SOL funding, volume, and liquidation monitor for human approval.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        setWidgets((current) => current.includes("agent") ? current : [...current, "agent"]);
        setProposal("pending");
        setSelected("agent");
        return { status: "proposed", requiresHumanApproval: true };
      },
    });
    return () => lifecycle.abort();
  }, [mode, proposal, sol, widgets]);

  const addWidget = (id: WidgetId) => {
    setWidgets((current) => current.includes(id) ? current : [...current, id]);
    setSelected(id);
    setInspectorOpen(true);
    setLibraryOpen(false);
  };

  const removeSelected = () => {
    setWidgets((current) => current.filter((id) => id !== selected));
    setSelected(widgets.find((id) => id !== selected) ?? "market");
  };

  const submitAgent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agentPrompt.trim()) return;
    setAgentBusy(true);
    window.setTimeout(() => {
      setWidgets((current) => current.includes("agent") ? current : [...current, "agent"]);
      setProposal("pending");
      setSelected("agent");
      setInspectorOpen(true);
      setAgentPrompt("");
      setAgentBusy(false);
    }, 700);
  };

  const shareBoard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Copied");
    } catch {
      setShareLabel("Ready");
    }
    window.setTimeout(() => setShareLabel("Share"), 1600);
  };

  return (
    <main className={`app-shell ${inspectorOpen ? "has-inspector" : ""}`}>
      <header className="topbar">
        <div className="brand-lockup" aria-label="Plan3">
          <span className="brand-symbol"><img src="/plan3-symbol.svg" alt="" width="28" height="28" /></span>
          <span className="brand-word">PLAN<sup>3</sup></span>
        </div>
        <button className="board-switcher focus-ring" type="button">
          <span className="board-title">SOL momentum thesis</span>
          <span className="saved-state"><Check aria-hidden="true" /> Saved</span>
          <ChevronDown aria-hidden="true" />
        </button>
        <div className="mode-switcher" aria-label="Workspace mode">
          {(["Build", "Live", "Focus"] as Mode[]).map((item) => (
            <button className={`mode-button focus-ring ${mode === item ? "is-active" : ""}`} key={item} onClick={() => setMode(item)} type="button" aria-pressed={mode === item}>{item}</button>
          ))}
        </div>
        <div className="top-actions">
          <Button variant="ghost" size="icon" aria-label="Open search"><Search aria-hidden="true" /></Button>
          <Button variant="ghost" size="icon" aria-label="View notifications"><Bell aria-hidden="true" /></Button>
          <Button className="share-button" onClick={shareBoard}><Share2 aria-hidden="true" />{shareLabel}</Button>
        </div>
      </header>

      <aside className="tool-rail" aria-label="Board tools">
        <nav>
          <button className="rail-button is-active focus-ring" type="button" aria-label="Select tool"><MousePointer2 aria-hidden="true" /></button>
          <button className="rail-button focus-ring" type="button" aria-label="Add widget" onClick={() => setLibraryOpen((value) => !value)} aria-expanded={libraryOpen}><Plus aria-hidden="true" /></button>
          <button className="rail-button focus-ring" type="button" aria-label="Connect widgets"><Link2 aria-hidden="true" /></button>
          <button className="rail-button focus-ring" type="button" aria-label="Open agents"><Bot aria-hidden="true" /></button>
          <button className="rail-button focus-ring" type="button" aria-label="Board history"><History aria-hidden="true" /></button>
        </nav>
        <nav className="rail-bottom">
          <button className="rail-button focus-ring" type="button" aria-label="Toggle grid"><Grid2X2 aria-hidden="true" /></button>
          <button className={`rail-button focus-ring ${inspectorOpen ? "is-active" : ""}`} type="button" aria-label="Toggle inspector" onClick={() => setInspectorOpen((value) => !value)}><PanelRight aria-hidden="true" /></button>
        </nav>
      </aside>

      {libraryOpen && (
        <section className="widget-library" aria-label="Widget library">
          <div className="library-heading">
            <div><span className="eyebrow">{widgetCatalog.length} WIDGETS</span><h2>Add to this board</h2></div>
            <Button variant="ghost" size="icon" onClick={() => setLibraryOpen(false)} aria-label="Close widget library"><X aria-hidden="true" /></Button>
          </div>
          <div className="library-search">
            <Search aria-hidden="true" />
            <label className="sr-only" htmlFor="widget-search">Search widgets</label>
            <input id="widget-search" type="search" value={libraryQuery} onChange={(event) => setLibraryQuery(event.target.value)} placeholder="Search market, RWA, risk…" autoComplete="off" />
          </div>
          <div className="library-list">
            {filteredCatalog.map(({ id, icon: Icon, name, detail, access }) => {
              const added = widgets.includes(id);
              return (
                <button className="library-item focus-ring" type="button" key={id} onClick={() => addWidget(id)} disabled={added}>
                  <span className="library-icon"><Icon aria-hidden="true" /></span>
                  <span><strong>{name}</strong><small>{detail}</small></span>
                  <span className={access === "Full access" ? "access-full" : "access-live"}>{added ? "Added" : access}</span>
                </button>
              );
            })}
            {filteredCatalog.length === 0 && <div className="library-empty"><Search aria-hidden="true" /><span>No matching widgets</span></div>}
          </div>
        </section>
      )}

      <section className={`canvas mode-${mode.toLowerCase()}`} aria-label="SOL momentum thesis board">
        <div className="canvas-meta">
          <span><Crosshair aria-hidden="true" /> Decision board</span>
          <span className={market.error ? "source-error" : "live-source"}><i /> {sourceLabel(market.data?.mode, market.error, market.data?.retrievedAt)}</span>
        </div>

        {market.error && !market.data && (
          <div className="data-error" role="alert">
            <CircleAlert aria-hidden="true" />
            <span><strong>Market data is temporarily unavailable.</strong> Your board is intact.</span>
            <button type="button" onClick={market.retry}>Try again</button>
          </div>
        )}

        <div className="board-grid">
          {widgets.length === 0 ? (
            <div className="board-empty">
              <Grid2X2 aria-hidden="true" />
              <h2>Build your decision board</h2>
              <p>Add live CMC data, a thesis, or an agent-maintained rule.</p>
              <Button onClick={() => setLibraryOpen(true)}><Plus aria-hidden="true" /> Add widget</Button>
            </div>
          ) : widgets.map((id) => (
            <WidgetShell key={id} id={id} selected={selected === id} onSelect={() => { setSelected(id); setInspectorOpen(true); }}>
              {renderWidget(id, market, sol, proposal, setProposal)}
            </WidgetShell>
          ))}
        </div>

        <div className="zoom-controls" aria-label="Canvas zoom"><button className="focus-ring" type="button">−</button><span>92%</span><button className="focus-ring" type="button">+</button><button className="focus-ring" type="button" aria-label="Fit board"><Maximize2 aria-hidden="true" /></button></div>
        <form className="agent-command" onSubmit={submitAgent}>
          <Bot aria-hidden="true" />
          <label className="sr-only" htmlFor="agent-prompt">Ask an agent to work on this board</label>
          <input id="agent-prompt" value={agentPrompt} onChange={(event) => setAgentPrompt(event.target.value)} placeholder="Ask an agent to add evidence, compare, or monitor…" autoComplete="off" />
          <span className="command-hint"><Command aria-hidden="true" /> K</span>
          <Button size="sm" type="submit" disabled={agentBusy || !agentPrompt.trim()}>{agentBusy ? "Working…" : "Run"}</Button>
        </form>
      </section>

      {inspectorOpen && (
        <aside className="inspector" aria-label="Widget inspector">
          <div className="inspector-head"><div><span className="eyebrow">INSPECTOR</span><h2>{selectedDefinition.name}</h2></div><Button variant="ghost" size="icon" aria-label="Close inspector" onClick={() => setInspectorOpen(false)}><X aria-hidden="true" /></Button></div>
          <div className="inspector-status"><span className={selected === "agent" && proposal === "pending" ? "status-proposed" : "status-live"}><i />{selected === "agent" && proposal === "pending" ? "Awaiting approval" : "Live"}</span><button className="focus-ring" type="button">Activity <ExternalLink aria-hidden="true" /></button></div>
          <InspectorContent id={selected} data={market.data} sol={sol} proposal={proposal} />
          <div className="inspector-actions"><Button variant="secondary" onClick={() => setMode("Focus")}><Focus aria-hidden="true" /> Focus</Button><Button variant="ghost" onClick={removeSelected}><X aria-hidden="true" /> Remove</Button></div>
        </aside>
      )}
    </main>
  );
}

function WidgetShell({ id, selected, onSelect, children }: { id: WidgetId; selected: boolean; onSelect: () => void; children: React.ReactNode }) {
  return <article className={`widget widget-${id}`} data-selected={selected} onFocusCapture={onSelect}>{children}</article>;
}

function renderWidget(id: WidgetId, market: ReturnType<typeof useCmcMarket>, sol: CmcAssetQuote | null, proposal: "pending" | "accepted" | "rejected", setProposal: (value: "pending" | "accepted" | "rejected") => void) {
  if (id === "market") return <MarketWidget asset={sol} loading={market.loading} refreshing={market.refreshing} refresh={market.retry} />;
  if (id === "watchlist") return <WatchlistWidget assets={market.data?.assets ?? []} loading={market.loading} />;
  if (id === "leaderboard") return <LeaderboardWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "performance") return <PerformanceWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "movers") return <MoversWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "breadth") return <BreadthWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "dominance") return <DominanceWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "volume") return <VolumeWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "valuation") return <ValuationWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "venues") return <VenueSplitWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "regime") return <RegimeWidget data={market.data} loading={market.loading} />;
  if (id === "categories") return <CategoriesWidget data={market.data} loading={market.loading} />;
  if (id === "fear") return <IndexWidget kind="fear" value={market.data?.fearAndGreed.value ?? null} label={market.data?.fearAndGreed.label ?? "Waiting for CMC"} loading={market.loading} />;
  if (id === "season") return <IndexWidget kind="season" value={market.data?.altcoinSeason.value ?? null} label={market.data?.altcoinSeason.label ?? "Waiting for CMC"} loading={market.loading} />;
  if (id === "benchmark") return <BenchmarkWidget data={market.data} loading={market.loading} />;
  if (id === "stablecoins") return <StablecoinWidget assets={market.data?.listings ?? []} loading={market.loading} />;
  if (id === "liquidations") return <LiquidationsWidget data={market.data} />;
  if (id === "funding") return <FundingWidget data={market.data} />;
  if (id === "rwa") return <RwaWidget data={market.data} loading={market.loading} />;
  if (id === "apihealth") return <ApiHealthWidget data={market.data} loading={market.loading} />;
  if (id === "thesis") return <ThesisWidget sol={sol} />;
  return <AgentWidget data={market.data} proposal={proposal} setProposal={setProposal} />;
}

function Header({ icon: Icon, kicker, title }: { icon: typeof Activity; kicker: string; title: string }) {
  return <header className="widget-header"><div className="widget-heading"><span className="widget-kicker"><Icon aria-hidden="true" />{kicker}</span><h2>{title}</h2></div><button className="widget-menu focus-ring" type="button" aria-label={`Inspect ${title}`}><Menu aria-hidden="true" /></button></header>;
}

function MarketWidget({ asset, loading, refreshing, refresh }: { asset: CmcAssetQuote | null; loading: boolean; refreshing: boolean; refresh: () => void }) {
  return <><Header icon={Activity} kicker="ASSET SNAPSHOT" title="SOL / USD" />{loading ? <WidgetSkeleton rows={3} /> : asset ? <><div className="metric-line"><strong>{formatPrice(asset.price)}</strong><Change value={asset.change24h} /></div><dl className="micro-stats"><div><dt>Market cap</dt><dd>{formatMoney(asset.marketCap)}</dd></div><div><dt>24h volume</dt><dd>{formatMoney(asset.volume24h)}</dd></div><div><dt>Rank</dt><dd>#{asset.rank ?? "—"}</dd></div></dl></> : <WidgetEmpty label="SOL quote unavailable" />}<button className="source-row focus-ring" type="button" onClick={refresh} disabled={refreshing}><span>CoinMarketCap · 60s</span><RefreshCw className={refreshing ? "is-spinning" : ""} aria-hidden="true" /> {refreshing ? "Updating" : "Refresh"}</button></>;
}

function WatchlistWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  return <><Header icon={Eye} kicker="SMART WATCHLIST" title="Market leaders" />{loading ? <WidgetSkeleton rows={3} /> : assets.length ? <div className="watchlist"><div className="watch-head"><span>Asset</span><span>Price</span><span>24h</span></div>{assets.map((asset) => <div className="watch-row" key={asset.id}><span><i>{asset.symbol.slice(0, 1)}</i><strong>{asset.symbol}</strong><small>#{asset.rank ?? "—"}</small></span><strong>{formatPrice(asset.price)}</strong><Change value={asset.change24h} compact /></div>)}</div> : <WidgetEmpty label="No assets returned" />}</>;
}

function LeaderboardWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const leaders = assets.slice(0, 6);
  return <><Header icon={ListOrdered} kicker="MARKET RANKING" title="Top assets" />{loading ? <WidgetSkeleton rows={5} /> : leaders.length ? <div className="compact-table leaderboard-table"><div className="compact-head"><span># / Asset</span><span>Market cap</span><span>24h</span></div>{leaders.map((asset) => <div className="compact-row" key={asset.id}><span><small>{asset.rank ?? "—"}</small><strong>{asset.symbol}</strong></span><strong>{formatMoney(asset.marketCap)}</strong><Change value={asset.change24h} compact /></div>)}</div> : <WidgetEmpty label="Leaderboard unavailable" />}</>;
}

function PerformanceWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const leaders = assets.slice(0, 6);
  return <><Header icon={Table2} kicker="RELATIVE PERFORMANCE" title="Momentum matrix" />{loading ? <WidgetSkeleton rows={5} /> : leaders.length ? <div className="performance-table"><div className="performance-row performance-head"><span>Asset</span><span>1h</span><span>24h</span><span>7d</span><span>30d</span></div>{leaders.map((asset) => <div className="performance-row" key={asset.id}><strong>{asset.symbol}</strong><HeatValue value={asset.change1h} /><HeatValue value={asset.change24h} /><HeatValue value={asset.change7d} /><HeatValue value={asset.change30d} /></div>)}</div> : <WidgetEmpty label="Performance data unavailable" />}</>;
}

function MoversWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const ranked = [...assets].filter((asset) => asset.change24h != null).sort((a, b) => (b.change24h ?? 0) - (a.change24h ?? 0));
  const gainers = ranked.slice(0, 3);
  const losers = ranked.slice(-3).reverse();
  return <><Header icon={Flame} kicker="24H MOVERS" title="Leaders & laggards" />{loading ? <WidgetSkeleton rows={4} /> : ranked.length ? <div className="movers-grid"><MoverColumn title="Gainers" assets={gainers} positive /><MoverColumn title="Laggards" assets={losers} /></div> : <WidgetEmpty label="Mover data unavailable" />}</>;
}

function MoverColumn({ title, assets, positive = false }: { title: string; assets: CmcAssetQuote[]; positive?: boolean }) {
  return <section><h3 className={positive ? "positive" : "negative"}>{title}</h3>{assets.map((asset) => <div className="mover-row" key={asset.id}><span>{asset.symbol}</span><strong className={positive ? "positive" : "negative"}>{formatPercent(asset.change24h)}</strong></div>)}</section>;
}

function BreadthWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const values = assets.map((asset) => asset.change24h).filter((value): value is number => value != null);
  const advancing = values.filter((value) => value > 0).length;
  const declining = values.filter((value) => value < 0).length;
  const flat = Math.max(0, values.length - advancing - declining);
  const advanceShare = values.length ? (advancing / values.length) * 100 : 0;
  return <><Header icon={BarChart3} kicker="MARKET BREADTH" title={`${Math.round(advanceShare)}% advancing`} />{loading ? <WidgetSkeleton rows={3} /> : values.length ? <div className="breadth-body"><div className="breadth-track" aria-label={`${advancing} advancing, ${declining} declining`}><i style={{ width: `${advanceShare}%` }} /></div><div className="breadth-counts"><div><span>Advancing</span><strong className="positive">{advancing}</strong></div><div><span>Declining</span><strong className="negative">{declining}</strong></div><div><span>Flat</span><strong>{flat}</strong></div></div><div className="breadth-median"><span>Median 24h return</span><strong className={(median(values) ?? 0) >= 0 ? "positive" : "negative"}>{formatPercent(median(values))}</strong></div></div> : <WidgetEmpty label="Breadth data unavailable" />}</>;
}

function DominanceWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const leaders = assets.filter((asset) => asset.marketCapDominance != null).slice(0, 5);
  const leaderShare = leaders.reduce((sum, asset) => sum + (asset.marketCapDominance ?? 0), 0);
  return <><Header icon={PieChart} kicker="MARKET STRUCTURE" title="Dominance map" />{loading ? <WidgetSkeleton rows={4} /> : leaders.length ? <div className="bar-list">{leaders.map((asset) => <div className="bar-item" key={asset.id}><div><span>{asset.symbol}</span><strong>{formatPercent(asset.marketCapDominance, false)}</strong></div><i><b style={{ width: `${Math.min(100, (asset.marketCapDominance ?? 0) * 1.55)}%` }} /></i></div>)}<div className="bar-item is-muted"><div><span>Others</span><strong>{formatPercent(Math.max(0, 100 - leaderShare), false)}</strong></div><i><b style={{ width: `${Math.max(0, 100 - leaderShare)}%` }} /></i></div></div> : <WidgetEmpty label="Dominance data unavailable" />}</>;
}

function VolumeWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const leaders = [...assets].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0)).slice(0, 5);
  const maxVolume = leaders[0]?.volume24h ?? 1;
  return <><Header icon={ChartNoAxesCombined} kicker="TRADING ACTIVITY" title="Volume leaders" />{loading ? <WidgetSkeleton rows={4} /> : leaders.length ? <div className="volume-list">{leaders.map((asset) => <div className="volume-row" key={asset.id}><div><strong>{asset.symbol}</strong><span>{formatMoney(asset.volume24h)}</span><Change value={asset.volumeChange24h} compact /></div><i><b style={{ width: `${Math.max(3, ((asset.volume24h ?? 0) / maxVolume) * 100)}%` }} /></i></div>)}</div> : <WidgetEmpty label="Volume data unavailable" />}</>;
}

function ValuationWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const leaders = assets.slice(0, 4);
  return <><Header icon={Scale} kicker="VALUATION" title="Market cap vs FDV" />{loading ? <WidgetSkeleton rows={4} /> : leaders.length ? <div className="valuation-list">{leaders.map((asset) => { const unlocked = asset.maxSupply && asset.circulatingSupply ? (asset.circulatingSupply / asset.maxSupply) * 100 : null; const fdvRatio = asset.marketCap && asset.fullyDilutedMarketCap ? asset.fullyDilutedMarketCap / asset.marketCap : null; return <div className="valuation-row" key={asset.id}><div><strong>{asset.symbol}</strong><span>{formatMoney(asset.marketCap)} cap</span></div><div><span>FDV ratio</span><strong>{fdvRatio == null ? "—" : `${fdvRatio.toFixed(2)}×`}</strong></div><div><span>Circulating</span><strong>{unlocked == null ? "—" : `${unlocked.toFixed(0)}%`}</strong></div></div>; })}</div> : <WidgetEmpty label="Valuation data unavailable" />}</>;
}

function VenueSplitWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const cex = assets.reduce((sum, asset) => sum + (asset.cexVolume24h ?? 0), 0);
  const dex = assets.reduce((sum, asset) => sum + (asset.dexVolume24h ?? 0), 0);
  const total = cex + dex;
  const dexShare = total ? (dex / total) * 100 : 0;
  const mostDex = [...assets].filter((asset) => (asset.cexVolume24h ?? 0) + (asset.dexVolume24h ?? 0) > 0).sort((a, b) => assetDexShare(b) - assetDexShare(a))[0];
  return <><Header icon={Boxes} kicker="VENUE FLOW" title="CEX vs DEX volume" />{loading ? <WidgetSkeleton rows={3} /> : total ? <div className="venue-split"><div className="venue-donut" style={{ background: `conic-gradient(var(--copper) 0 ${100 - dexShare}%, var(--teal) ${100 - dexShare}% 100%)` }}><span><strong>{dexShare.toFixed(1)}%</strong><small>DEX</small></span></div><div className="venue-legend"><div><i className="cex-key" /><span>CEX</span><strong>{formatMoney(cex)}</strong></div><div><i className="dex-key" /><span>DEX</span><strong>{formatMoney(dex)}</strong></div></div><div className="venue-note"><span>Highest DEX share</span><strong>{mostDex ? `${mostDex.symbol} · ${assetDexShare(mostDex).toFixed(1)}%` : "—"}</strong></div></div> : <WidgetEmpty label="Venue split unavailable" />}</>;
}

function RegimeWidget({ data, loading }: { data: CmcOverview | null; loading: boolean }) {
  const global = data?.global;
  const riskOn = (global?.marketCapChange24h ?? 0) >= 0;
  return <><Header icon={Waves} kicker="MARKET REGIME" title={riskOn ? "Risk-on · BTC led" : "Defensive · risk-off"} />{loading ? <WidgetSkeleton rows={3} /> : <><div className="regime-hero"><span className={riskOn ? "regime-up" : "regime-down"}>{riskOn ? <TrendingUp aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}{formatPercent(global?.marketCapChange24h ?? null)}</span><small>24h crypto market cap</small></div><dl className="regime-grid"><div><dt>Total market</dt><dd>{formatMoney(global?.totalMarketCap ?? null)}</dd></div><div><dt>24h volume</dt><dd>{formatMoney(global?.totalVolume24h ?? null)}</dd></div><div><dt>BTC dominance</dt><dd>{formatPercent(global?.btcDominance ?? null, false)}</dd></div><div><dt>ETH dominance</dt><dd>{formatPercent(global?.ethDominance ?? null, false)}</dd></div></dl></>}</>;
}

function CategoriesWidget({ data, loading }: { data: CmcOverview | null; loading: boolean }) {
  const categories = data?.categories.slice(0, 6) ?? [];
  return <><Header icon={Grid2X2} kicker="SECTOR ROTATION" title="Category heatmap" />{loading ? <WidgetSkeleton rows={4} /> : categories.length ? <div className="category-grid">{categories.map((category) => { const positive = (category.change24h ?? 0) >= 0; return <div className={positive ? "category-cell is-positive" : "category-cell is-negative"} key={category.id}><strong>{category.name}</strong><span>{formatMoney(category.marketCap)}</span><b>{formatPercent(category.change24h)}</b><small>{category.tokenCount ?? "—"} assets</small></div>; })}</div> : <WidgetEmpty label="Category data unavailable" />}</>;
}

function IndexWidget({ kind, value, label, loading }: { kind: "fear" | "season"; value: number | null; label: string; loading: boolean }) {
  const title = kind === "fear" ? "Fear & Greed" : "Altcoin Season";
  const Icon = kind === "fear" ? Gauge : Layers3;
  return <><Header icon={Icon} kicker="CMC INDEX" title={title} />{loading ? <WidgetSkeleton rows={2} /> : value == null ? <WidgetEmpty label={`${title} unavailable`} /> : <div className="index-body"><div className="index-score"><strong>{Math.round(value)}</strong><span>/ 100</span></div><div className="index-track"><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></div><div className="index-label"><strong>{label}</strong><span>{kind === "season" ? "75+ signals altcoin season" : "Market sentiment"}</span></div></div>}</>;
}

function BenchmarkWidget({ data, loading }: { data: CmcOverview | null; loading: boolean }) {
  const indices = [{ name: "CMC20", item: data?.benchmarks.cmc20 }, { name: "CMC100", item: data?.benchmarks.cmc100 }];
  const hasData = indices.some(({ item }) => item?.value != null);
  return <><Header icon={Trophy} kicker="CMC BENCHMARKS" title="Broad market indices" />{loading ? <WidgetSkeleton rows={3} /> : hasData ? <div className="benchmark-body"><div className="benchmark-grid">{indices.map(({ name, item }) => <div key={name}><span>{name}</span><strong>{item?.value?.toLocaleString("en-US", { maximumFractionDigits: 2 }) ?? "—"}</strong><Change value={item?.change24h ?? null} compact /></div>)}</div><div className="benchmark-weights"><span>CMC20 top weights</span>{data?.benchmarks.cmc20?.constituents.slice(0, 4).map((asset) => <div key={asset.id}><strong>{asset.symbol}</strong><i><b style={{ width: `${Math.min(100, asset.weight ?? 0)}%` }} /></i><small>{formatPercent(asset.weight, false)}</small></div>)}</div></div> : <WidgetEmpty label="Benchmarks temporarily unavailable" />}</>;
}

function StablecoinWidget({ assets, loading }: { assets: CmcAssetQuote[]; loading: boolean }) {
  const symbols = new Set(["USDT", "USDC", "USDE", "DAI", "USDS", "FDUSD", "PYUSD", "TUSD"]);
  const stables = assets.filter((asset) => symbols.has(asset.symbol.toUpperCase())).slice(0, 6);
  const marketCap = stables.reduce((sum, asset) => sum + (asset.marketCap ?? 0), 0);
  return <><Header icon={BadgeDollarSign} kicker="STABLECOINS" title="Peg & liquidity monitor" />{loading ? <WidgetSkeleton rows={4} /> : stables.length ? <div className="stable-body"><div className="stable-total"><span>Tracked market cap</span><strong>{formatMoney(marketCap)}</strong></div><div className="stable-list">{stables.map((asset) => { const deviation = asset.price == null ? null : (asset.price - 1) * 10_000; const healthy = deviation != null && Math.abs(deviation) < 20; return <div key={asset.id}><strong>{asset.symbol}</strong><span>{formatPrice(asset.price)}</span><b className={healthy ? "positive" : "negative"}>{deviation == null ? "—" : `${deviation > 0 ? "+" : ""}${deviation.toFixed(1)} bps`}</b><small>{formatMoney(asset.volume24h)} vol</small></div>; })}</div></div> : <WidgetEmpty label="No stablecoins in current market window" />}</>;
}

function LiquidationsWidget({ data }: { data: CmcOverview | null }) {
  const item = data?.liquidations;
  return <><Header icon={ShieldAlert} kicker="LEVERAGE STRESS" title="Liquidation pulse" />{!item?.available ? <AccessNeeded /> : <><div className="liquidation-total"><span>24h liquidations</span><strong>{formatMoney(item.total24h)}</strong></div><div className="liquidation-split"><div><span>Longs</span><strong>{formatMoney(item.longs24h)}</strong><i className="long-bar" /></div><div><span>Shorts</span><strong>{formatMoney(item.shorts24h)}</strong><i className="short-bar" /></div></div><div className="window-row"><span>1h <strong>{formatMoney(item.total1h)}</strong></span><span>4h <strong>{formatMoney(item.total4h)}</strong></span></div></>}</>;
}

function FundingWidget({ data }: { data: CmcOverview | null }) {
  const item = data?.derivatives;
  return <><Header icon={Landmark} kicker="DERIVATIVES" title="SOL funding & OI" />{!item?.available ? <AccessNeeded /> : <><div className="funding-main"><div><span>Funding</span><strong>{item.fundingRate == null ? "—" : `${(item.fundingRate * 100).toFixed(4)}%`}</strong></div><div><span>Open interest</span><strong>{formatMoney(item.openInterest)}</strong></div></div><div className="venue-row"><span>{item.venue ?? "Venue"}</span><span>{item.pair ?? "SOL perpetual"}</span></div></>}</>;
}

function RwaWidget({ data, loading }: { data: CmcOverview | null; loading: boolean }) {
  const assets = data?.rwaAssets ?? [];
  return <><Header icon={WalletCards} kicker="TOKENIZED ASSETS" title="RWA market map" />{loading ? <WidgetSkeleton rows={5} /> : !data || data.mode !== "full" ? <AccessNeeded /> : assets.length ? <div className="rwa-table"><div className="rwa-head"><span>Underlying</span><span>Type</span><span>Tokenized cap</span><span>24h volume</span></div>{assets.slice(0, 6).map((asset) => <div className="rwa-row" key={asset.id}><span><strong>{asset.symbol}</strong><small>{asset.name}</small></span><span className="rwa-type">{asset.type}</span><strong>{formatMoney(asset.marketCap)}</strong><strong>{formatMoney(asset.volume24h)}</strong></div>)}</div> : <WidgetEmpty label="RWA feed unavailable" />}</>;
}

function ApiHealthWidget({ data, loading }: { data: CmcOverview | null; loading: boolean }) {
  const usage = data?.apiUsage;
  const monthlyPercent = usage?.monthlyLimit ? ((usage.monthlyUsed ?? 0) / usage.monthlyLimit) * 100 : 0;
  const minutePercent = usage?.minuteLimit ? ((usage.minuteUsed ?? 0) / usage.minuteLimit) * 100 : 0;
  return <><Header icon={ServerCog} kicker="DATA GOVERNOR" title="CMC API health" />{loading ? <WidgetSkeleton rows={3} /> : !data || data.mode !== "full" ? <AccessNeeded /> : usage ? <div className="usage-body"><UsageRow label="Monthly credits" used={usage.monthlyUsed} left={usage.monthlyLeft} percent={monthlyPercent} /><UsageRow label="Requests this minute" used={usage.minuteUsed} left={usage.minuteLeft} percent={minutePercent} /><div className="usage-reset"><Database aria-hidden="true" /><span>Credit reset</span><strong>{usage.resetsAt ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(usage.resetsAt)) : "—"}</strong></div></div> : <WidgetEmpty label="Usage information unavailable" />}</>;
}

function UsageRow({ label, used, left, percent }: { label: string; used: number | null; left: number | null; percent: number }) {
  return <div className="usage-row"><div><span>{label}</span><strong>{used?.toLocaleString() ?? "—"} used</strong></div><i><b style={{ width: `${Math.min(100, percent)}%` }} /></i><small>{left?.toLocaleString() ?? "—"} remaining</small></div>;
}

function ThesisWidget({ sol }: { sol: CmcAssetQuote | null }) {
  const positive = (sol?.change24h ?? 0) >= 0;
  return <><Header icon={Sparkles} kicker="WORKING THESIS" title={positive ? "Momentum is constructive" : "Momentum needs confirmation"} /><p className="thesis-copy">SOL’s price move is visible. The thesis remains conditional on volume confirmation and neutral leverage.</p><div className="confidence"><span>Confidence</span><div><i /></div><strong>68%</strong></div><div className="evidence-count"><span>3 supporting</span><span>2 unresolved</span></div></>;
}

function AgentWidget({ data, proposal, setProposal }: { data: CmcOverview | null; proposal: "pending" | "accepted" | "rejected"; setProposal: (value: "pending" | "accepted" | "rejected") => void }) {
  const live = data?.derivatives.available && data?.liquidations.available;
  return <><div className="proposal-flag"><Bot aria-hidden="true" /> {proposal === "accepted" ? "MONITOR ACTIVE" : proposal === "rejected" ? "PROPOSAL REJECTED" : "RISK AGENT PROPOSED"}</div><Header icon={BrainCircuit} kicker="AGENT MONITOR" title="Momentum crowding" /><p className="agent-copy">Warn when SOL rises while volume weakens, funding turns positive, and liquidations accelerate.</p><div className="rule-stack"><span>PRICE ↑</span><b>+</b><span>VOLUME ↓</span><b>+</b><span>FUNDING ↑</span></div><div className="monitor-meta"><span><Clock3 aria-hidden="true" /> Every 5 min</span><span>{live ? "4 live inputs" : "2 public inputs"}</span></div>{proposal === "pending" ? <div className="proposal-actions"><Button className="accept-button" onClick={() => setProposal("accepted")}><Check aria-hidden="true" /> Accept</Button><Button variant="ghost" onClick={() => setProposal("rejected")}><X aria-hidden="true" /> Reject</Button></div> : proposal === "accepted" ? <div className="active-monitor"><i /> Watching live conditions</div> : <div className="rejected-monitor"><button type="button" onClick={() => setProposal("pending")}>Restore proposal</button></div>}</>;
}

function InspectorContent({ id, data, sol, proposal }: { id: WidgetId; data: CmcOverview | null; sol: CmcAssetQuote | null; proposal: "pending" | "accepted" | "rejected" }) {
  const definition = widgetCatalog.find((item) => item.id === id)!;
  const inputs = useMemo(() => {
    if (["leaderboard", "performance", "movers", "breadth", "dominance", "volume", "valuation", "venues", "stablecoins"].includes(id)) return ["Top-30 market listings", "USD quotes", "60-second refresh"];
    if (id === "categories") return ["CMC category aggregates", "Market cap", "24h sector change"];
    if (id === "benchmark") return ["CMC20 latest", "CMC100 latest", "Constituent weights"];
    if (id === "rwa") return ["RWA asset list", "Tokenized market cap", "Tokenized 24h volume"];
    if (id === "apihealth") return ["CMC key info", "Minute requests", "Monthly credits"];
    if (id === "agent") return ["SOL price change", "24h volume", "Funding rate", "Liquidations"];
    if (id === "regime") return ["Global market cap", "24h volume", "BTC dominance", "ETH dominance"];
    if (id === "liquidations") return ["1h liquidations", "4h liquidations", "24h long/short split"];
    return [definition.name, "Last updated timestamp"];
  }, [definition.name, id]);
  return <><InspectorSection title="Purpose"><p>{definition.detail}.</p></InspectorSection><InspectorSection title="Inputs">{inputs.map((input) => <DataRow key={input} label={input} value="CMC" />)}</InspectorSection>{id === "agent" && <InspectorSection title="Logic"><code>price_24h &gt; 0 AND volume_change_24h &lt; 0 AND funding_rate &gt; threshold</code><p className="logic-note">This rule cannot alert or change the thesis until you accept it.</p></InspectorSection>}<InspectorSection title="Provenance"><DataRow label="Provider" value="CoinMarketCap" /><DataRow label="Access" value={data?.mode === "full" ? "Full API" : "Public API"} /><DataRow label="Retrieved" value={data ? timeAgo(data.retrievedAt) : "Waiting"} />{sol?.lastUpdated && <DataRow label="SOL source" value={timeAgo(sol.lastUpdated)} />}</InspectorSection>{id === "agent" && <InspectorSection title="Human control"><div className="permission"><Check aria-hidden="true" /><span><strong>Read CMC data</strong><small>Allowed</small></span></div><div className="permission"><Check aria-hidden="true" /><span><strong>Change board</strong><small>{proposal === "accepted" ? "Monitor accepted" : "Approval required"}</small></span></div></InspectorSection>}</>;
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="inspector-section"><h3>{title}</h3>{children}</section>; }
function DataRow({ label, value }: { label: string; value: string }) { return <div className="data-row"><span>{label}</span><strong>{value}</strong></div>; }
function WidgetSkeleton({ rows }: { rows: number }) { return <div className="widget-skeleton" aria-label="Loading market data">{Array.from({ length: rows }).map((_, index) => <i key={index} />)}</div>; }
function WidgetEmpty({ label }: { label: string }) { return <div className="widget-empty"><CircleAlert aria-hidden="true" /><span>{label}</span></div>; }
function AccessNeeded() { return <div className="access-needed"><Zap aria-hidden="true" /><div><strong>Full API widget</strong><span>Add the CMC key to load this live feed.</span></div></div>; }

function Change({ value, compact = false }: { value: number | null; compact?: boolean }) {
  const positive = (value ?? 0) >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return <span className={positive ? "positive" : "negative"}><Icon aria-hidden="true" />{compact ? formatPercent(value) : `${formatPercent(value)} · 24h`}</span>;
}

function HeatValue({ value }: { value: number | null }) {
  const intensity = value == null ? 0 : Math.min(1, Math.abs(value) / 12);
  const color = value == null ? "transparent" : value >= 0 ? `rgba(66,181,154,${0.08 + intensity * 0.32})` : `rgba(215,108,92,${0.08 + intensity * 0.32})`;
  return <span className={value == null ? "heat-value" : value >= 0 ? "heat-value positive" : "heat-value negative"} style={{ background: color }}>{formatPercent(value)}</span>;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function assetDexShare(asset: CmcAssetQuote) {
  const total = (asset.cexVolume24h ?? 0) + (asset.dexVolume24h ?? 0);
  return total ? ((asset.dexVolume24h ?? 0) / total) * 100 : 0;
}

function formatPrice(value: number | null) {
  if (value == null) return "—";
  if (value >= 1) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
  return `$${value.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`;
}
function formatMoney(value: number | null) { return value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatPercent(value: number | null, sign = true) { return value == null ? "—" : `${sign && value > 0 ? "+" : ""}${value.toFixed(2)}%`; }
function timeAgo(iso: string) { const seconds = Math.round(Math.max(0, Date.now() - new Date(iso).getTime()) / 1000); if (seconds < 60) return `${seconds}s ago`; const minutes = Math.round(seconds / 60); return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`; }
function sourceLabel(mode?: "full" | "public", error?: string | null, retrievedAt?: string) { if (error) return "CMC connection interrupted"; if (!retrievedAt) return "Connecting to CMC…"; return `CMC ${mode === "full" ? "full API" : "public API"} · ${timeAgo(retrievedAt)}`; }
