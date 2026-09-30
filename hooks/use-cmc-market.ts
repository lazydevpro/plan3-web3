"use client";
/* Fetching and subscribing to market data intentionally updates state from an effect. */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CmcOverview } from "@/lib/cmc";
import { finishInterruptedMarket, mergeMarket, readMarketStream } from "@/lib/market-stream";

type MarketState = {
  data: CmcOverview | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
};

export function useCmcMarket() {
  const [feedScope, setFeedScope] = useState("core");
  const [state, setState] = useState<MarketState>({ data: null, loading: true, refreshing: false, error: null });
  const controller = useRef<AbortController | null>(null);
  const setRequestedFeeds = useCallback((feeds: readonly string[] | null) => {
    const selection = feeds === null ? "all" : [...new Set(feeds)].sort().join(",");
    setFeedScope(selection === "assets,history,listings" ? "core" : selection);
  }, []);

  const load = useCallback(async (refreshing = false) => {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    if (!navigator.onLine) {
      setState(current => ({ ...current, loading: false, refreshing: false, error: "You’re offline. Your local board is editable; market values may be stale. Reconnect to refresh." }));
      return;
    }
    setState((current) => ({ ...current, loading: !current.data, refreshing: refreshing || !!current.data, error: null }));
    let receivedProgress = false;
    const finishFailure = (message: string) => setState(current => {
      const data = receivedProgress && current.data ? finishInterruptedMarket(current.data, message) : current.data;
      const usable = receivedProgress && Object.values(data?.feeds ?? {}).some(feed => feed.status === "ok");
      return { ...current, data, loading: false, refreshing: false, error: usable ? null : message };
    });
    const timeout = window.setTimeout(() => {
      nextController.abort();
      finishFailure("The refresh timed out. Your board is safe; retry the data connection.");
    }, 30_000);
    try {
      const query = feedScope === "core" ? "scope=core" : feedScope === "all" ? "scope=all" : `scope=all&feeds=${encodeURIComponent(feedScope)}`;
      const response = await fetch(`/api/cmc?${query}`, { signal: nextController.signal, cache: "no-store", headers: { Accept: "application/x-ndjson" } });
      await readMarketStream(response, (payload, done) => {
        if (nextController.signal.aborted) return;
        receivedProgress = true;
        setState(current => ({ data: mergeMarket(current.data, payload), loading: false, refreshing: !done, error: done && payload.health === "unavailable" ? "CoinMarketCap is unavailable. Last-known values are retained; retry shortly." : null }));
      });
    } catch (error) {
      if (nextController.signal.aborted) return;
      finishFailure(error instanceof Error ? error.message : "Market data could not be loaded");
    } finally { window.clearTimeout(timeout); }
  }, [feedScope]);

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

  return { ...state, setRequestedFeeds, retry: () => load(true) };
}
