# Plan3 Product Requirements Document

**Status:** Draft for hackathon build  
**Version:** 1.2 — see implementation update at the end for delivered scope and remaining gaps  
**Date:** September 12, 2026  
**Product type:** Web application with optional browser extension  
**Product positioning:** The decision-intelligence workspace for Web3.  
**Tagline:** Humans and agents, working from the same plan.

## 1. Executive summary

Plan3 is a collaborative, modular market-intelligence canvas. Traders arrange charts, market data, browser sources, evidence, theses, risk checks, and alerts as connected widgets. AI agents work on the same canvas: they can research, propose widgets, update evidence, detect changing conditions, and maintain monitoring rules.

The central product idea is that agents and traders need a shared language. Chat alone is optimized for agents, while traditional terminals are optimized for humans. Plan3 turns market information into typed, visible, inspectable objects that both can manipulate.

The product is not a dashboard with an AI chat panel. It is the shared act of constructing and maintaining a decision system.

For the CoinMarketCap API hackathon, the MVP will demonstrate one compelling loop:

1. A user describes a market question.
2. An agent creates a board from approved widget primitives.
3. The agent uses CoinMarketCap data to populate market context and generate an evidence-backed proposal.
4. The user inspects its inputs, logic, permissions, and provenance.
5. The user accepts or edits the proposed widget.
6. The board enters Live mode and updates when market conditions change.
7. The user shares a read-only, remixable version of the board.

## 2. Problem

Crypto traders routinely split research across charts, CoinMarketCap, news sites, social feeds, spreadsheets, portfolio tools, bookmarks, and AI chats. This creates four problems:

- **Context fragmentation:** the reasoning behind a decision is scattered across tabs and conversations.
- **Ephemeral AI output:** agent research is returned as text and quickly buried instead of becoming a reusable market instrument.
- **Weak trust:** conclusions are difficult to verify because data sources, timestamps, transformations, and assumptions are hidden.
- **Passive dashboards:** customizable dashboards display information but do not express how evidence supports a thesis or what should happen when conditions change.

Users do not need another universal dashboard. They need a workspace that turns research into an explicit, living decision model.

## 3. Product vision

Enable a trader and a group of agents to build, inspect, operate, and share a market thesis on one surface.

### Product promise

“Describe what you want to understand. Agents assemble the first plan. You inspect and shape it. Plan3 keeps its evidence and conditions alive.”

### Differentiation

| Existing category | What it does well | Plan3 difference |
|---|---|---|
| Trading terminal | Dense real-time charts and execution workflows | Adds spatial reasoning, evidence, and agent-maintained decision objects |
| Custom dashboard | Flexible arrangement of data widgets | Widgets participate in a thesis and can be created or maintained by agents |
| AI research chat | Fast natural-language analysis | Results become persistent, editable, sourced widgets instead of chat messages |
| Infinite canvas | Flexible spatial collaboration | Introduces typed financial objects, live market data, conditions, and monitoring |

## 4. Goals and non-goals

### MVP goals

- Create a board manually or from a natural-language request.
- Add, move, resize, configure, connect, duplicate, and remove widgets.
- Populate live market widgets using CoinMarketCap API data.
- Allow an agent to propose new widgets and modifications.
- Require human review before material agent changes become part of the board.
- Show the source, timestamp, logic, permissions, and agent activity for a proposal.
- Switch between Build, Live, and Focus modes.
- Share a read-only board through a public link and remix it into a new board.
- Deliver a coherent end-to-end hackathon demo with one supported market thesis.

### Non-goals for the hackathon

- Direct trade execution or custody of funds.
- Personalized financial advice.
- Arbitrary agent-generated JavaScript running inside the main application.
- High-frequency or millisecond-level market data.
- A complete Bloomberg, TradingView, or CoinMarketCap replacement.
- Mobile board construction; mobile is read/review only in the longer-term product.
- Fully autonomous agents making irreversible changes without approval.

## 5. Target users

### Primary: active crypto researcher/trader

- Tracks multiple tokens, narratives, and market signals.
- Uses charts, news, social sources, and AI tools daily.
- Wants speed but needs to verify conclusions.
- Shares research with a community, trading group, or audience.

### Secondary: research creator

- Publishes market views on X, Discord, Telegram, or newsletters.
- Wants interactive, updateable research instead of static screenshots.
- Benefits from remixable templates and visible provenance.

### Future: analyst team

- Collaborates on market monitoring and investment theses.
- Needs roles, comments, audit trails, private sources, and governance.

