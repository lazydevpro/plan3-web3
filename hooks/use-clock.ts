"use client";

import { useEffect, useState } from "react";

/** Tick even when network requests fail, so stale data cannot remain labelled live. */
export function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
