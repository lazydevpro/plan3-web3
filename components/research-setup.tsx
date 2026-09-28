"use client";

import { useState } from "react";
import { METRICS, type Metric, type WorkspaceBoard } from "@/lib/workspace";
import { createResearchBoard } from "@/lib/research-setup";

export function ResearchSetup({ onCreate, disabled }: { onCreate: (board: WorkspaceBoard) => void; disabled: boolean }) {
  const [question, setQuestion] = useState("");
  const [asset, setAsset] = useState("SOL");
  const [metric, setMetric] = useState<Metric>("change24h");
  const [operator, setOperator] = useState<"lt" | "gt">("lt");
  const [threshold, setThreshold] = useState("-5");
  const [error, setError] = useState("");
  return <form className="research-setup" onSubmit={e => {
    e.preventDefault();
    if (!question.trim()) { setError("Write the question you want your board to answer."); document.getElementById("research-question")?.focus(); return; }
    if (!threshold.trim() || !Number.isFinite(Number(threshold))) { setError("Enter a number for the review threshold, for example −5."); document.getElementById("research-threshold")?.focus(); return; }
    setError(""); onCreate(createResearchBoard({ question, asset, metric, operator, threshold: Number(threshold) }));
  }}>
    <span className="eyebrow">YOUR FIRST RESEARCH LOOP</span>
    <h3>What are you investigating?</h3>
    <p>Turn a question into a connected, editable board. No wallet or agent required.</p>
    <label htmlFor="research-question">Research question<textarea id="research-question" required maxLength={600} rows={3} placeholder="Is SOL’s recent strength supported by trading activity?" value={question} onChange={e => setQuestion(e.target.value)} /></label>
    <label>Asset<select value={asset} onChange={e => setAsset(e.target.value)}><option>SOL</option><option>BTC</option><option>ETH</option></select></label>
    <fieldset><legend>Flag my thesis for review when…</legend>
      <label>Measure<select value={metric} onChange={e => setMetric(e.target.value as Metric)}>{Object.entries(METRICS).map(([key, info]) => <option key={key} value={key}>{info.label}</option>)}</select></label>
      <div className="studio-field-row"><label>Comparison<select value={operator} onChange={e => setOperator(e.target.value as "lt" | "gt")}><option value="lt">Below</option><option value="gt">Above</option></select></label><label htmlFor="research-threshold">Threshold ({METRICS[metric].unit})<input id="research-threshold" inputMode="decimal" required value={threshold} onChange={e => setThreshold(e.target.value)} aria-describedby={error ? "research-error" : undefined} aria-invalid={!!error || undefined} /></label></div>
    </fieldset>
    <div className="research-receipt"><strong>Your board will include</strong><span>A thesis + chart + watchlist + condition</span><span>Chart supports thesis · condition watches thesis</span></div>
    {error && <p id="research-error" role="alert">{error}</p>}
    <button className="studio-primary" disabled={disabled} type="submit">Create my research board</button>
    <small>Conditions check while this page is open. They prompt research, never trades.</small>
  </form>;
}
