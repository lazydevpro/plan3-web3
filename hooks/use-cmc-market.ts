"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CmcOverview } from "@/lib/cmc";
import { mergeMarket, readMarketStream } from "@/lib/market-stream";

type MarketState = {
  data: CmcOverview | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function useCmcMarket() {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<MarketState>({ data: null, loading: true, refreshing: false, error: null });
  const controller = useRef<AbortController | null>(null);

  const load = useCallback(async (refreshing = false) => {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    if (!navigator.onLine) {
      setState(current => ({ ...current, loading: false, refreshing: false, error: "You’re offline. Your local board is editable; market values may be stale. Reconnect to refresh." }));
      return;
    }
    setState((current) => ({ ...current, loading: !current.data, refreshing, error: null }));
    const timeout = window.setTimeout(() => {
      nextController.abort();
      setState(current => ({ ...current, loading: false, refreshing: false, error: "The refresh timed out. Your board is safe; retry the data connection." }));
    }, 30_000);
    try {
      const response = await fetch(`/api/cmc?scope=${expanded ? "all" : "core"}`, { signal: nextController.signal, cache: "no-store", headers: { Accept: "application/x-ndjson" } });
      await readMarketStream(response, (payload, done) => {
        if (nextController.signal.aborted) return;
        setState(current => ({ data: mergeMarket(current.data, payload), loading: false, refreshing: !done, error: done && payload.health === "unavailable" ? "CoinMarketCap is unavailable. Last-known values are retained; retry shortly." : null }));
      });
    } catch (error) {
      if (nextController.signal.aborted) return;
      setState((current) => ({ ...current, loading: false, refreshing: false, error: error instanceof Error ? error.message : "Market data could not be loaded" }));
    } finally { window.clearTimeout(timeout); }
  }, [expanded]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void load(true); }, 60_000);
    const resume = () => { if (document.visibilityState === "visible") void load(true); };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    const offline = () => { controller.current?.abort(); setState(current => ({ ...current, loading: false, refreshing: false, error: "You’re offline. Your local board is editable; market values may be stale. Reconnect to refresh." })); };
    window.addEventListener("offline", offline);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", offline);
      controller.current?.abort();
    };
  }, [load]);

  return { ...state, setExpanded, retry: () => load(true) };
}
