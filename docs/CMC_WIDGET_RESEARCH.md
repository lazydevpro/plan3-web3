# Plan3 × CoinMarketCap API: Prebuilt Widget Research

**Status:** Implementation brief  
**Date:** September 13, 2026  
**Scope:** CoinMarketCap API capabilities that can become reusable Plan3 widgets, agent inputs, and hackathon demo flows  
**Hackathon entitlement:** The supplied Startup key has full API feature access. All widget families in this document are therefore available for the hackathon build.

## Executive summary

CoinMarketCap should be treated as Plan3's **market intelligence substrate**, not merely its price provider. The current API spans centralized markets, DEX/on-chain activity, market-wide regime indicators, tokenized real-world assets, derivatives and liquidations, exchange intelligence, holder behavior, security checks, content, community attention, and CMC-generated AI explanations.[^1]

This gives Plan3 a strong product angle:

> CMC supplies normalized facts. Plan3 turns those facts into visual instruments, derived signals, agent-readable evidence, and human-approved monitoring rules.

The best hackathon strategy is not to ship dozens of isolated cards. It is to ship a compact widget library that demonstrates three levels of value:

1. **Observed widgets** show a CMC value with timestamp and provenance.
2. **Derived widgets** combine multiple CMC fields into a transparent calculation.
3. **Agent-maintained widgets** explain a condition, propose a rule, or update a thesis without hiding the underlying evidence.

The recommended demo board is a **Market Decision Room** built from 10–12 widgets: Market Pulse, Watchlist, Asset Chart, Market Regime, Category Rotation, Fear & Greed, Altcoin Season, Derivatives Crowding, Liquidation Pulse, DEX Safety, Thesis, and Agent Monitor. The hackathon key's full-catalog access also makes CMC AI, Content, Community, advanced exchange data, and RWA market pairs available. CMC AI can therefore enrich the demo, although Plan3's core reasoning flow should continue to work without it.[^2]

## 1. What the API actually offers

The official endpoint catalog currently contains these major families:[^1]

| Family | What it gives Plan3 | Most valuable UI use |
|---|---|---|
| Cryptocurrency | Quotes, listings, metadata, historical OHLCV, market pairs, categories, trending, new listings, gainers/losers, airdrops, performance stats | Watchlists, charts, screeners, valuation and rotation |
| Global Metrics | Total market cap and volume, BTC/ETH dominance, Fear & Greed, Altcoin Season, historical market-wide series | Regime and risk-context widgets |
| CMC Index | CMC20 and CMC100 values, history, constituents, and weights | Benchmark and breadth widgets |
| Exchange | Exchange maps and metadata, rankings, quotes, markets, assets held | Venue quality and proof-of-reserves views |
| RWA | Tokenized equities, commodities, currencies, government securities, ETFs, real estate, issuers, venues | Tokenization and TradFi/on-chain comparison |
| Derivatives | Futures/perpetual venues and markets, funding, basis, open interest, liquidations | Leverage, crowding, and stress monitoring |
| DEX Token | Token detail, prices, pools, liquidity, swaps, discovery lists, security | On-chain discovery and safety |
| Holder | Holder lists, tags, concentration, trends, counts | Whale/smart-money and concentration analysis |
| DEX OHLCV | Pair candles and points | Pool-level charts and indicators |
| Content & Community | Headlines, posts/comments, trending topics/tokens | Attention and narrative widgets |
| CMC AI | Market briefings and coin explanations with source URLs | Evidence-backed explanation cards |
| Tools | Price conversion, fiat map, API-key usage | Converter and data-health widgets |

CMC also launched a beta WebSocket endpoint in 2026. Its centralized-market channel pushes prices about every five seconds for the top 500 assets and about every fifteen seconds for other assets on Startup and above. Its on-chain channels cover trades, liquidity, k-lines, token/pool metrics, unique traders, aggregate holder metrics, and wallet updates.[^3]

## 2. Availability model Plan3 should use

Endpoint availability is not one simple ladder. Some sophisticated new features are broadly available while older discovery/content endpoints remain gated in the public pricing matrix. For this hackathon, the supplied Startup key has access to the complete catalog. Plan3 should still use **capability detection**, not hard-code a plan name into the UI, so the product remains correct when users later connect ordinary CMC keys.

### Hackathon access rule

For the current build:

- Treat every documented CMC REST family as enabled.
- Treat CMC AI, Content, Community, RWA market pairs, advanced exchange data, discovery endpoints, holder analytics and derivatives as usable.
- Probe actual access once during server startup and record the result in a capability registry.
- If a specific endpoint unexpectedly returns `403` or another entitlement error, degrade only that widget instead of failing the board.
- Keep official public plan labels in the catalog as productization notes, not hackathon blockers.

### Capability classes

