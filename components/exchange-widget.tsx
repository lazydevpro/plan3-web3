"use client";

import { lazy, Suspense, useEffect, useId, useState, useSyncExternalStore } from "react";
import { ArrowDownUp, ExternalLink, ShieldCheck } from "lucide-react";
import { WidgetBoundary } from "./widget-boundary";

type Provider = "jupiter" | "lifi";
const Lifi = lazy(() => import("./lifi-widget"));
const providers = {
  jupiter: { name: "Jupiter", scope: "Solana · Mainnet", url: "https://jup.ag/", action: "Swap" },
  lifi: { name: "LI.FI", scope: "EVM + Solana · Mainnet", url: "https://jumper.exchange/", action: "Bridge & swap" },
};

// Jupiter exposes a page-wide singleton; LI.FI also shares SDK configuration.
// Explicit ownership prevents duplicate cards from stealing a live trade session.
const owners: Partial<Record<Provider, string>> = {};
const listeners = new Set<() => void>();
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
function notify() { listeners.forEach(listener => listener()); }

type JupiterApi = {
  init: (options: { displayMode: "integrated"; integratedTargetId: string; autoConnect: boolean; localStoragePrefix: string; containerStyles: Record<string, string> }) => void | Promise<void>;
  close: () => void;
  root?: { unmount: () => void } | null;
};
declare global { interface Window { Jupiter?: JupiterApi } }
let jupiterLoad: Promise<JupiterApi> | undefined;
function loadJupiter() {
  if (window.Jupiter) return Promise.resolve(window.Jupiter);
  if (jupiterLoad) return jupiterLoad;
  jupiterLoad = new Promise<JupiterApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://plugin.jup.ag/plugin-v1.js";
    script.async = true;
    const fail = () => { clearTimeout(timer); script.remove(); jupiterLoad = undefined; reject(new Error("Jupiter could not load. Check your connection and retry.")); };
    const timer = window.setTimeout(fail, 20_000);
    script.onerror = fail;
    script.onload = () => {
      clearTimeout(timer);
      if (window.Jupiter) resolve(window.Jupiter); else fail();
    };
    document.head.appendChild(script);
  });
  return jupiterLoad;
}

function Jupiter({ id }: { id: string }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    let mountedRoot: JupiterApi["root"];
    setState("loading");
    void loadJupiter().then(async api => {
      if (cancelled) return;
      await api.init({ displayMode: "integrated", integratedTargetId: id, autoConnect: false, localStoragePrefix: "plan3-jupiter", containerStyles: { width: "100%", height: "100%" } });
      mountedRoot = api.root;
      if (cancelled) mountedRoot?.unmount(); else setState("ready");
    }).catch(() => { if (!cancelled) setState("error"); });
    return () => { cancelled = true; const root = mountedRoot; if (root) queueMicrotask(() => root.unmount()); };
  }, [id, attempt]);
  return <>
    {state === "loading" && <ExchangeLoading name="Jupiter" />}
    {state === "error" && <div className="exchange-message" role="alert"><p>Jupiter couldn’t load. Check your connection or open the provider directly.</p><button onClick={() => setAttempt(value => value + 1)}>Retry Jupiter</button></div>}
    <div id={id} className="exchange-jupiter-mount" hidden={state === "error"} />
  </>;
}

function ExchangeLoading({ name }: { name: string }) {
  return <div className="exchange-loading" role="status"><span>Loading {name}…</span><i /><i /><small>No wallet connection or transaction has been requested by Plan3.</small></div>;
}

export function ExchangeWidget({ provider, preview = false }: { provider: Provider; preview?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [active, setActive] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const owner = useSyncExternalStore(subscribe, () => owners[provider] ?? "", () => "");
  const busy = !!owner && owner !== id;
  const info = providers[provider];
  useEffect(() => () => { if (owners[provider] === id) { delete owners[provider]; notify(); } }, [provider, id]);
  function activate() {
    if (preview || (owners[provider] && owners[provider] !== id)) return;
    owners[provider] = id; notify(); setActive(true);
  }
  function close() { setActive(false); setConfirmClose(false); if (owners[provider] === id) { delete owners[provider]; notify(); } }
  return <section className={`exchange-widget ${preview ? "exchange-preview" : ""}`} data-exchange-surface onKeyDown={event => event.stopPropagation()}>
    <div className="exchange-heading"><strong>{info.name}</strong><span>{info.scope}</span></div>
    {!active ? <>
      <div className="exchange-form-preview" aria-label={`${info.name} layout preview, not a live quote`}>
        <div><span>You pay</span><strong>—</strong><small>Select token{provider === "lifi" ? " & network" : ""}</small></div>
        <ArrowDownUp aria-hidden="true" />
        <div><span>You receive</span><strong>—</strong><small>{provider === "lifi" ? "Choose destination" : "Select token"}</small></div>
        <span className="exchange-preview-action">{info.action}</span>
      </div>
      {!preview && <>
        <p className="exchange-disclosure">Loads {info.name} and its services. Connect your wallet there and review all fees before signing. Research prices are not executable quotes.</p>
        <button className="exchange-activate" disabled={busy} onClick={activate}>{busy ? `${info.name} is active in another card` : `Activate ${info.name}`}</button>
        {busy && <small>Close its active session before using this card.</small>}
      </>}
      {preview && <small>Layout preview · no wallet or live quote</small>}
    </> : <>
      <div className="exchange-session"><span><ShieldCheck size={14} aria-hidden="true" /> You approve every signature</span><button onClick={() => setConfirmClose(true)}>Close session</button></div>
      {confirmClose && <div className="exchange-message" role="alert"><p>Closing hides this session; it does not cancel a submitted transaction. Keep it open while a swap or bridge is pending.</p><button onClick={() => setConfirmClose(false)}>Keep open</button><button onClick={close}>Close anyway</button></div>}
      <div className="exchange-live"><WidgetBoundary resetKey={`${provider}-${id}`}><Suspense fallback={<ExchangeLoading name={info.name} />}>
        {provider === "jupiter" ? <Jupiter id={`jupiter-${id}`} /> : <Lifi id={id} />}
      </Suspense></WidgetBoundary></div>
    </>}
    {!preview && <footer><a href={info.url} target="_blank" rel="noopener noreferrer">Open {provider === "lifi" ? "Jumper by LI.FI" : "Jupiter"} <ExternalLink size={14} aria-hidden="true" /></a><small>No added Plan3 fee</small></footer>}
  </section>;
}