## 6. Core concepts

### Board

A spatial workspace organized around a question or decision, such as “Is SOL entering a sustained breakout?” A board contains widgets, relationships, agents, permissions, and a revision history.

### Widget

A typed object that a human or agent can create and manipulate. Unlike a generic card, a widget has an explicit purpose, data contract, state, and provenance.

### Relationship

A directional semantic link between two widgets. MVP relationship types are:

- `supports`
- `contradicts`
- `derived_from`
- `triggers`

Connections are optional and limited visually to avoid an unreadable node graph.

### Agent

A named collaborator with a purpose and scoped permissions. Example agents:

- **Scout:** finds market changes and supporting evidence.
- **Risk:** searches for invalidation conditions and contradictory evidence.
- **Monitor:** watches accepted rules and refreshes widgets.

### Proposal

A draft widget or modification created by an agent. Proposals are visually distinct and cannot silently overwrite accepted board state. A user can Accept, Edit, or Reject them.

## 7. Product modes

### Build mode

The primary creation environment. It exposes the widget library, grid, handles, snap guides, relationships, agent proposals, and contextual inspector.

### Live mode

The operational dashboard generated from the same board. Editing chrome is hidden, density increases, and live states, changes, and alerts become prominent.

### Focus mode

Expands one widget or a selected group for analysis. This is especially useful for charts, tables, browser sources, and evidence review. Escape returns to the previous board state.

## 8. Widget catalog

### Required for MVP

| Widget | Purpose | Key configuration |
|---|---|---|
| Market metric | Price, market cap, volume, dominance, rank, or percentage change | Asset, metric, quote currency, refresh |
| Chart | Historical price or market series | Asset, interval, range, comparison series |
| Watchlist | Compact multi-asset table | Assets, columns, sorting |
| Browser source | Display or reference an external page/article | URL, title, capture time |
| Evidence | Store a claim backed by one or more sources | Claim, stance, source links, confidence |
| Thesis | Express a decision hypothesis | Statement, horizon, confidence, status |
| Risk checklist | Track validation and invalidation factors | Items, severity, completion state |
| Alert rule | Evaluate a condition and surface a notification | Input, operator, threshold, cadence |
| Agent monitor | Show a persistent agent task and its latest result | Agent, objective, inputs, cadence, permissions |

### Post-MVP

- Portfolio exposure
- Calendar and token unlock events
- Social sentiment
- Correlation matrix
- Market screener
- On-chain metric
- Trading journal
- Scenario calculator
- Order-entry integration
- Community widget packages

## 9. Shared widget language

Humans interact visually; agents interact through a constrained widget manifest. Both representations map to the same object.

```json
{
  "id": "widget_liquidity_divergence",
  "type": "agent_monitor",
  "title": "Liquidity divergence monitor",
  "createdBy": { "kind": "agent", "id": "scout" },
  "status": "proposed",
  "position": { "x": 820, "y": 380, "w": 340, "h": 280 },
  "inputs": ["cmc:SOL.price", "cmc:SOL.volume_24h"],
  "logic": "flag when 7d price change diverges from 7d volume change by more than 20%",
  "refresh": "5m",
  "permissions": ["read:market_data", "create:widget"],
  "provenance": [{ "source": "CoinMarketCap API", "retrievedAt": "ISO-8601" }]
}
```

Agents may only compose supported manifests in the MVP. Validation rejects unknown widget types, unsupported data references, invalid layout coordinates, and permissions outside the agent’s scope.

## 10. Primary user journeys

### A. Generate a board

1. User selects **New board**.
2. User enters: “Build a board to decide whether SOL momentum is sustainable.”
3. System shows the data and actions the agent intends to use.
4. Scout creates proposed Market Metric, Chart, Evidence, Thesis, Risk, and Alert widgets.
5. User previews the whole proposal or reviews widgets individually.
6. User accepts the board, edits the thesis, and enters Live mode.

### B. Add a widget manually

1. User opens the widget library with `+` or the command palette.
2. User drags a Chart widget onto the canvas.
3. User configures SOL, USD, 30 days, and daily interval in the inspector.
4. Widget loads and displays its source and last-refresh status.

### C. Ask an agent to change the board

1. User selects the SOL chart and thesis widget.
2. User says: “Add a monitor that warns me if price rises while volume falls.”
3. Agent reads only the selected context plus authorized market data.
4. A translucent draft appears at a suggested location.
5. Inspector displays inputs, logic, refresh cadence, permissions, and provenance.
6. User accepts, edits, or rejects it.