| Class | Meaning in Plan3 | Product behavior |
|---|---|---|
| `public` | Supported by CMC's keyless `/public-api` GET surface | Works in preview/demo without a stored key |
| `keyed_core` | Available with the user's CMC key on broadly available plans | Default production widget |
| `startup_plus` | Requires Startup or higher | Show entitlement-aware locked state or fallback |
| `growth_plus` | Requires Growth or higher | Optional professional widget pack |
| `enterprise` | Enterprise-only | Never required for the core hackathon flow |
| `derived` | Computed by Plan3 from one or more available endpoints | Show formula, inputs, and timestamps |

CMC documents 18 Standard API and 17 DEX endpoints on its keyless surface. They include quotes/listings, metadata, category data, global metrics, Fear & Greed, CMC20/CMC100, Altcoin Season, DEX pair/token data, liquidity, security, swaps, candles, and selected holder endpoints.[^4] Keyless calls are GET-only and share an IP rate pool, so production should use the key whenever possible.

At startup, Plan3 should call `/v1/key/info` server-side. It reports plan and usage against minute and daily/monthly credit limits at no API-credit cost, although it does count toward the minute request limit.[^5]

## 3. Recommended prebuilt widget catalog

### A. Core market widgets

#### 1. Asset Snapshot

- **Purpose:** The canonical single-token card.
- **Displays:** price, 1h/24h/7d/30d change, rank, market cap, FDV, volume, dominance, circulating/total/max supply, TVL, CEX volume and DEX volume where present.
- **Endpoint:** `/v3/cryptocurrency/quotes/latest`
- **Availability:** public/keyed core; roughly 60-second source refresh.
- **Why it matters:** This becomes a typed source object reused by Thesis, Alert, Watchlist, and Agent Monitor widgets.

#### 2. Smart Watchlist

- **Purpose:** Compare a chosen set of assets without recreating the board.
- **Displays:** sortable price/change/volume/market-cap/FDV columns, freshness, and small derived badges such as “volume confirms move.”
- **Endpoint:** `/v3/cryptocurrency/quotes/latest`; use `/v2/cryptocurrency/info` for logos and metadata.
- **Availability:** public/keyed core.
- **Efficiency:** Batch up to 250 assets per credit boundary, rather than one request per row.[^6]

#### 3. Market Leaderboard

- **Purpose:** A configurable top-assets table.
- **Displays:** market-cap rank, price, volume, performance, supply, FDV, and selected auxiliary fields.
- **Endpoint:** `/v3/cryptocurrency/listings/latest`
- **Availability:** public/keyed core.
- **Agent affordance:** “Create a leaderboard of liquid assets with positive 7-day momentum but negative 24-hour momentum.”

#### 4. Performance Matrix

- **Purpose:** Heatmap comparing return windows.
- **Displays:** 1h, 24h, 7d, 30d, 60d and 90d returns for selected assets.
- **Endpoint:** `/v3/cryptocurrency/quotes/latest`
- **Availability:** public/keyed core.
- **Derived layer:** rank assets by consistency, acceleration, or reversal without inventing new source data.

#### 5. Valuation & Supply

- **Purpose:** Expose dilution and supply risk at a glance.
- **Displays:** market cap, FDV, market-cap/FDV ratio, circulating vs total/max supply, unlocked supply and unlocked market cap when returned.
- **Endpoint:** `/v3/cryptocurrency/quotes/latest`
- **Availability:** public/keyed core.
- **Derived signal:** `circulating_market_cap / fully_diluted_market_cap` as a clearly labelled approximation—not an unlock calendar.

#### 6. CEX vs DEX Volume Split

- **Purpose:** Show where an asset is actually trading.
- **Displays:** reported centralized and decentralized 24h volume, percentage split, change.
- **Endpoint:** `/v3/cryptocurrency/quotes/latest`
- **Availability:** public/keyed core.
- **Caveat:** This is an aggregate venue split, not exchange-by-exchange execution depth.

#### 7. Asset Profile

- **Purpose:** Compact due-diligence identity card.
- **Displays:** description, logo, category/tags, website, explorer, source code, technical-document and social links.
- **Endpoint:** `/v2/cryptocurrency/info`, IDs resolved through `/v1/cryptocurrency/map`.
- **Availability:** public/keyed core.
- **Important rule:** Store CMC IDs as canonical identifiers; symbols are ambiguous and change more often.[^1]

#### 8. Price Converter

- **Purpose:** Convert between crypto and fiat at a selected historical or latest rate.
- **Endpoint:** `/v2/tools/price-conversion` plus `/v1/fiat/map`.
- **Availability:** price conversion is public; fiat mapping is keyed core.

### B. Chart and historical widgets

#### 9. Asset Chart

- **Purpose:** The primary human analysis surface.
- **Displays:** OHLC/candles, volume, overlays, comparison assets, annotations.
- **Endpoints:** `/v2/cryptocurrency/ohlcv/historical`, `/v3/cryptocurrency/quotes/historical`, or DEX `/v1/k-line/candles` for a pool.
- **Availability:** CEX history is plan/range dependent; DEX k-line is available keyless for supported pairs.
- **Fallback:** If a requested historical endpoint is unavailable, collect normalized rolling snapshots in Plan3 and label them “recorded by Plan3,” not “CMC history.”

