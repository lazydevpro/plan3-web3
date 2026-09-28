# Gemini research agent

## Configuration

Add `GEMINI_API_KEY` to the ignored root `.env` for local development. `GEMINI_MODEL` is optional and defaults to `gemini-3.8-flash`, listed as stable in Google's model documentation when implemented. Restart the development server after editing environment values.

For the hosted Site, configure `GEMINI_API_KEY` as a server secret through Sites runtime settings; local `.env` is not uploaded. Set `GEMINI_MODEL` there if overriding the default. Never use a `NEXT_PUBLIC_` variable, paste credentials into chat, or commit `.env`.

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

Current checkpoint: 27 automated tests pass. The global Gemini key was copied to ignored `.env` without displaying it, with owner-only file permissions. The same key is configured as a hosted runtime secret (pending deployment). Model listing and a minimal JSON generation succeeded. Full research requests returned a provider error; they are not yet verified end-to-end. A deeper diagnostic sending board/CMC payloads was blocked by the safety approval check. Do not label the agent production-ready or publish this integration until this is resolved. The existing live Site remains on the previous release.

`npm run test:workspace` includes mocked provider tests for structured responses, secret handling, selective application, unchanged layout, invalid/unsafe proposals, citations, and provider failures. These do not establish live Gemini connectivity. After setting the key, test one analysis-only question and one proposed widget change; confirm the latter is not applied until explicitly approved.

Official references: [models](https://ai.google.dev/gemini-api/docs/models), [REST generation configuration](https://ai.google.dev/api/generate-content). The newer REST `responseFormat.text.mimeType` field uses `APPLICATION_JSON` (an enum), not `application/json`; the latter was rejected during live testing despite appearing in a guide example.
