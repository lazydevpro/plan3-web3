# Plan3: competitive research and builder direction

Research date: 28 September 2026. Product documentation and official announcements are the primary evidence. Features described by vendors were not independently benchmarked behind paid accounts. Absence from a page is not evidence a feature does not exist. The installed ecosystem catalogs referenced by the research skill were unavailable; no catalog adoption counts are used.

## Conclusion

The market is crowded. “AI-powered, customizable Web3 dashboard” is not a credible differentiation by itself. Alphaday already combines crypto aggregation with an API/MCP layer. OpenBB explicitly supports context-aware agents, AI-generated widgets and linked widget parameters. Observable offers an AI-assisted collaborative data canvas. Plan3 cannot honestly claim to have invented these capabilities.

Our most promising initial audience is the self-directed crypto researcher who already combines charts, a watchlist, notes and an assistant, but struggles to preserve the reasoning connecting them. The product hypothesis is **an editable research playbook: data → visual instrument → evidence relationship → explicit invalidation condition, reusable by a human or an agent**. This is a focused workflow hypothesis, not a proven moat or an exclusive feature claim.

## Landscape

| Product | Relationship | What it already does well | Implication for Plan3 |
| --- | --- | --- | --- |
| Alphaday | Direct: crypto aggregation workspace | Custom boards and ecosystem feeds; current site positions dashboards alongside API/MCP access, Pulse and Recipes. | We lose on source breadth today. Compete on composing calculations and capturing decision context; not “native Web3.” |
| OpenBB Workspace | Direct/adjacent: financial research builder | Configurable widgets, linked parameters, dashboard-aware agents, AI-generated artifacts and workflow Apps. | Strongest architectural comparator. Shared context and agent-generated widgets are competitive basics, not a novelty claim. |
| TradingView | Substitute/adjacent: chart-led workflow | Chart layouts, synchronization groups and mature chart configuration. | Linking must be explicit and reversible. Do not rebuild its charting depth or execution ecosystem in a hackathon. |
| Koyfin | Adjacent: financial dashboard | Blank/template dashboards, configurable watchlists and color-linked widgets. | Templates must shorten setup; configuration matters more than a long catalog. |
| Dune | Direct/adjacent: onchain analytics | Query-driven dashboards and visualization configuration; MCP/CLI access for agents. | SQL and chain-data depth are gaps for us. Offer accessible composition over known fields first; do not imply we query every chain. |
| Grafana | Builder benchmark / substitute | Data source, query, transformations and visualization are distinct; variables make dashboards reusable. | Adopt data/display separation and inspectable calculations. Our advantage could be a smaller, market-specific learning curve. |
| Observable Canvases | Direct architectural comparator | Reactive data canvas, transformation graph, collaboration and inspectable AI-added nodes. | Freeform canvas and AI are insufficient. Preserve meaning and human approval in market-specific workflows. |
| Santiment Sanbase | Adjacent: crypto signals | Metrics, alerts, watchlists, insights and social trends. | Monitoring is established. Current Plan3 page-refresh rules are not a substitute for hosted alert delivery. |
| Messari | Adjacent: research intelligence | Assistant/deep research surfaces, reports, monitoring, screener and watchlists. | Do not call a deterministic starter an autonomous research agent. Source retrieval and trustworthy synthesis remain future work. |
| ZERO | Adjacent: trader behavior | Solana-terminal companion advertising paper/shadow trading, journals and behavioral feedback. | Different job: discipline around trading. Plan3 should remain a research builder before adding execution or coaching. |
| Sheets + browser tabs + notes + assistant | Practical substitute | Flexible, familiar, inexpensive; users can improvise almost anything. | We must beat the setup friction and make updates and provenance easier, not merely look more sophisticated. |

### Sources for the matrix