#### 10. Drawdown & Distance From Extremes

- **Purpose:** Show regime position rather than only latest return.
- **Displays:** current drawdown from ATH, distance from ATL, launch ROI, period high/low.
- **Endpoint:** `/v2/cryptocurrency/price-performance-stats/latest`
- **Availability:** Startup+.
- **Derived fallback:** calculate range drawdown from available OHLCV, while clearly labelling the selected time range.

#### 11. Correlation Matrix

- **Purpose:** Compare how a basket moves together.
- **Displays:** return correlations, rolling window, sample size.
- **Endpoint:** historical quotes or OHLCV.
- **Availability:** derived; source-history entitlement determines maximum range.
- **Trust requirement:** Formula, interval, missing-value handling and window must be inspectable.

#### 12. Relative Strength Chart

- **Purpose:** Compare an asset to BTC, ETH, CMC20 or CMC100.
- **Endpoint:** asset historical data plus CMC index historical data.
- **Availability:** index history is public; asset history depends on endpoint/plan.

### C. Market regime and rotation widgets

#### 13. Market Pulse

- **Purpose:** One horizontal strip for total market context.
- **Displays:** total market cap, 24h volume, BTC dominance, ETH dominance, active assets, exchanges and pairs.
- **Endpoint:** `/v1/global-metrics/quotes/latest`
- **Availability:** public/keyed core; roughly five-minute source refresh.[^7]

#### 14. Market Regime

- **Purpose:** A compact, explainable bull/risk-off/rotation state.
- **Inputs:** market-cap change, volume change, BTC dominance, Fear & Greed, Altcoin Season.
- **Endpoints:** global metrics + Fear & Greed + Altcoin Season.
- **Availability:** derived from public endpoints.
- **Output example:** “Risk-on, BTC-led” with a visible rule such as `market cap ↑ + volume ↑ + BTC dominance ↑`.

#### 15. Fear & Greed

- **Purpose:** Sentiment gauge with historical context.
- **Endpoints:** `/v3/fear-and-greed/latest` and `/v3/fear-and-greed/historical`.
- **Availability:** public/keyed core.
- **Better than a gauge:** Include percentile versus the selected history and show whether price agrees or diverges.

#### 16. Altcoin Season

- **Purpose:** Show whether breadth favors Bitcoin or altcoins.
- **Endpoints:** `/v1/altcoin-season-index/latest` and `/historical`.
- **Availability:** public/keyed core; CMC defines above 75 as Altcoin Season and below 25 as Bitcoin Season.[^7]

#### 17. Dominance Rotation

- **Purpose:** Make capital rotation legible.
- **Displays:** BTC and ETH dominance with total and altcoin market-cap/volume changes.
- **Endpoint:** global metrics latest/historical.
- **Availability:** latest is public; historical depth depends on plan.

#### 18. Category Heatmap

- **Purpose:** Reveal which narratives are gaining or losing attention/capital.
- **Displays:** category market cap, average price change, volume, market-cap change and volume change.
- **Endpoints:** `/v1/cryptocurrency/categories` and `/v1/cryptocurrency/category`.
- **Availability:** public/keyed core.
- **Agent affordance:** An agent can add the strongest category to a board, then expand its member assets as a proposed watchlist.

#### 19. Category Drilldown

- **Purpose:** Turn a narrative tile into its actual constituents.
- **Displays:** category summary plus paginated member tokens and their quotes.
- **Endpoint:** `/v1/cryptocurrency/category`.
- **Availability:** public/keyed core.

#### 20. CMC20 / CMC100 Benchmark

- **Purpose:** Broad-market benchmark without inventing a house index.
- **Displays:** latest index value, 24h change, historical chart, constituents and weights.
- **Endpoints:** `/v3/index/cmc20-latest|historical` and `/v3/index/cmc100-latest|historical`.
- **Availability:** public/keyed core; latest values refresh about every five minutes.[^8]

#### 21. Breadth vs Benchmark

- **Purpose:** Detect whether an index move is broad or concentrated.
- **Inputs:** CMC20/100 weights plus constituent returns from quotes.
- **Availability:** derived from public endpoints.
- **Displays:** percentage of constituents positive, equal-weight vs official-index return, top contribution.

### D. Discovery and attention widgets

#### 22. Search Trend Radar

- **Purpose:** Surface most-searched assets across 24h/7d/30d windows.
- **Endpoint:** `/v1/cryptocurrency/trending/latest`
- **Availability:** Startup+.

#### 23. Most Visited

- **Purpose:** Show attention based on page visits rather than price performance.
- **Endpoint:** `/v1/cryptocurrency/trending/most-visited`
- **Availability:** Startup+.

#### 24. Gainers & Losers

- **Purpose:** Ready-made mover board with CMC's tracked universe.
- **Endpoint:** `/v1/cryptocurrency/trending/gainers-losers`
- **Availability:** Startup+.

#### 25. New Listings Radar

