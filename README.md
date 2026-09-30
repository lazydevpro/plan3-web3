# Plan3

Plan3 is a customizable Web3 research canvas. Traders can assemble, move, and
resize market-data widgets, switch the board asset, and keep their research
context together. CoinMarketCap (CMC) data powers the market widgets; Plan3 is
not a trade-execution service or an autonomous trading agent.

## Build with CMC submission

**Selected track:** Data and Visualisation.

| Item | Link or status |
| --- | --- |
| Live demo | [plan3-web3.pages.dev](https://plan3-web3.pages.dev/) |
| Source repository | [github.com/lazydevpro/plan3-web3](https://github.com/lazydevpro/plan3-web3) — public |
| Demo video | A 58-second product walkthrough exists locally in `outputs/plan3-demo-v1/`; **public video link pending** |
| DoraHacks entry | [dorahacks.io/build/49274](https://dorahacks.io/build/49274) |
| X post | **Pending:** link the DoraHacks entry and public demo video, include `#BuildwithCMC`, then add the post URL here |

The deployed site is the interactive demo. To see the CMC integration, open a
market-data board, add or inspect a market widget, and change the board asset.
The backend response is also inspectable at
[`/api/cmc?scope=core`](https://plan3-web3.pages.dev/api/cmc?scope=core)
or [`/api/cmc?scope=all`](https://plan3-web3.pages.dev/api/cmc?scope=all).
The `core` route loads quotes, listings, and daily history; `all` requests the
additional feeds below. A feed can fail independently without hiding the other
widgets. The `feeds` and `health` fields expose that state.

The walkthrough is an animated product video using real app captures, not an
unedited screen recording or proof of a live AI response. The AI research
endpoint is disabled on the public Pages deployment until authentication and
production model configuration are in place. Do not treat its illustrated AI
workflow as a currently working public feature.

### CMC endpoints used

The paths below are actual calls configured in [`lib/cmc.ts`](lib/cmc.ts), not
an API wishlist. Query parameters select assets, time windows, and USD
conversion. The server calls CMC with `X-CMC_PRO_API_KEY` from its environment;
the browser receives a normalized response through [`app/api/cmc/route.ts`](app/api/cmc/route.ts).

| Purpose | CMC Pro API endpoints |
| --- | --- |
| Prices, rankings, history, profiles, conversion | `/v3/cryptocurrency/quotes/latest`, `/v3/cryptocurrency/listings/latest`, `/v3/cryptocurrency/quotes/historical`, `/v2/cryptocurrency/info`, `/v2/tools/price-conversion` |
| Market context and benchmarks | `/v1/global-metrics/quotes/latest`, `/v3/fear-and-greed/latest`, `/v1/altcoin-season-index/latest`, `/v1/cryptocurrency/categories`, `/v3/index/cmc20-latest`, `/v3/index/cmc100-latest` |
| Directories and plan usage | `/v1/exchange/map`, `/v1/fiat/map`, `/v1/key/info` |
| Derivatives and liquidations | `/v5/derivatives/liquidations/quotes/latest`, `/v5/cryptocurrency/derivatives/market-pairs/list/latest`, `/v5/exchange/derivatives/list`, `/v5/derivatives/liquidations/cryptocurrency/list/latest`, `/v5/derivatives/liquidations/exchange/list/latest` |
| DEX token research | `/v1/dex/token`, `/v1/dex/security/detail`, `/v1/dex/holders/count`, `/v1/dex/tokens/transactions`, `/v1/dex/liquidity-change/list` |
| Real-world assets | `/v5/real-world-assets/assets/list`, `/v5/real-world-assets/quotes/latest`, `/v5/real-world-assets/issuers/list` |

**Live verification:** On 29 September 2026, the deployed `scope=all` response
reported `health: "healthy"`, `mode: "full"`, and `status: "ok"` for all 27
configured feeds. This is a point-in-time check, not an uptime guarantee; the
current feed status is visible in the live response.

### Real API call: code and response

The application makes the authenticated upstream call server-side. This is the
relevant code path, shortened from [`requestCmc`](lib/cmc.ts):

```ts
const response = await fetch(`https://pro-api.coinmarketcap.com${path}`, {
  headers: {
    Accept: "application/json",
    "X-CMC_PRO_API_KEY": apiKey,
  },
});
const payload = await response.json();
```

For a direct reproduction with your own exported `CMC_PRO_API_KEY` (never put
the key in a URL, screenshot, or commit):

```sh
curl -sS 'https://pro-api.coinmarketcap.com/v3/cryptocurrency/quotes/latest?id=1&convert=USD' \
  -H "X-CMC_PRO_API_KEY: $CMC_PRO_API_KEY" \
  -H 'Accept: application/json'
```

An authenticated call to that exact endpoint returned HTTP 200 on
**29 September 2026 at 05:15:42 UTC**. Selected public fields from the actual
response are shown below; unrelated response fields are omitted, and no API key
is included:

```json
{
  "status": {
    "timestamp": "2026-09-29T05:15:42.598Z",
    "error_code": "0",
    "credit_count": 1
  },
  "data": [
    {
      "id": 1,
      "name": "Bitcoin",
      "symbol": "BTC",
      "quote": [
        {
          "price": 83222.6275761438,
          "last_updated": "2026-09-29T05:13:59.000Z"
        }
      ]
    }
  ]
}
```

The live Plan3 proxy returned `health: "healthy"` and `mode: "full"` for
[`scope=core`](https://plan3-web3.pages.dev/api/cmc?scope=core) on the same day,
with `assets`, `listings`, and `history` feeds all reporting `status: "ok"`.
Prices and timestamps will change.

### What the API made possible — and what got in the way

CMC let us put quotes, historical comparisons, market-wide context, DEX token
signals, derivatives, and RWA data on one editable canvas, with a single asset
selection driving related widgets. The harder parts were differing response
shapes across endpoint families, partial feed availability, caching and credit
budgets, and keeping the key server-side while making failures visible to users.
Plan-dependent endpoint access means a board can be only partially populated.

The event's free Startup-tier access [ends when submissions close on
30 September 2026 at 23:59 UTC](https://coinmarketcap.com/api/resources/api-hackathon/).
Without a continuing paid plan or grant, some full-tier widgets may stop
receiving live data during judging. The live demo and `feeds` status should be
rechecked after that deadline; the video preserves the working state but does
not replace a live-data test.

## Run and deploy

The application is built with Next.js and Vinext. The Cloudflare Pages
deployment uses Pages Functions advanced mode so `/api/cmc` runs server-side;
a static-only export would not support live market data.

1. Use Node.js 22.13 or later and run `npm ci`.
2. Copy `.env.example` to `.env`, then set `CMC_PRO_API_KEY` locally. Never commit
   `.env` or add the key to a `NEXT_PUBLIC_*` variable.
3. Run `npm run dev` for local development, then `npm run test:workspace`
   and `npm run build` before deploying. The existing lint command still reports
   unrelated React-hook and generated-script findings.
4. In Cloudflare Pages, create a project named `plan3-web3` with production
   branch `main`, compatibility date `2026-05-15`, and `nodejs_compat`. Add
   `CMC_PRO_API_KEY` as a **production secret**. The key is read only by the
   server-side CMC route.
5. Run `npm run deploy:pages` after `npm run build`. This packages the Vinext
   server into Pages Functions advanced mode and uploads the client assets.

The current Pages project uses direct uploads, not automatic Git-triggered
deployments. Pushes to GitHub do not publish by themselves. The Gemini agent
remains disabled on this public deployment until a non-Sites authentication
flow and production model configuration are in place; do not enable a billable
AI endpoint without access control.

## Original Sites/Vinext development notes

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Whenever reopening or moving a checkout, run `node <plugin-root>/scripts/configure-execution-profile.mjs` before project commands. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

On managed Linux, use `sites-preview start` only for requested browser QA. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
