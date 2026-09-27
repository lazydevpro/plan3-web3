"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CmcOverview } from "@/lib/cmc";

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
    setState((current) => ({ ...current, loading: !current.data, refreshing, error: null }));
    try {
      const response = await fetch(`/api/cmc?scope=${expanded ? "all" : "core"}`, { signal: nextController.signal, cache: "no-store" });
      const payload = await response.json() as CmcOverview & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Market data could not be loaded");
      if (payload.health === "unavailable") throw new Error("CoinMarketCap is unavailable. Previous values are retained and marked stale. Try again shortly.");
      setState({ data: payload, loading: false, refreshing: false, error: null });
    } catch (error) {
      if (nextController.signal.aborted) return;
      setState((current) => ({ ...current, loading: false, refreshing: false, error: error instanceof Error ? error.message : "Market data could not be loaded" }));
    }
  }, [expanded]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void load(true); }, 60_000);
    const resume = () => { if (document.visibilityState === "visible") void load(true); };
    document.addEventListener("visibilitychange", resume);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", resume);
      controller.current?.abort();
    };
  }, [load]);

  return { ...state, setExpanded, retry: () => load(true) };
}