- **Purpose:** Track recently added CMC assets.
- **Endpoint:** `/v1/cryptocurrency/listings/new`
- **Availability:** Startup+.
- **Safer compound version:** Join listings with DEX liquidity, holder count and security detail before an agent may mark an asset “researchable.”

#### 26. Airdrop Board

- **Purpose:** Show ongoing/upcoming/ended airdrops with associated currencies.
- **Endpoints:** `/v1/cryptocurrency/airdrops` and `/v1/cryptocurrency/airdrop`.
- **Availability:** Verify current key entitlement before enabling.
- **Caveat:** Discovery only; never imply eligibility or safety.

#### 27. Community Attention

- **Purpose:** Display CMC Community's top topics and tokens.
- **Endpoints:** `/v1/community/trending/topic` and `/v1/community/trending/token`.
- **Availability:** Growth+; one-minute cache, zero credits.[^9]
- **Caveat:** This represents activity inside CMC Community, not the entire social internet.

#### 28. News / Content Stream

- **Purpose:** Headlines, Alexandria content, top/latest community posts and comments.
- **Endpoints:** `/v1/content/latest`, `/posts/top`, `/posts/latest`, `/posts/comments`.
- **Availability:** Growth+; five-minute cache, zero credits for documented content endpoints.[^10]

#### 29. Attention–Price Divergence

- **Purpose:** Detect attention rising without corresponding price/volume confirmation.
- **Inputs:** trending/community rank + asset quote/volume.
- **Availability:** derived; requires Startup+ or Growth+ attention endpoints.
- **Output:** A proposed evidence item, not a buy/sell signal.

### E. Derivatives widgets

CMC's six derivatives endpoints were introduced in 2026. Exchange and per-asset pair endpoints expose open interest, index price, basis and funding rate. Liquidation endpoints aggregate forced closures over rolling 1h, 4h and 24h windows.[^11]

#### 30. Derivatives Venue Board

- **Purpose:** Rank futures/perpetual exchanges.
- **Displays:** 24h derivative volume, open interest, maker/taker fees, exchange score, liquidity score and pair count.
- **Endpoint:** `/v5/exchange/derivatives/list`
- **Availability:** free keyed plan and above; 60-second cache.

#### 31. Funding & Basis Table

- **Purpose:** Compare crowding for an asset across venues.
- **Displays:** price, index price, basis, funding rate, OI, 24h volume, outlier flag.
- **Endpoint:** `/v5/cryptocurrency/derivatives/market-pairs/list/latest`
- **Availability:** free keyed plan and above; 60-second cache.

#### 32. Open Interest Concentration

- **Purpose:** Show how much derivative exposure is concentrated by venue or market.
- **Inputs:** derivatives exchange and pair endpoints.
- **Availability:** derived from free keyed endpoints.
- **Displays:** concentration bars and Herfindahl-style score with the formula exposed.

#### 33. Liquidation Pulse

- **Purpose:** Headline leverage-stress card.
- **Displays:** long, short and total liquidation value for rolling 1h/4h/24h.
- **Endpoint:** `/v5/derivatives/liquidations/quotes/latest`
- **Availability:** Basic and above; 60-second cache.

#### 34. Liquidation Leaderboard

- **Purpose:** Rank stressed assets or exchanges.
- **Endpoints:** `/v5/derivatives/liquidations/cryptocurrency/list/latest` and `/exchange/list/latest`.
- **Availability:** verify returned fields and entitlement from the live key.

#### 35. Crowding Monitor

- **Purpose:** An agent-readable composite warning.
- **Inputs:** funding, basis, OI, volume, price change and liquidations.
- **Derived rule example:** flag when funding is extreme, OI rises, price stalls and same-side liquidations accelerate.
- **Trust requirement:** Show every threshold and never label this as a guaranteed reversal.

### F. DEX and on-chain widgets

CMC's DEX API covers hundreds of decentralized exchanges across Ethereum, Solana, BNB Chain and additional networks. Its API unifies discovery, price, pools, liquidity, swaps, security, holders and pair candles.[^12]

#### 36. DEX Pair Chart

- **Purpose:** Pool-specific candle and volume chart.
- **Endpoints:** `/v4/dex/pairs/quotes/latest`, `/v1/k-line/candles`, `/v1/k-line/points`.
- **Availability:** public for supported GET calls.

#### 37. Pool & Route Explorer

- **Purpose:** Compare where a token can be traded on-chain.
- **Displays:** pools, chain/DEX, quote token, price, liquidity, 24h volume and transaction activity.
- **Endpoints:** `/v1/dex/token/pools`, `/v4/dex/spot-pairs/latest`, pair quotes.
- **Availability:** public for documented keyless GET endpoints.

#### 38. Liquidity History

- **Purpose:** Detect liquidity entering or leaving a token.
- **Endpoints:** `/v1/dex/token-liquidity/query` and `/v1/dex/liquidity-change/list`.
- **Availability:** public for documented GET endpoints.
- **Derived alert:** percent liquidity change over a selected interval.