- Alphaday: [current product](https://alphaday.com/), [custom Bitcoin dashboard](https://alphaday.com/projects/bitcoin), [dashboard setup guide](https://blog.alphaday.com/p/how-to-build-a-cryptocurrency-dashboard). Current API/MCP positioning and historical dashboard instructions are distinguished; vendor audience/source counts are not treated as audited usage.
- OpenBB: [Workspace concepts](https://docs.openbb.co/workspace), [AI-generated widgets](https://docs.openbb.co/workspace/analysts/widgets/ai-generated-widgets), [agent dashboard context](https://docs.openbb.co/workspace/developers/ai-features/interact-with-dashboard), [Apps](https://docs.openbb.co/workspace/analysts/apps).
- TradingView: [chart synchronization](https://www.tradingview.com/support/solutions/43000629992-how-to-sync-the-charts-of-my-layout/), [layouts and interaction](https://www.tradingview.com/support/solutions/43000692404-layouts-charts-drawings-indicators-and-their-interaction/).
- Koyfin: [My Dashboards](https://www.koyfin.com/help/mydashboards-myd/), [custom dashboards](https://www.koyfin.com/features/custom-dashboards/).
- Dune: [dashboard management](https://dune.com/blog/creating-and-managing-dashboards), [visualization configuration](https://dune.com/blog/creating-visualizations-charts), [agent interface](https://dune.com/agents).
- Grafana: [dashboard model](https://grafana.com/docs/grafana/latest/fundamentals/dashboards-overview/), [transformations](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/query-transform-data/transform-data/), [variables](https://grafana.com/docs/learning-paths/interactive-dashboards/understanding-variables/).
- Observable: [Canvases](https://old.observablehq.com/documentation/canvases/), [AI behavior and controls](https://old.observablehq.com/documentation/canvases/ai).
- Santiment: [Sanbase documentation](https://academy.santiment.net/sanbase/).
- Messari: [research product](https://messari.io/copilot). Marketing surface reviewed; paid research quality was not tested.
- ZERO: [official product](https://www.get-zero.xyz/). Product claims, not a performance assessment.

## User friction and failed/consolidated products

A [February 2026 TradingView discussion](https://www.reddit.com/r/TradingView/comments/1r8oy2j/chart_layout_settings_how_to_stop_it_from/) describes confusion about synchronization affecting other charts. This is a low-volume qualitative anecdote, not proof of a current platform defect or broad demand. The useful design lesson is to distinguish board-linked and pinned widgets visibly. Older synchronization complaints are unreliable evidence of a present gap: TradingView has subsequently added synchronization capabilities.

[Kraken's July 2023 announcement](https://blog.kraken.com/product/cryptowatch-to-sunset-kraken-pro-to-integrate-cryptowatch-features) states that Cryptowatch would sunset and features would be integrated into Kraken Pro. The official explanation supports consolidation, not a claim that poor product design caused the shutdown. Inference: a standalone terminal needs a reason to survive alongside integrated platforms; aggregation alone is a vulnerable position.

## Our implementation before this work

The code had 43 mostly fixed widget types, one instance per type, predominantly hardcoded asset scopes, a free-positioned canvas, a single browser-saved board, a deterministic proposal API and snapshot sharing. “AI” did not mean an integrated LLM. Source breadth beyond CMC was not implemented. Human thesis editing existed, but there was no general data/visual composer or semantic connection model.

## What is implemented in this iteration

| Finding | Delivered behavior | Boundaries |
| --- | --- | --- |
| Grafana / Dune: separate data from display | Composer for metric, history chart, watchlist, ranking, condition, thesis/note and source-reference widgets; actual preview before adding | Known CMC fields and two derived ratios, not arbitrary SQL or JavaScript |
| OpenBB / Koyfin / TradingView: shared context | Board asset binding or independently pinned asset, visible on each relevant custom widget | Old specialist presets keep explicit fixed scopes; history connector requests BTC/ETH/SOL |
| Observable: inspectable shared model | Versioned JSON manifest; human and compatible WebMCP agent use the same blocks/configuration/relationships | Browser capability dependent; no hosted MCP or built-in LLM |
| Research requires falsifiable context | Human-authored supports/contradicts/watches/derived-from links; editable threshold conditions; current value and formula shown | Links are assertions, not automatically established causality; no background notifications |
| Mature builders support iteration | Repeat instances, duplication, precise position/size, free dragging, resizing, pan, zoom, fit, undo/redo | History in current session; no multiplayer or cloud revision log |
| Templates beat setup friction | Multiple local boards, blank/momentum/risk playbooks, copy, JSON import/export, share snapshot and remix | Browser-local persistence, existing private-site audience unchanged |
| Trust beats fake certainty | Null-safe calculations, stale/failed data yields unknown condition; inspectable formulas and retrieval time | Retrieval time is not identical to exchange event time; no suitability advice or trades |

Legacy boards migrate without deleting their original storage. Existing thesis, monitor and geometry are retained through the legacy validator. The CMC client is shared across the canvas and previews; creating a second widget does not create a separate API polling loop.

## Design brief

Audience: self-directed researcher with intermediate market literacy. Task: assemble and revisit an evidence-backed market question. Direction: industrial, quiet workstation using the existing Graphite Ledger palette, restrained copper for editing and teal for data status. The canvas owns the screen; configuration lives in a collapsible side panel. The user should understand a widget from its rendered preview and inspect the underlying assumptions without leaving the board. Avoid decorative chart filler, trading-profit claims, chat-only workflows and unlabelled AI output.

## What would make Plan3 meaningfully better next

1. **Composable data connectors, not additional fixed cards.** Define a versioned connector contract with entity/timeframe parameters, result schemas, units, provenance, cost and freshness. First extend configurable CMC coverage; then add one complementary onchain/news source based on user interviews. Server-only keys, allowlisted endpoints and a credit budget are mandatory.
2. **An actual research agent with a visual change review.** Add model-backed retrieval and structured proposals. Preview each added/changed/deleted widget, show cited evidence and estimated connector cost, then apply atomically with rollback. Test prompt injection in imported notes and external pages. The current staged manifest is groundwork, not completion of this feature.
3. **Reusable playbooks with measurable outcomes.** Save parameterized workflows (asset, chain, horizon); record why a hypothesis changed, not just chart screenshots. Backtest only after defining timestamp correctness, data availability and survivorship constraints. Avoid implying predictive performance.
4. **Hosted monitoring and collaboration.** Persist authenticated boards, run budgeted condition checks server-side, deliver opt-in alerts, expose delivery/permission states, then add concurrent editing and revisions. These require backend scope and operational testing, not a front-end toggle.
5. **Community distribution.** A curated remixable template library with attribution, data requirements and versioning. Potential network effect only after repeat contributors and remix-to-retention are demonstrated. No moat is established today.

Priority is 1→2→3; do not start an execution terminal until the research loop earns repeat use. Partner with or embed specialist chart tooling where licensing allows, rather than competing on chart engine maturity.

## Validation: how to earn “best DIY builder”

Recruit 5–8 target researchers for observed tasks: recreate an existing workspace; build a BTC/SOL comparison; pin one widget while changing board context; express an invalidation rule; share and remix the result; recover an accidental edit. Compare against their current tool, not a rehearsed demo.

Proposed acceptance targets, not measured claims: first useful custom board in under 5 minutes; ≥80% unassisted completion; zero context-binding mistakes in the test; every unavailable feed clearly distinguished from zero; no lost board edits; identify three workflows reused weekly. Track second-session return, template-to-edit conversion, agent proposal acceptance/rollback, source-error rate and credit cost per active board. Interview non-returning users before adding more widget categories.

## Positioning to test

“Build a living market thesis. Compose your data, connect your evidence, and let an agent propose the next change—on a board you control.”

This is stronger than “Palantir of Web3” because it describes a specific action and an accountable workflow. Whether it wins is an empirical question; shipping a nicer canvas alone does not establish differentiation.
