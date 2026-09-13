"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Activity, Bell, Bot, ChartNoAxesCombined, Check, ChevronDown, CircleAlert,
  Clock3, Command, Crosshair, ExternalLink, Focus, Gauge, Grid2X2, History,
  Link2, Maximize2, Menu, MessageSquareText, MousePointer2, PanelRight, Plus,
  RefreshCw, Search, Share2, ShieldAlert, Sparkles, TrendingUp, X, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Mode = "Build" | "Live" | "Focus";
type WidgetName = "Market pulse" | "Momentum" | "Working thesis" | "Risk review" | "Agent proposal";

const pricePath = "M0 144 C35 137 48 149 76 130 C104 111 113 124 143 103 C176 80 192 94 224 70 C256 47 276 67 305 52 C338 35 362 43 392 18";
const volumeBars = [30, 42, 35, 52, 48, 63, 54, 72, 61, 80, 74, 92, 68, 84, 98, 79];

export default function Home() {
  const [mode, setMode] = useState<Mode>("Build");
  const [selected, setSelected] = useState<WidgetName>("Agent proposal");
  const [proposal, setProposal] = useState<"pending" | "accepted" | "rejected">("pending");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentBusy, setAgentBusy] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share");
  const [loading, setLoading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLibraryOpen(false);
        setSelected("Market pulse");
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
      name: "read_board_summary",
      title: "Read board summary",
      description: "Read the current Plan3 board mode and agent-monitor status without changing the board.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ board: "SOL momentum thesis", mode, monitorStatus: proposal }),
    });
    register({
      name: "set_workspace_mode",
      title: "Set workspace mode",
      description: "Switch the visible Plan3 workspace between Build, Live, and Focus modes.",
      inputSchema: { type: "object", properties: { mode: { type: "string", enum: ["Build", "Live", "Focus"] } }, required: ["mode"], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const nextMode = (input as { mode?: string }).mode;
        if (!(["Build", "Live", "Focus"] as string[]).includes(nextMode ?? "")) throw new Error("Mode must be Build, Live, or Focus");
        setMode(nextMode as Mode);
        return { mode: nextMode };
      },
    });
    register({
      name: "stage_divergence_monitor",
      title: "Stage divergence monitor",
      description: "Stage the SOL price and volume divergence monitor for human review on the visible board.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: () => {
        setProposal("pending");
        setSelected("Agent proposal");
        return { status: "proposed", requiresHumanApproval: true };
      },
    });

    return () => lifecycle.abort();
  }, [mode, proposal]);

  const refreshMarket = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 650);
  };

  const submitAgent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agentPrompt.trim()) return;
    setAgentBusy(true);
    window.setTimeout(() => {
      setProposal("pending");
      setSelected("Agent proposal");
      setAgentPrompt("");
      setAgentBusy(false);
    }, 800);
  };

  const shareBoard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareLabel("Link copied");
    } catch {
      setShareLabel("Ready to share");
    }
    window.setTimeout(() => setShareLabel("Share"), 1600);
  };

  return (
    <main className="app-shell">
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
          <button className="rail-button focus-ring" type="button" aria-label="Toggle inspector"><PanelRight aria-hidden="true" /></button>
        </nav>
      </aside>

      {libraryOpen && (
        <section className="widget-library" aria-label="Widget library">
          <div className="library-heading">
            <div><span className="eyebrow">ADD TO BOARD</span><h2>Widget library</h2></div>
            <Button variant="ghost" size="icon" onClick={() => setLibraryOpen(false)} aria-label="Close widget library"><X aria-hidden="true" /></Button>
          </div>
          {[{ icon: Gauge, name: "Market metric" }, { icon: ChartNoAxesCombined, name: "Chart" }, { icon: MessageSquareText, name: "Evidence" }, { icon: ShieldAlert, name: "Risk checklist" }].map(({ icon: Icon, name }) => (
            <button className="library-item focus-ring" type="button" key={name} onClick={() => setLibraryOpen(false)}><Icon aria-hidden="true" /><span>{name}</span><Plus aria-hidden="true" /></button>
          ))}
        </section>
      )}

      <section className={`canvas mode-${mode.toLowerCase()}`} aria-label="SOL momentum thesis board">
        <div className="canvas-meta">
          <span><Crosshair aria-hidden="true" /> Thesis board</span>
          <span className="live-source"><i /> CMC data · updated 12s ago</span>
        </div>

        <svg className="connections" viewBox="0 0 1000 700" preserveAspectRatio="none" aria-hidden="true">
          <path d="M250 188 C330 188 320 310 410 310" />
          <path d="M604 220 C676 230 650 330 734 344" />
          <path d="M470 450 C570 490 636 478 724 432" />
        </svg>

        <article className="widget market-widget" data-selected={selected === "Market pulse"}>
          <WidgetHeader icon={Activity} label="MARKET PULSE" title="SOL / USD" onFocus={() => setSelected("Market pulse")} />
          {loading ? (
            <div className="market-skeleton" aria-label="Refreshing market data"><i /><i /><i /></div>
          ) : (
            <>
              <div className="metric-line"><strong>$203.41</strong><span className="positive"><TrendingUp aria-hidden="true" /> 6.82%</span></div>
              <dl className="micro-stats"><div><dt>Market cap</dt><dd>$107.8B</dd></div><div><dt>24h volume</dt><dd>$6.31B</dd></div><div><dt>Rank</dt><dd>#5</dd></div></dl>
            </>
          )}
          <button className="source-row focus-ring" type="button" onClick={refreshMarket} disabled={loading}><span>CoinMarketCap</span><RefreshCw className={loading ? "is-spinning" : ""} aria-hidden="true" /> Refresh</button>
        </article>

        <article className="widget chart-widget" data-selected={selected === "Momentum"}>
          <WidgetHeader icon={ChartNoAxesCombined} label="MOMENTUM" title="SOL price · 30 days" onFocus={() => setSelected("Momentum")} />
          <div className="chart-summary"><div><strong>+21.4%</strong><span>30D change</span></div><div><strong>68</strong><span>RSI · warm</span></div></div>
          <div className="chart-area" aria-label="SOL price has risen over the last 30 days">
            <svg viewBox="0 0 392 160" preserveAspectRatio="none" role="img" aria-label="Rising SOL price chart">
              <defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--chart-copper)" stopOpacity=".32" /><stop offset="1" stopColor="var(--chart-copper)" stopOpacity="0" /></linearGradient></defs>
              <path d={`${pricePath} L392 160 L0 160 Z`} fill="url(#priceFill)" />
              <path d={pricePath} fill="none" stroke="var(--chart-copper)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="volume-bars" aria-hidden="true">{volumeBars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
          </div>
          <div className="chart-axis"><span>Aug 14</span><span>Aug 29</span><span>Sep 12</span></div>
        </article>

        <article className="widget thesis-widget" data-selected={selected === "Working thesis"}>
          <WidgetHeader icon={Sparkles} label="WORKING THESIS" title="Momentum is real—but stretched" onFocus={() => setSelected("Working thesis")} />
          <p>Price strength is supported by expanding volume. Confirmation needs a clean hold above $198 through the next daily close.</p>
          <div className="confidence"><span>Confidence</span><div><i /></div><strong>72%</strong></div>
          <div className="evidence-count"><span>4 supporting</span><span>2 unresolved</span></div>
        </article>

        <article className="widget risk-widget" data-selected={selected === "Risk review"}>
          <WidgetHeader icon={ShieldAlert} label="RISK REVIEW" title="Invalidation checks" onFocus={() => setSelected("Risk review")} />
          <ul className="risk-list">
            <li><span className="risk-check is-done"><Check aria-hidden="true" /></span><div><strong>Volume confirms move</strong><small>24h volume +18.6%</small></div></li>
            <li><span className="risk-check" /><div><strong>BTC holds market structure</strong><small>Monitoring $112.4k support</small></div></li>
            <li><span className="risk-check is-warning"><CircleAlert aria-hidden="true" /></span><div><strong>Funding getting crowded</strong><small>Review before entry</small></div></li>
          </ul>
        </article>

        {proposal !== "rejected" && (
          <article className={`widget agent-widget ${proposal === "accepted" ? "is-accepted" : ""}`} data-selected={selected === "Agent proposal"}>
            <div className="proposal-flag"><Bot aria-hidden="true" /> {proposal === "accepted" ? "MONITOR ACTIVE" : "SCOUT PROPOSED"}</div>
            <WidgetHeader icon={Zap} label="AGENT MONITOR" title="Price ↔ volume divergence" onFocus={() => setSelected("Agent proposal")} />
            <p>Flag when 7-day price change and volume change diverge by more than 20%.</p>
            <div className="monitor-rule"><span>IF</span><strong>| Δ price − Δ volume |</strong><span>&gt; 20%</span></div>
            <div className="monitor-meta"><span><Clock3 aria-hidden="true" /> Every 5 min</span><span>2 CMC inputs</span></div>
            {proposal === "pending" ? (
              <div className="proposal-actions"><Button className="accept-button" onClick={() => setProposal("accepted")}><Check aria-hidden="true" /> Accept</Button><Button variant="ghost" onClick={() => setProposal("rejected")}><X aria-hidden="true" /> Reject</Button></div>
            ) : (
              <div className="active-monitor"><i /> Watching live conditions</div>
            )}
          </article>
        )}

        <div className="zoom-controls" aria-label="Canvas zoom"><button className="focus-ring" type="button">−</button><span>84%</span><button className="focus-ring" type="button">+</button><button className="focus-ring" type="button" aria-label="Fit board"><Maximize2 aria-hidden="true" /></button></div>

        <form className="agent-command" onSubmit={submitAgent}>
          <Bot aria-hidden="true" />
          <label className="sr-only" htmlFor="agent-prompt">Ask an agent to work on this board</label>
          <input id="agent-prompt" value={agentPrompt} onChange={(event) => setAgentPrompt(event.target.value)} placeholder="Ask an agent to research, compare, or monitor…" autoComplete="off" />
          <span className="command-hint"><Command aria-hidden="true" /> K</span>
          <Button size="sm" type="submit" disabled={agentBusy || !agentPrompt.trim()}>{agentBusy ? "Working…" : "Run"}</Button>
        </form>
      </section>

      <aside className="inspector" aria-label="Widget inspector">
        <div className="inspector-head"><div><span className="eyebrow">INSPECTOR</span><h2>{selected}</h2></div><Button variant="ghost" size="icon" aria-label="Close inspector"><X aria-hidden="true" /></Button></div>
        <div className="inspector-status"><span className={proposal === "accepted" ? "status-live" : "status-proposed"}><i />{selected === "Agent proposal" ? (proposal === "accepted" ? "Active" : "Proposed") : "Live"}</span><button className="focus-ring" type="button">Activity <ExternalLink aria-hidden="true" /></button></div>

        {selected === "Agent proposal" ? (
          <>
            <InspectorSection title="Objective"><p>Warn me when SOL price rises while trading volume weakens.</p></InspectorSection>
            <InspectorSection title="Inputs"><DataRow label="SOL price" value="CMC · quote" /><DataRow label="24h volume" value="CMC · quote" /></InspectorSection>
            <InspectorSection title="Logic"><code>abs(price_change_7d − volume_change_7d) &gt; 20%</code></InspectorSection>
            <InspectorSection title="Permissions"><div className="permission"><Check aria-hidden="true" /><span><strong>Read market data</strong><small>CoinMarketCap only</small></span></div><div className="permission"><Check aria-hidden="true" /><span><strong>Create alert</strong><small>Needs your approval</small></span></div></InspectorSection>
            <InspectorSection title="Provenance"><DataRow label="Agent" value="Scout" /><DataRow label="Created" value="Just now" /><DataRow label="Model" value="Plan3 Research" /></InspectorSection>
          </>
        ) : (
          <div className="inspector-empty"><Focus aria-hidden="true" /><h3>{selected}</h3><p>This widget is connected to the SOL momentum thesis and uses live market context.</p><Button variant="secondary" onClick={() => setMode("Focus")}>Open Focus mode</Button></div>
        )}
      </aside>
    </main>
  );
}

function WidgetHeader({ icon: Icon, label, title, onFocus }: { icon: typeof Activity; label: string; title: string; onFocus: () => void }) {
  return <header className="widget-header"><div className="widget-heading"><span className="widget-kicker"><Icon aria-hidden="true" />{label}</span><h2>{title}</h2></div><button className="widget-menu focus-ring" type="button" onClick={onFocus} aria-label={`Inspect ${title}`}><Menu aria-hidden="true" /></button></header>;
}

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="inspector-section"><h3>{title}</h3>{children}</section>;
}

function DataRow({ label, value }: { label: string; value: string }) {
  return <div className="data-row"><span>{label}</span><strong>{value}</strong></div>;
}