#### 39. Swap Tape

- **Purpose:** Human-readable recent buy/sell feed for a token.
- **Endpoint:** `/v1/dex/tokens/transactions`.
- **Availability:** public.
- **WebSocket enhancement:** live `onchain@transaction` stream when available.

#### 40. DEX Safety Card

- **Purpose:** Put contract risk next to discovery, not behind another tab.
- **Displays:** security level; honeypot, verification, mintable, freezable, rug-pull and fake-token status; buy/sell tax; provider/source.
- **Endpoint:** `/v1/dex/security/detail`.
- **Availability:** public.[^12]
- **Caveat:** A “safe” response is a vendor/on-chain signal, not an audit or guarantee.

#### 41. DEX Discovery Board

- **Purpose:** Filter trending, new, meme, and gainer/loser tokens.
- **Endpoints:** `/v1/dex/tokens/trending/list`, `/new/list`, `/meme/list`, `/gainer-loser/list`.
- **Availability:** keyed POST endpoints; verify live-key entitlement.
- **Useful filters:** chain, age, market cap, liquidity, volume, buys/sells, price change, social presence, audit status, and platform-specific launchpad exclusions.[^12]

#### 42. New Token Safety Gate

- **Purpose:** Prevent an agent from promoting a token based only on velocity.
- **Inputs:** discovery result + security detail + liquidity + holder count/concentration + token age.
- **Output:** Pass/Review/Reject with reasons and source timestamps.
- **Availability:** derived; several components are public.

### G. Holder-intelligence widgets

#### 43. Holder Count & Trend

- **Purpose:** Show whether ownership is expanding or shrinking.
- **Endpoints:** `/v1/dex/holders/count` and `/v1/dex/holders/trend/list`.
- **Availability:** count is public; trend requires a key.

#### 44. Holder Concentration

- **Purpose:** Quantify ownership risk.
- **Displays:** top 10/50/100 holding ratios, total balances, averages and their history.
- **Endpoint:** `/v1/dex/holders/trend/list`.
- **Availability:** keyed DEX capability.

#### 45. Smart-Money / Whale Lens

- **Purpose:** Explore labeled holder cohorts.
- **Displays:** counts and selected wallet rows tagged as KOL, smart money, whale, bot, sniper or developer; balances, net buy, realized PnL and activity timestamps where returned.
- **Endpoints:** `/v1/dex/holders/list`, `/tag_count`, `/detail`.
- **Availability:** holder list/detail are on the public catalog; tag aggregation/trends require verification.[^13]
- **Caveat:** Tags are classifications, not identity or intent certainty.

#### 46. Concentration–Price Divergence

- **Purpose:** Detect price movement that coincides with ownership concentration changes.
- **Inputs:** holder trend + DEX candle/price data.
- **Availability:** derived.
- **Agent behavior:** Propose evidence such as “top-10 concentration rose while price fell”; user decides its meaning.

### H. RWA widgets

CMC's RWA API covers tokenized stocks, commodities, currencies, government securities, ETFs and real estate. It supplies canonical asset and issuer records, tokenized aggregates, individual on-chain tokens, and related TradFi markets.[^14]

#### 47. RWA Market Map

- **Purpose:** Browse the tokenized-asset universe by type.
- **Displays:** tokenized market cap, 24h volume, average tokenized price, asset type, issuer and venue count.
- **Endpoints:** `/v5/real-world-assets/assets/list`, `/map`, `/info`.
- **Availability:** Basic and above.

#### 48. RWA Asset Lens

- **Purpose:** One decision card for an underlying real-world asset.
- **Displays:** aggregated tokenized quote, constituent on-chain tokens, supported networks/issuers, and related traditional markets.
- **Endpoint:** `/v5/real-world-assets/quotes/latest` plus metadata.
- **Availability:** Basic and above.

#### 49. Tokenization Fragmentation

- **Purpose:** Compare multiple token representations of the same underlying asset.
- **Inputs:** RWA quote constituents and issuers.
- **Displays:** share of volume/market cap by token, chain and issuer.
- **Availability:** derived from Basic+ RWA data.

#### 50. RWA Venue Comparison

- **Purpose:** Show markets where a tokenized asset trades.
- **Endpoint:** `/v5/real-world-assets/market-pairs/list`.
- **Availability:** Growth+.

#### 51. Tokenized-vs-Traditional Price Monitor

- **Purpose:** Compare tokenized quotes and any TradFi reference markets returned by CMC.
- **Input:** RWA quotes response.
- **Availability:** derived from Basic+ data.
- **Caveat:** Only calculate a “premium/discount” when timestamps, units, currency, and market sessions are comparable. Otherwise show both observations without claiming arbitrage.

### I. Exchange intelligence widgets

#### 52. Exchange Profile

- **Purpose:** Venue identity and due-diligence card.
- **Endpoints:** `/v1/exchange/map` and `/v1/exchange/info`.
- **Availability:** public/keyed core.

#### 53. Exchange Ranking

