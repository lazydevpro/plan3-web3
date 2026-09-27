# Builder v2 verification — 28 September 2026

## Automated

`npm run test:workspace`: seven passing tests covering starter round-trips; malformed manifests; null/zero/nonfinite metrics; board-bound and pinned conditions; stale/failed inputs; independent duplication and edge cleanup; legacy layout/thesis/monitor preservation; and safe source URL schemes.

`npx tsc --noEmit`: passed.

## Browser checks (local preview, actual CMC response)

- Existing saved v1 board migrated into the new workspace with its geometry.
- New momentum playbook created separately; prior board remained in the board list.
- Composer preview rendered the selected metric and asset before adding.
- A new BTC-pinned metric stayed on BTC while the board changed to ETH; linked chart, metric and condition followed ETH.
- Duplicate increased the widget count from 7 to 8; undo restored 7.
- Explicit x=0 geometry applied without the previous reserved-left gap.
- Evidence relationship added and persisted in the manifest.
- Pointer dragging at ~65% zoom moved a widget by the corresponding canvas distance; resizing changed its dimensions correctly.
- Snapshot opened with no edit controls. Remix created an editable copy.
- Guided starter produced a BTC risk board, required acceptance, and survived reload.
- Actual WebMCP read returned the structured board; agent proposal returned `awaiting_human_approval`, and the active board remained unchanged.
- Browser console had no error/warning entries during the checks.

The agent tools were subsequently changed to keep stable registrations across data refreshes. Snapshot creation now uses a URL fragment so board content is not sent as a query string to the web server; legacy query links remain accepted.

## Not claimed

No paid competitor benchmark, independent usability study, mobile drag-device test, automated browser suite, exhaustive endpoint validation, multiplayer test, model-backed agent evaluation, background alert delivery, or financial-strategy performance test was performed. Build/publish status is recorded in the release result, not assumed here.
