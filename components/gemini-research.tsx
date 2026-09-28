"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import type { AgentResult } from "@/lib/gemini-agent";
import { boardRevision } from "@/lib/workspace-edits";
import { parseWorkspaceBoard, type WorkspaceBoard } from "@/lib/workspace";
import { parseBoard, WIDGET_IDS } from "@/lib/plan3-board";

export function GeminiResearch({ board, disabled, reviewing, onResult }: {
  board: WorkspaceBoard; disabled: boolean; reviewing: boolean;
  onResult: (result: AgentResult, base: WorkspaceBoard) => boolean;
}) {
  const [status, setStatus] = useState<{ configured: boolean; enabled?: boolean; model: string } | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [check, setCheck] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AgentResult | null>(null);
  const request = useRef<AbortController | null>(null);
  const latestBoard = useRef(board);
  latestBoard.current = board;
  const latestResultHandler = useRef(onResult);
  latestResultHandler.current = onResult;

  useEffect(() => {
    const controller = new AbortController();
    setStatus(null); setConnectionError("");
    fetch("/api/agent", { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]), cache: "no-store" })
      .then(async response => { const body = await response.json() as { configured: boolean; model: string; error?: string }; if (!response.ok) throw new Error(body.error || "Could not check the Gemini connection."); return body; })
      .then(body => { if (!controller.signal.aborted) setStatus(body); })
      .catch(err => { if (!controller.signal.aborted) setConnectionError(err instanceof Error ? err.message : "Could not check the Gemini connection."); });
    return () => controller.abort();
  }, [check]);
  useEffect(() => () => { request.current?.abort(); }, []);
  useEffect(() => { request.current?.abort(); setResult(null); setError(""); setBusy(false); }, [board.id]);

  async function ask() {
    if (request.current || !status?.configured || disabled) return;
    const controller = new AbortController();
    request.current = controller;
    const base = structuredClone(board);
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, board: base }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(65_000)]),
      });
      const body = await response.json() as AgentResult & { error?: string };
      if (!response.ok) throw new Error(body.error || "The research agent could not finish. Try again.");
      if (controller.signal.aborted) return;
      const proposal = parseWorkspaceBoard(body.proposal, WIDGET_IDS, parseBoard);
      if (!proposal || body.baseRevision !== boardRevision(base)) throw new Error("The response did not match this board. Nothing was changed; try again.");
      if (boardRevision(latestBoard.current) !== boardRevision(base)) throw new Error("Your board changed while Gemini was working. Ask again using the latest board; no changes were applied.");
      const next = { ...body, proposal } as AgentResult;
      if (!latestResultHandler.current(next, base)) throw new Error("Another proposal or board edit arrived. Review it first, then ask Gemini again.");
      setResult(next);
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "The request timed out. Your board is unchanged; try again.");
    } finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  }

  return <section className="studio-gemini" aria-label="Gemini research agent">
    <div className="studio-agent-note"><Sparkles aria-hidden="true" /><h3>Research with Gemini</h3><p>Ask about the evidence, challenge a thesis, or propose widgets for this board. You approve every change.</p></div>
    <p className="studio-subtle" role="status">{status ? `${status.model} · ${status.enabled === false ? "Paused pending provider verification" : status.configured ? "Key configured · verified when you send a request" : "Setup required"}` : connectionError || "Checking Gemini configuration…"}</p>
    {(!status?.configured || connectionError) && <div className="research-receipt">
      {status && (status.enabled === false ? <p>Gemini research is paused while full provider requests are being verified. Your dashboard and rule-based tools remain available.</p> : <p>Add <code>GEMINI_API_KEY</code> to the server environment to enable Gemini. Never paste keys into the research question.</p>)}
      {connectionError.startsWith("Sign in") && <a href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in to Plan3</a>}
      <button type="button" onClick={() => setCheck(n => n + 1)}>Check connection again</button>
    </div>}
    {!reviewing && <form onSubmit={event => { event.preventDefault(); void ask(); }}>
      <label htmlFor="gemini-question">Your question or board change</label>
      <textarea id="gemini-question" value={prompt} onChange={event => setPrompt(event.target.value)} minLength={8} maxLength={2000} required rows={4} disabled={busy || disabled} aria-describedby="gemini-privacy gemini-error" placeholder="Compare SOL with BTC and ETH, then add a volume condition to challenge my thesis." />
      <p id="gemini-privacy" className="studio-subtle">Sending shares this question, the current board (including notes), and a CMC snapshot with Google Gemini. API usage may incur charges. No other boards are sent.</p>
      <div className="studio-field-row">
        <button type="submit" className="studio-primary" disabled={busy || disabled || !status?.configured || prompt.trim().length < 8} aria-busy={busy}><Sparkles aria-hidden="true" />{busy ? "Reviewing your board…" : "Ask Gemini"}</button>
        {busy && <button type="button" onClick={() => { request.current?.abort(); setError("Request canceled. Your board is unchanged; provider usage may still be charged."); }}>Cancel request</button>}
      </div>
      {busy && <p role="status" className="studio-subtle">Reading CMC data and preparing a response. Nothing is being applied.</p>}
    </form>}
    <p id="gemini-error" role="alert" className="studio-agent-error">{error}</p>
    {result && <section className="studio-agent-answer" aria-label="Gemini research response">
      <span className="eyebrow">GEMINI RESPONSE · VERIFY BEFORE ACTING</span>
      <p>{result.analysis}</p>
      {!!result.evidence.length && <details open><summary>Evidence from the supplied snapshot</summary><ul>{result.evidence.map((item, i) => <li key={i}>{item.claim}<small>{item.label} · {item.status}</small></li>)}</ul></details>}
      {!!result.caveats.length && <><h4>Limits & uncertainties</h4><ul>{result.caveats.map((text, i) => <li key={i}>{text}</li>)}</ul></>}
      <p className="studio-subtle">Snapshot retrieved {new Date(result.retrievedAt).toLocaleString()}. Citations identify supplied feeds; they do not verify the model’s interpretation. No trades or background monitoring.</p>
    </section>}
  </section>;
}