### D. Inspect a claim

1. User selects an Evidence or Thesis widget.
2. Inspector shows the exact supporting sources, retrieved times, transformations, and linked widgets.
3. User opens the original source or asks Risk to find contradictions.

### E. Share and remix

1. User clicks Share and chooses public read-only access.
2. Public board opens in Live mode with sensitive inputs excluded.
3. Viewer can inspect public provenance.
4. Viewer clicks Remix to copy the structure into their workspace.

## 11. Functional requirements

### Canvas and layout

- Pan and zoom the workspace.
- Drag, resize, multi-select, align, group, duplicate, and delete widgets.
- Snap widgets to a configurable grid.
- Show ownership and status on selection, not permanently on every widget.
- Undo and redo user and accepted-agent actions.
- Persist layout and viewport.
- Support keyboard shortcuts for add, search, duplicate, delete, focus, and mode switching.

### Agent collaboration

- Agents must have names, roles, and explicit permission scopes.
- Agent changes enter `proposed` state by default.
- Proposed widgets use a distinct dashed outline and show Accept, Edit, and Reject.
- Inspector must display an agent action trail.
- Accepted proposals become normal widgets while retaining creation provenance.
- Rejected proposals are recorded in board history but removed from the canvas.
- Users can pause or stop an active agent monitor.

### Data and provenance

- Every live-data widget displays source and last-updated time.
- Evidence can reference a URL, data point, or another widget.
- Derived values record the source fields and transformation.
- Stale or failed data is visually distinct from valid live data.
- Shared boards expose only sources and metadata permitted by the owner.

### Sharing

- Generate read-only public link.
- Use Live mode as the default shared view.
- Allow owners to disable remixing.
- Remix produces an independent copy with source integrations requiring reauthorization.
- Provide an exportable social preview image after MVP.

## 12. CoinMarketCap API requirements

The CoinMarketCap API is the primary market-data source for the hackathon MVP.

### MVP data uses

- Asset identity and metadata
- Latest price and percentage changes
- Market capitalization
- 24-hour volume
- Circulating supply
- Market rank
- Global market metrics where available
- Historical time series where available to the selected API plan

### Integration behavior

- Backend proxy protects the API key.
- Responses are normalized into internal market objects.
- Cache data according to endpoint update frequency and plan limits.
- Display `CoinMarketCap` as the source on all originating widgets.
- On quota or endpoint failure, retain the last successful value, mark it stale, and show the failure time.
- Demo data may be recorded as a fallback, but the primary demo path must call the live API.

## 13. Information architecture

### Global navigation

- Workspace switcher
- Boards
- Templates
- Agents
- Data sources
- Shared with me
- Settings

### Board shell

- **Top:** board title, Build/Live/Focus, sync status, Share
- **Left rail:** select, widget library, connections, text/evidence, data, agents
- **Center:** spatial canvas
- **Right inspector:** selected-widget configuration, provenance, activity
- **Bottom:** zoom controls, natural-language command bar, active-agent status

## 14. UX and visual principles

- **Canvas first:** the working surface dominates the screen.
- **Different instruments, shared system:** widgets may have different internal structures instead of appearing as identical cards.
- **Progressive disclosure:** provenance and configuration appear when relevant.
- **Visible agency:** users can see which agent is working, what it read, and what it proposes.
- **Human authority:** agents propose; humans approve material changes.
- **Decision hierarchy:** sources and evidence support a thesis; rules operationalize it.
- **Calm density:** compact financial information without decorative noise.
- **Accessible color:** state is communicated with text/icon/shape in addition to color.

### Initial theme

Use **Graphite Ledger** for the primary hackathon theme:

- Warm near-black canvas
- Charcoal widget surfaces
- Parchment primary text
- Copper agent and selection accent
- Teal positive market state
- Brick red risk state
- Ochre warnings

Midnight Signal and Paper Terminal remain optional theme explorations, not MVP settings.

### Brand identity

- **Name:** Plan3
- **Display wordmark:** `PLAN³`
- **Primary mark:** **Three Steps**, a flat geometric symbol made from three nested right-angle forms.
- **Meaning:** the three forms represent **Data → Intelligence → Plan**. They also suggest information being organized into progressively clearer action.
- **Primary treatment:** white mark and wordmark on near-black. The identity should remain flat, precise, and monochrome; gradients, bevels, shadows, and app-icon containers are not part of the core logo.
- **Secondary treatment:** near-black mark and wordmark on transparent or light backgrounds.
- **Small-size usage:** use the standalone Three Steps symbol without the wordmark below 120 px wide.
- **Clear space:** preserve at least one stroke width around the symbol or full lockup.
- **Logo assets:** [primary dark lockup](plan3-logo-concepts-palantir-direction/plan3-three-steps-flat-lockup.svg), [transparent lockup](plan3-logo-concepts-palantir-direction/plan3-three-steps-flat-lockup-transparent.svg), and [standalone symbol](plan3-logo-concepts-palantir-direction/plan3-three-steps-flat-symbol.svg).