- **Purpose:** Compare spot venues by volume, traffic and liquidity-related measures.
- **Endpoints:** `/v1/exchange/listings/latest` or `/quotes/latest`.
- **Availability:** Growth+.[^15]

#### 54. Market Quality / Venue Comparison

- **Purpose:** Compare an asset's markets across exchanges.
- **Displays:** market pair, price, volume share, effective liquidity and available ±2% depth fields.
- **Endpoints:** cryptocurrency or exchange market-pairs latest.
- **Availability:** Growth+.

#### 55. Price Dispersion Monitor

- **Purpose:** Surface differences in reported prices between markets.
- **Inputs:** market-pair results filtered for liquid, non-outlier markets.
- **Availability:** Growth+ derived widget.
- **Caveat:** This is a research view, not executable arbitrage; fees, latency, transfer constraints and order-book depth matter.

#### 56. Exchange Assets / Reserve Composition

- **Purpose:** Visualize assets in wallet addresses associated with an exchange.
- **Endpoint:** `/v1/exchange/assets`.
- **Availability:** broadly available keyed plans.[^15]
- **Caveat:** CMC describes source-dependent balance updates. Do not call it a complete solvency proof.

### J. CMC AI and agent-native widgets

CMC AI is labelled Enterprise-only in the public documentation, but it is available through the hackathon key's full-catalog entitlement. It returns stored, periodically regenerated answers rather than generating on request. Market questions refresh about every 30 minutes; coin explanations range from roughly hourly to daily depending on type. Responses can include a TLDR, detailed body, generation time and source URLs.[^16]

#### 57. CMC Market Briefing

- **Purpose:** Ready-made market Q&A and top-news briefing.
- **Endpoint:** `/v5/cmc-ai/latest`.
- **Availability:** Enabled for the hackathon key; Enterprise-only in the public plan matrix.
- **Question types:** market sentiment, trending narratives, altcoin performance, bullish momentum, upcoming events, KOL discussion and event-specific questions.

#### 58. “Why Did It Move?”

- **Purpose:** Attach a source-backed explanation to an asset chart.
- **Endpoints:** `/v5/cmc-ai/coins/map` then `/v5/cmc-ai/coins/latest`.
- **Availability:** Enabled for the hackathon key; Enterprise-only in the public plan matrix. Coverage is the current top 100 by market cap and may rotate.
- **Possible topics:** price up/down, future price factors, sentiment, latest news, overview, roadmap and codebase.

#### 59. Evidence Card

- **Purpose:** The Plan3-native alternative when CMC AI is unavailable.
- **Inputs:** any CMC observations plus optional browser sources supplied separately.
- **Displays:** claim, stance, confidence, evidence rows, contradictory evidence, source endpoint/URL and timestamps.
- **Availability:** core Plan3 feature; CMC facts remain machine-verifiable.

#### 60. Thesis Scoreboard

- **Purpose:** Connect market facts to a user's explicit thesis.
- **Inputs:** accepted Evidence, Risk, Alert and observed market widgets.
- **Displays:** supporting/contradicting evidence, freshness, invalidation conditions and user-owned confidence.
- **Important:** The agent can propose changes; it must not silently rewrite accepted thesis state.

#### 61. Rule Builder / Agent Monitor

- **Purpose:** Convert natural language into a visible condition.
- **Example:** “Warn me when SOL rises 5% in 24h while volume falls and funding becomes more positive.”
- **Inputs:** quotes + derivatives market pairs.
- **Output:** typed rule tree, cadence, last evaluation, current inputs and result.
- **Availability:** derived; does not require CMC AI.

#### 62. Data Provenance Badge

- **Purpose:** Make every financial widget inspectable.
- **Displays:** provider, endpoint family, last source update, Plan3 retrieval time, transformation, stale state, request/credit status.
- **Availability:** universal.
- **Reason:** Provenance is part of the product differentiation, not footer metadata.

#### 63. API Health & Credit Governor

- **Purpose:** Keep an agent-built board inside its data budget.
- **Endpoint:** `/v1/key/info`.
- **Displays:** minute usage, daily/monthly credits, next refresh, widgets consuming the most requests.
- **Agent action:** Propose slower cadences or shared queries when projected usage crosses a threshold.

## 4. The strongest hackathon widget pack

Building every widget above would weaken the demo. The best initial pack balances visual impact, CMC breadth and the Plan3 collaboration idea.

