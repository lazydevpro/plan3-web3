# Gemini research agent

## Configuration

Add `GEMINI_API_KEY` to the ignored root `.env` for local development. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`, listed as stable in Google's model documentation when implemented. Restart the development server after editing environment values.

For the hosted Site, configure `GEMINI_API_KEY` as a server secret through Sites runtime settings; local `.env` is not uploaded. Set `GEMINI_MODEL` there if overriding the default. Never use a `NEXT_PUBLIC_` variable, paste credentials into chat, or commit `.env`.

Hosted generation is additionally gated by `GEMINI_ENABLED=true`. It defaults to disabled, independently of whether a key is configured. Leave it disabled until full research and selective-approval verification succeeds. Development-mode diagnostics remain available. The exchange-widget release may include this code with generation disabled; this is not a verified Gemini launch.

The Agent panel checks configuration without making a paid generation request. “Key configured” is not a claim that Google has accepted the key. Only a successful generation verifies model access and billing.

## Behavior and limits

- An explicit Ask Gemini action sends the prompt, current board (including notes), and a bounded CMC snapshot to Google. Other local boards, identity headers, API usage details, and CMC credentials are not included.
- The response contains analysis, references to supplied feeds, caveats, and up to 12 proposed widget changes plus 12 links. Citation IDs are validated, but factual interpretation is not automatically verified.
- The server validates changes, rejects locked-widget edits and unsafe source URLs, preserves existing layout/configuration, and positions new widgets below existing ones. It can add configurable instruments, not fixed-scope presets.
- Every change passes through the existing selective human review and Undo flow. Stale responses and proposals are rejected. No execution, autonomous URL fetching, background monitoring, or automatic retries.
- The built-in rule-based starter remains separately labeled and explicitly selected; it is never a silent fallback for model errors.
- Missing key, provider rejection, quota errors, incomplete/invalid output, and timeouts have explicit UI errors. Input and current board remain intact. Canceling discards results but may not prevent provider charges.
- Production requires signed-in requests; only development-mode loopback preview uses a local identity. Cross-origin browser requests are rejected. The Site remains owner-private. Six requests per minute and one in-flight request per user are best-effort per Worker isolate, not distributed guarantees. Configure provider quotas/billing limits before broadening access.
- One request per explicit action, 150KB maximum request body, 2,000-character prompt, 8,192 output-token cap, 45-second provider timeout. The panel has a 65-second overall timeout. No chat history is stored or sent; include needed follow-up context in the question.

## Verification

Current checkpoint (2026-09-28): model listing and a minimal JSON generation succeeded. User-approved full research diagnostics returned HTTP 503 high-demand errors from both `gemini-3.8-flash` and `gemini-3.5-flash`. A bounded `gemini-2.5-flash` test returned HTTP 404 (unavailable to new users). The configured model remains `gemini-3.8-flash`; there is no automatic model fallback or retry. HTTP 503 has a specific retry-later message and preserves the board. Full research generation and the live browser proposal/approval flow remain unverified. Do not enable hosted Gemini generation or label it production-ready until those checks succeed. The key remains secret, and local `.env` is ignored with owner-only permissions.

`npm run test:workspace` includes mocked provider tests for structured responses, secret handling, selective application, unchanged layout, invalid/unsafe proposals, citations, and provider failures. These do not establish live Gemini connectivity. After setting the key, test one analysis-only question and one proposed widget change; confirm the latter is not applied until explicitly approved.

Official references: [models](https://ai.google.dev/gemini-api/docs/models), [REST generation configuration](https://ai.google.dev/api/generate-content). The newer REST `responseFormat.text.mimeType` field uses `APPLICATION_JSON` (an enum), not `application/json`; the latter was rejected during live testing despite appearing in a guide example.