The interface may use the richer Graphite Ledger product palette, but the logo itself stays monochrome so it remains distinct, legible, and adaptable.

## 15. Safety, trust, and permissions

- Display “Research tool—not financial advice” during onboarding and public sharing.
- Do not imply guaranteed returns or autonomous fiduciary judgment.
- Require confirmation for any future trade, transaction, subscription, or external posting action.
- Give agents least-privilege access.
- Separate read permissions from create, edit, alert, and external-action permissions.
- Prevent private browser content or credentials from entering a shared board without explicit user action.
- Sanitize embedded browser content and isolate it from application permissions.
- Keep a revision log for accepted agent actions.

## 16. Non-functional requirements

- Initial board shell loads in under 2.5 seconds on a typical broadband connection.
- Canvas interactions target 60 FPS with 50 visible MVP widgets.
- Widget configuration changes persist within one second.
- Agent progress becomes visible within two seconds of starting a task.
- Live-data widgets clearly represent loading, live, stale, empty, and error states.
- Desktop supports current Chrome, Edge, Safari, and Firefox.
- Core navigation, inspector controls, and proposal review are keyboard accessible.
- Public boards must not expose private API keys, internal prompts, or unauthorized source content.

## 17. Technical approach

### Suggested stack

- **Frontend:** React/Next.js, TypeScript
- **Canvas:** DOM-based absolute/grid layout for the MVP; React Flow or tldraw only if connection and zoom requirements justify their complexity
- **State:** Zustand or equivalent local state with server persistence
- **Backend:** Next.js API routes or lightweight Node service
- **Database:** Postgres/Supabase
- **Realtime:** Supabase Realtime or WebSocket channel for agent and collaborator events
- **Charts:** Lightweight Charts or TradingView charting integration where licensing permits
- **Agent orchestration:** structured tool calls that output validated widget manifests
- **Market data:** CoinMarketCap API through a cached server proxy

### Core entities

- User
- Workspace
- Board
- Widget
- Relationship
- DataSource
- Agent
- AgentRun
- Proposal
- Revision
- ShareLink

### Important architectural rule

Agent output must pass through schema validation and permission checks before becoming a proposal. It must never directly mutate accepted board state.

## 18. Analytics and success metrics

### Hackathon proof metrics

- A new user can generate a useful board in under 90 seconds.
- The demo completes the full prompt-to-live-board loop without manual database edits.
- At least six distinct CMC-backed data fields appear in the demo.
- A user can inspect the provenance of every agent-generated claim in two clicks or fewer.
- A viewer can open and understand a shared board without creating an account.

### Product metrics after launch

- Activation: percentage of users who create or accept three widgets and enter Live mode.
- Time to first useful board.
- Weekly active boards, not just weekly active users.
- Percentage of agent proposals accepted, edited, and rejected.
- Percentage of accepted agent widgets retained after seven days.
- Live-monitor return rate.
- Share-to-view and view-to-remix conversion.
- Number of distinct data sources used per active board.

### Guardrail metrics

- Stale-data incidents shown without warning.
- Unsupported or unverifiable claims produced by agents.
- Accidental exposure of private data through sharing.
- User reports of confusing agent authority or unintended changes.

## 19. MVP scope and priority

### P0: required for submission

- Board canvas with pan, zoom, drag, and resize
- Market Metric, Chart, Evidence, Thesis, Alert, and Agent Monitor widgets
- CoinMarketCap latest quote/market data integration
- Natural-language generation of one predefined thesis board
- Agent proposal state with Accept/Edit/Reject
- Inspector with inputs, logic, refresh, permissions, and provenance
- Build, Live, and Focus modes
- Persist and reload one user’s boards
- Public read-only share link
- Polished SOL breakout demo board

### P1: implement if P0 is stable

- Browser-source widget with URL capture
- Risk agent and contradiction search
- Board remixing
- Revision history and undo for accepted proposals
- Starter templates for Momentum, Risk, and Market Overview
- Streaming agent activity on the canvas