| Priority | Widget | Why it belongs in the demo | Dependency |
|---:|---|---|---|
| P0 | Smart Watchlist | Familiar entry point and reusable asset context | Public quotes |
| P0 | Asset Chart | Primary human visual language | CMC/DEX history |
| P0 | Market Pulse | Instantly establishes whole-market context | Public global metrics |
| P0 | Market Regime | Demonstrates transparent derived intelligence | Public metrics + indices |
| P0 | Category Heatmap | Strong visual narrative/rotation surface | Public categories |
| P0 | Fear & Greed | Recognizable proprietary CMC signal | Public index |
| P0 | Altcoin Season | Recognizable rotation signal | Public index |
| P0 | Funding & Basis | Makes the terminal meaningfully trader-oriented | Free keyed derivatives |
| P0 | Liquidation Pulse | High-signal leverage/risk context | Basic keyed derivatives |
| P0 | Thesis Scoreboard | Makes Plan3 more than another dashboard | Plan3 native |
| P0 | Rule Builder / Agent Monitor | Demonstrates human-agent shared language | Plan3 derived |
| P0 | Provenance Badge | Makes the agent's reasoning auditable | Universal |
| P1 | DEX Safety Card | Strong CMC-only practical utility | Public DEX security |
| P1 | Holder Concentration | Adds genuine on-chain intelligence | DEX holder data |
| P1 | RWA Asset Lens | Shows sponsor breadth and differentiated data | Basic+ RWA |
| P1 | CMC20/CMC100 | Gives the board a benchmark | Public indices |
| P1 | CMC Market Briefing | Adds sourced natural-language context to the human-agent loop | Full-access hackathon key |
| P1 | Content/Community | Adds narrative and attention context | Full-access hackathon key |

### Recommended demo story

**Question:** “Is SOL momentum sustainable, or is leverage getting crowded?”

1. The user types the question.
2. The Scout agent proposes an Asset Chart, Market Pulse, SOL Snapshot, Category Heatmap, Funding & Basis, Liquidation Pulse and Thesis.
3. The board shows that price momentum is an observation, not a conclusion.
4. Risk proposes a rule combining volume confirmation, funding, OI and liquidations.
5. The user opens the rule, sees the exact source fields and thresholds, changes one threshold, and accepts it.
6. Live mode displays the resulting status and freshness.
7. The user shares a read-only board that another user can remix.

This demo uses CMC data extensively but makes Plan3—not a generic collection of cards—the hero.

## 5. Product architecture for the widget system

### 5.1 One server-side CMC gateway

Never expose the API key in browser JavaScript. Route every keyed request through a server-side adapter:

```text
Widget / Agent
    ↓ requests typed data capability
Plan3 Data Gateway
    ↓ resolves entitlement, batching, caching, fallback
CMC Adapter
    ↓ keyed or keyless request
CoinMarketCap API / WebSocket
```

The browser should request semantic resources such as `asset.quote`, `market.regime`, or `derivatives.pairs`, not arbitrary external URLs.

### 5.2 Shared normalized contracts

Start with these internal types:

```ts
type SourceStamp = {
  provider: "coinmarketcap";
  endpoint: string;
  sourceUpdatedAt?: string;
  retrievedAt: string;
  creditCount?: number;
  parametersHash: string;
  stale: boolean;
};

type AssetQuote = {
  cmcId: number;
  symbol: string;
  price: number;
  changes: Partial<Record<"1h" | "24h" | "7d" | "30d" | "60d" | "90d", number>>;
  marketCap?: number;
  fullyDilutedMarketCap?: number;
  volume24h?: number;
  cexVolume24h?: number;
  dexVolume24h?: number;
  source: SourceStamp;
};

type DerivedSignal<T> = {
  value: T;
  formula: string;
  inputs: Array<{ ref: string; value: unknown; source: SourceStamp }>;
  calculatedAt: string;
};
```

Add `MarketSnapshot`, `IndexSnapshot`, `DerivativeMarket`, `DexToken`, `HolderSnapshot`, `RwaAsset`, and `EvidenceItem` only as required by implemented widgets.

### 5.3 Widget manifests, not widget-specific agents

Each prebuilt widget should define:

- `type` and schema version
- accepted configuration
- required data capabilities
- normalized outputs it publishes to the board
- supported relationships (`derived_from`, `supports`, `contradicts`, `triggers`)
- minimum and preferred refresh cadence
- unavailable/partial/stale states
- agent-readable summary
- provenance rendering

Agents should compose valid manifests. They should not generate arbitrary React code or call arbitrary endpoints.

### 5.4 Cache by source cadence

Polling faster than CMC's documented cache interval wastes credits without producing fresher facts.

| Data | Suggested Plan3 cache |
|---|---:|
| Latest cryptocurrency quote | 60 seconds |
| Global metrics / CMC indices | 5 minutes |
| Categories | 5–15 minutes unless actively viewed |
| Derivatives | 60 seconds |
| DEX token/pair latest | 15–60 seconds depending on endpoint |
| Static metadata/maps | 24 hours, stale-while-revalidate |
| CMC AI market answers | 30 minutes |
| CMC AI coin overview/roadmap/codebase | 24 hours |
| Key usage | 5 minutes and after a 429/credit error |

Use a shared query cache so 10 widgets asking for SOL do not produce 10 CMC calls.

### 5.5 Entitlement-aware fallback

Every widget needs four states beyond loading/error:

- **Available:** all requested fields are live.
- **Partial:** useful subset available; show missing capabilities.
- **Locked:** endpoint exists but the key lacks entitlement.
- **Fallback:** Plan3 is using a documented alternative, such as locally recorded snapshots.

