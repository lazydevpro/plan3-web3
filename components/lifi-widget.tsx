"use client";

import { useMemo } from "react";
import { ChainType, LiFiWidget } from "@lifi/widget";
import { EthereumProvider } from "@lifi/widget-provider-ethereum";
import { SolanaProvider } from "@lifi/widget-provider-solana";

export default function LifiWidget({ id }: { id: string }) {
  // Keep configuration stable across board edits and market refreshes. No amount,
  // destination address, fees, private keys, or board-derived trade instructions.
  const config = useMemo(() => ({
    integrator: "Plan3",
    appearance: "dark" as const,
    variant: "compact" as const,
    buildUrl: false,
    keyPrefix: `plan3-lifi-${id}`,
    providers: [EthereumProvider(), SolanaProvider()],
    chains: { types: { allow: [ChainType.EVM, ChainType.SVM] } },
    // Brand palette from brand.md; the provider expects literal palette values.
    theme: {
      container: { width: "100%", minWidth: 0, borderRadius: 0, border: "none" },
      colorSchemes: { dark: { palette: { primary: { main: "#c87a43" }, background: { default: "#151411", paper: "#1d1b18" }, text: { primary: "#f2ede2", secondary: "#aaa294" } } } },
    },
  }), [id]);
  return <LiFiWidget integrator="Plan3" config={config} />;
}
