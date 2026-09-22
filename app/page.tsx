"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, Bot, BrainCircuit, Check, ChevronDown, CircleAlert, Clock3,
  Command, Crosshair, ExternalLink, Eye, Focus, Gauge, Grid2X2, History,
  Landmark, Layers3, Link2, Maximize2, Menu, MousePointer2, PanelRight, Plus,
  RefreshCw, Search, Share2, ShieldAlert, Sparkles, TrendingDown, TrendingUp,
  Waves, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCmcMarket } from "@/hooks/use-cmc-market";
import type { CmcAssetQuote, CmcOverview } from "@/lib/cmc";

type Mode = "Build" | "Live" | "Focus";
type WidgetId = "market" | "watchlist" | "regime" | "fear" | "season" | "liquidations" | "funding" | "thesis" | "agent";

const widgetCatalog: Array<{ id: WidgetId; name: string; detail: string; icon: typeof Activity; access: "Live" | "Full access" | "Plan3" }> = [
  { id: "market", name: "Asset snapshot", detail: "Price, volume, market cap and momentum", icon: Activity, access: "Live" },
  { id: "watchlist", name: "Smart watchlist", detail: "Comparable market context for selected assets", icon: Eye, access: "Live" },
  { id: "regime", name: "Market regime", detail: "Market cap, dominance and risk context", icon: Waves, access: "Live" },
  { id: "fear", name: "Fear & Greed", detail: "CMC proprietary sentiment index", icon: Gauge, access: "Live" },
  { id: "season", name: "Altcoin Season", detail: "Bitcoin-to-altcoin rotation index", icon: Layers3, access: "Live" },
  { id: "liquidations", name: "Liquidation pulse", detail: "Long, short and total forced closures", icon: ShieldAlert, access: "Full access" },
  { id: "funding", name: "Funding & basis", detail: "SOL leverage and derivatives crowding", icon: Landmark, access: "Full access" },
  { id: "thesis", name: "Thesis", detail: "Human-owned conclusion and confidence", icon: Sparkles, access: "Plan3" },
  { id: "agent", name: "Agent monitor", detail: "Inspectable rule with human approval", icon: Bot, access: "Plan3" },
];

const defaultWidgets: WidgetId[] = ["market", "watchlist", "regime", "fear", "liquidations", "agent"];

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
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const sol = market.data?.assets.find((asset) => asset.symbol === "SOL") ?? null;
  const selectedDefinition = widgetCatalog.find((widget) => widget.id === selected) ?? widgetCatalog[0];

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
            <div><span className="eyebrow">CMC WIDGETS</span><h2>Add to this board</h2></div>
            <Button variant="ghost" size="icon" onClick={() => setLibraryOpen(false)} aria-label="Close widget library"><X aria-hidden="true" /></Button>
          </div>
          <div className="library-list">
            {widgetCatalog.map(({ id, icon: Icon, name, detail, access }) => {
              const added = widgets.includes(id);
              return (
                <button className="library-item focus-ring" type="button" key={id} onClick={() => addWidget(id)} disabled={added}>
                  <span className="library-icon"><Icon aria-hidden="true" /></span>
                  <span><strong>{name}</strong><small>{detail}</small></span>
                  <span className={access === "Full access" ? "access-full" : "access-live"}>{added ? "Added" : access}</span>
                </button>
              );
            })}
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
  if (id === "regime") return <RegimeWidget data={market.data} loading={market.loading} />;
  if (id === "fear") return <IndexWidget kind="fear" value={market.data?.fearAndGreed.value ?? null} label={market.data?.fearAndGreed.label ?? "Waiting for CMC"} loading={market.loading} />;
  if (id === "season") return <IndexWidget kind="season" value={market.data?.altcoinSeason.value ?? null} label={market.data?.altcoinSeason.label ?? "Waiting for CMC"} loading={market.loading} />;
  if (id === "liquidations") return <LiquidationsWidget data={market.data} />;
  if (id === "funding") return <FundingWidget data={market.data} />;
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