Do not silently replace a source. The provenance badge must reveal the fallback.

## 6. What CMC does not provide by itself

These require another provider, a wallet/venue integration, or Plan3-owned storage:

- A user's wallet balances, cost basis and full cross-chain portfolio history.
- Direct trading, order placement, custody or exchange account state.
- A live Level 2 order book suitable for execution decisions.
- X/Reddit-wide social sentiment; CMC Community trends are scoped to CMC.
- Macroeconomic calendars, company earnings calendars and comprehensive equity fundamentals.
- A true future token-unlock schedule; unlocked supply fields are not an unlock calendar.
- Complete protocol fundamentals such as revenue and TVL history for every DeFi protocol.
- Governance proposals and voting state.
- An independent security audit or guarantee that a token is safe.
- Financial advice or reliable prediction of future returns.

This boundary is valuable. Plan3 can be honest about which cards are **CMC observations**, **Plan3 calculations**, **agent interpretations**, and **external evidence**.

## 7. Implementation order

### Sprint 1 — live foundation

1. Server-only CMC client and `/v1/key/info` capability probe.
2. Stable CMC ID resolver and metadata cache.
3. Shared `SourceStamp` and freshness UI.
4. Asset Snapshot, Smart Watchlist and Market Pulse.
5. Fear & Greed, Altcoin Season and Category Heatmap.

### Sprint 2 — trading intelligence

1. Asset or DEX Pair Chart.
2. Funding & Basis and Liquidation Pulse.
3. Market Regime derived signal.
4. Thesis Scoreboard and Rule Builder wired to widget outputs.

### Sprint 3 — sponsor breadth and demo polish

1. DEX Safety Card and Holder Count/Concentration.
2. RWA Asset Lens.
3. Agent proposal/approval flow.
4. CMC Market Briefing or “Why Did It Move?” with citations.
5. Shared read-only board with frozen provenance snapshot and live refresh status.

### After the hackathon

- Production entitlement UX for ordinary Basic/Startup/Growth/Enterprise keys.
- Additional content/community and cross-venue market-quality compositions.
- WebSocket-backed live widgets.
- User-installed widget packs and safe third-party data adapters.

## 8. Decisions and cautions

1. **Use CMC AI, but do not make it the agent brain.** The hackathon key exposes it, and its sourced explanations will improve the demo. It still returns pre-generated CMC content, so Plan3's collaboration system should also work from structured CMC facts with any permitted model.
2. **Use derivatives early.** The 2026 endpoints are surprisingly accessible and add much more trader value than another price tile.
3. **Put safety beside discovery.** A trending/new-token widget without liquidity, holder and security context would be irresponsible and undifferentiated.
4. **Treat formulas as UI.** Derived signals must expose inputs and thresholds; otherwise Plan3 recreates the black-box trust problem it claims to solve.
5. **Batch and cache centrally.** CMC increased many batch credit boundaries to 250 items in August 2026. The data layer should exploit this automatically.[^3]
6. **Keep execution out of the MVP.** Market data plus agent collaboration is already a complete hackathon story and avoids custody, authorization and safety complexity.

## Sources

[^1]: CoinMarketCap, [API reference and endpoint families](https://coinmarketcap.com/api/documentation/pro-api-reference) and [endpoint chooser](https://coinmarketcap.com/api/documentation/pro-api-reference/endpoint-overview).
[^2]: CoinMarketCap, [CMC AI API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/cmc-ai).
[^3]: CoinMarketCap, [API changelog](https://coinmarketcap.com/api/documentation/changelog), including the 2026 WebSocket launch and August 2026 credit-batch changes.
[^4]: CoinMarketCap, [Keyless Public API guide and supported endpoint list](https://coinmarketcap.com/api/documentation/pro-api-reference/keyless-public-api).
[^5]: CoinMarketCap, [Tools API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/tools).
[^6]: CoinMarketCap, [Cryptocurrency API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/cryptocurrency).
[^7]: CoinMarketCap, [Global Metrics, Fear & Greed, and Altcoin Season reference](https://coinmarketcap.com/api/documentation/pro-api-reference/global-metrics).
[^8]: CoinMarketCap, [CMC Index API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/cmc-index).
[^9]: CoinMarketCap, [Community API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/community).
[^10]: CoinMarketCap, [Content API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/content).
[^11]: CoinMarketCap, [Derivatives API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/derivatives).
[^12]: CoinMarketCap, [DEX Token API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/token) and [DEX API overview](https://coinmarketcap.com/api/dex/).
[^13]: CoinMarketCap, [Holder API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/holder).
[^14]: CoinMarketCap, [Real World Assets API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/real-world-assets).
[^15]: CoinMarketCap, [Exchange API reference](https://coinmarketcap.com/api/documentation/pro-api-reference/exchange).
[^16]: CoinMarketCap, [CMC AI generation cadence, coverage, answers and sources](https://coinmarketcap.com/api/documentation/pro-api-reference/cmc-ai).