### P2: post-hackathon

- Browser extension for capturing the current page or selection
- Real-time multi-user cursors
- Additional data connectors
- Widget marketplace
- Scheduled notifications
- Team roles and private workspaces
- Portfolio and execution integrations

## 20. Hackathon demo script

1. Open a blank Plan3 board.
2. Enter: “Help me decide whether SOL momentum is sustainable. Use market performance, volume, evidence, risks, and an alert.”
3. Scout places CMC-backed Market Metric and Chart widgets, then adds Evidence and a draft Thesis.
4. Risk adds a checklist with two unresolved invalidation factors.
5. Ask: “Monitor price and volume divergence.”
6. A proposed Agent Monitor appears on the canvas.
7. Open its inspector and show CMC inputs, comparison logic, five-minute refresh, permissions, and provenance.
8. Edit the divergence threshold and accept the proposal.
9. Switch to Live mode; focus the chart; trigger or simulate a meaningful update.
10. Open the public share link and show that the reasoning and sources remain inspectable.

## 21. Acceptance criteria

The MVP is ready when:

- [ ] A user can create, name, save, reopen, and share a board.
- [ ] A user can add, move, resize, configure, duplicate, and delete each P0 widget.
- [ ] The board displays live CoinMarketCap data with source and timestamp.
- [ ] An agent can return a schema-valid multi-widget proposal from a supported prompt.
- [ ] Agent-created widgets are visibly marked as proposals before acceptance.
- [ ] Accept, Edit, and Reject work and are recorded in activity history.
- [ ] A user can inspect inputs, logic, refresh, permissions, and provenance.
- [ ] Build, Live, and Focus modes preserve the same underlying board state.
- [ ] A data failure produces a visible stale/error state without crashing the board.
- [ ] A public link works without exposing private credentials or permissions.
- [ ] The end-to-end demo can be completed in under three minutes.

## 22. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Product still resembles a dashboard | Weak differentiation | Lead every demo with agent creation and proposal review in Build mode |
| Infinite canvas becomes messy | Cognitive overload | Snap grid, frames, starter layouts, limited relationship types, Focus mode |
| Agent output is unreliable | Loss of trust | Approved primitives, schema validation, provenance, human approval |
| API quota or latency disrupts demo | Failed presentation | Cache responses and maintain timestamped recorded fallback data |
| Scope becomes a full terminal | MVP never finishes | No trading, portfolios, arbitrary integrations, or marketplace in P0 |
| Browser embedding is blocked by sites | Broken source widgets | Store link metadata and captured excerpts; open restricted pages externally |
| Shared boards leak private context | Security issue | Explicit share preview, source-level visibility controls, reauthorization on remix |

## 23. Remaining open decisions

- Should public boards allow anonymous remixing or require an account?
- Should relationships be manually created only, or may agents propose them?
- Should Agent Monitor execute on a schedule during the hackathon or simulate scheduled refresh?
- Which CoinMarketCap historical endpoint is available within the hackathon plan and rate limits?

**Launch requirement:** complete a trademark and domain review for Plan3 before public release. The product name and Three Steps identity are final for the hackathon.

## 24. Post-hackathon product direction

The durable product is a marketplace and operating system for decision boards. Creators publish thesis templates; users remix them with their own assets and sources; agents continuously maintain the underlying evidence. Monetization can combine premium data connectors, higher agent-monitor limits, private collaborative workspaces, and paid creator templates.

The defensible asset is not any individual dashboard. It is the growing library of typed market widgets, agent capabilities, provenance-aware relationships, reusable decision templates, and interaction history showing how humans approve or correct agent work.
# Implementation update — 28 September 2026

The v2 research builder is implemented. See [competitive research](COMPETITIVE_RESEARCH_2026-09-28.md) for evidence, positioning and the next prioritized work.

Current scope: configurable metric/chart/watchlist/ranking/condition/note/reference blocks; board-linked and pinned assets; inspectable calculations; human-authored evidence relationships; repeated widget instances; multiple local boards; playbooks; undo/redo; pan/zoom; validated JSON import/export; shared snapshots and remix; human-approved WebMCP manifest proposals. Existing CMC preset widgets and legacy board content remain supported.

Explicit boundaries: the built-in guided starter is deterministic, not an LLM. Reference links do not ingest external pages. Rules evaluate only during page refreshes, without notifications or trading. Cloud persistence, multiplayer, persistent revision history, arbitrary connectors and an actual model-backed agent remain future work. See the research report's validation targets before claiming category leadership.

---