function RegimeWidget({ data, loading }: { data: CmcOverview | null; loading: boolean }) {
  const global = data?.global;
  const riskOn = (global?.marketCapChange24h ?? 0) >= 0;
  return <><Header icon={Waves} kicker="MARKET REGIME" title={riskOn ? "Risk-on · BTC led" : "Defensive · risk-off"} />{loading ? <WidgetSkeleton rows={3} /> : <><div className="regime-hero"><span className={riskOn ? "regime-up" : "regime-down"}>{riskOn ? <TrendingUp aria-hidden="true" /> : <TrendingDown aria-hidden="true" />}{formatPercent(global?.marketCapChange24h ?? null)}</span><small>24h crypto market cap</small></div><dl className="regime-grid"><div><dt>Total market</dt><dd>{formatMoney(global?.totalMarketCap ?? null)}</dd></div><div><dt>24h volume</dt><dd>{formatMoney(global?.totalVolume24h ?? null)}</dd></div><div><dt>BTC dominance</dt><dd>{formatPercent(global?.btcDominance ?? null, false)}</dd></div><div><dt>ETH dominance</dt><dd>{formatPercent(global?.ethDominance ?? null, false)}</dd></div></dl></>}</>;
}

function IndexWidget({ kind, value, label, loading }: { kind: "fear" | "season"; value: number | null; label: string; loading: boolean }) {
  const title = kind === "fear" ? "Fear & Greed" : "Altcoin Season";
  const Icon = kind === "fear" ? Gauge : Layers3;
  return <><Header icon={Icon} kicker="CMC INDEX" title={title} />{loading ? <WidgetSkeleton rows={2} /> : value == null ? <WidgetEmpty label={`${title} unavailable`} /> : <div className="index-body"><div className="index-score"><strong>{Math.round(value)}</strong><span>/ 100</span></div><div className="index-track"><i style={{ width: `${Math.max(2, Math.min(100, value))}%` }} /></div><div className="index-label"><strong>{label}</strong><span>{kind === "season" ? "75+ signals altcoin season" : "Market sentiment"}</span></div></div>}</>;
}

function LiquidationsWidget({ data }: { data: CmcOverview | null }) {
  const item = data?.liquidations;
  return <><Header icon={ShieldAlert} kicker="LEVERAGE STRESS" title="Liquidation pulse" />{!item?.available ? <AccessNeeded /> : <><div className="liquidation-total"><span>24h liquidations</span><strong>{formatMoney(item.total24h)}</strong></div><div className="liquidation-split"><div><span>Longs</span><strong>{formatMoney(item.longs24h)}</strong><i className="long-bar" /></div><div><span>Shorts</span><strong>{formatMoney(item.shorts24h)}</strong><i className="short-bar" /></div></div><div className="window-row"><span>1h <strong>{formatMoney(item.total1h)}</strong></span><span>4h <strong>{formatMoney(item.total4h)}</strong></span></div></>}</>;
}

function FundingWidget({ data }: { data: CmcOverview | null }) {
  const item = data?.derivatives;
  return <><Header icon={Landmark} kicker="DERIVATIVES" title="SOL funding & OI" />{!item?.available ? <AccessNeeded /> : <><div className="funding-main"><div><span>Funding</span><strong>{item.fundingRate == null ? "—" : `${(item.fundingRate * 100).toFixed(4)}%`}</strong></div><div><span>Open interest</span><strong>{formatMoney(item.openInterest)}</strong></div></div><div className="venue-row"><span>{item.venue ?? "Venue"}</span><span>{item.pair ?? "SOL perpetual"}</span></div></>}</>;
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

function formatPrice(value: number | null) {
  if (value == null) return "—";
  if (value >= 1) return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
  return `$${value.toLocaleString("en-US", { maximumSignificantDigits: 4 })}`;
}
function formatMoney(value: number | null) { return value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value); }
function formatPercent(value: number | null, sign = true) { return value == null ? "—" : `${sign && value > 0 ? "+" : ""}${value.toFixed(2)}%`; }
function timeAgo(iso: string) { const seconds = Math.round(Math.max(0, Date.now() - new Date(iso).getTime()) / 1000); if (seconds < 60) return `${seconds}s ago`; const minutes = Math.round(seconds / 60); return minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`; }
function sourceLabel(mode?: "full" | "public", error?: string | null, retrievedAt?: string) { if (error) return "CMC connection interrupted"; if (!retrievedAt) return "Connecting to CMC…"; return `CMC ${mode === "full" ? "full API" : "public API"} · ${timeAgo(retrievedAt)}`; }
