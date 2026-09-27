# Experience loop engineering — 2026-09-28

## Implemented

- Inspector edits and relationship edits are one Apply/Cancel transaction. Applying only changed properties preserves concurrent canvas movement.
- Cross-tab saves use Web Locks and a three-way merge. Independent edits merge; conflicting edits become a separate recovered board. Unsupported locking or storage failures produce an explicit unsaved state.
- Twelve prior local versions per board can be restored as copies from Boards. This is browser-local recovery, not cloud backup.
- Browser-agent proposals expose selectable before/after changes, apply to the current board, preserve unchecked changes, reject stale proposals, and support Undo. The guided starter remains explicitly rule-based.
- Watched conditions flag the related thesis for review. This is not automated investment advice or trade execution.
- Configurable table columns (up to six), minimum-value filters, and seven/fourteen-observation chart windows.
- Multi-selection, group pointer movement, left/top alignment, position locks, optional snapping, and saved layer order.
- Native modal focus management, working Space/Escape, data health inspection, real loading states, readable source metadata, mobile toolbar wrap, and task-oriented Guide.
- CMC outages are distinct from partial responses. Requests have a 12-second limit; custom boards request only quotes/listings/history, while presets/library/data inspection request the expanded set. Hidden tabs stop polling.
- Legacy thesis/monitor editing and monitor approval restored. Legacy presets share board-level thesis/monitor settings; independent research should use configurable notes and conditions.

## Automated coverage

`npm run test:workspace` covers 17 tests, including simulated upstream outage/partial failure, merges/conflicts, layer order, draft geometry/relationships, selective agent changes, revision fingerprints, dangling-link prevention, configuration round-trips, stale rule inputs, migration, and unsafe source URLs.

## Browser regression checks

Verified in an isolated loopback environment, not against user production boards:

- Space activates Share; Escape closes it with its text input focused.
- Adding a relationship then Cancel does not mutate the canvas.
- Moving a card with its editor open then Apply preserves the new position.
- Two tabs adding different cards preserve both after reload (7 → 9 widgets).
- Competing title edits preserve the second edit in a recovery board.
- Agent proposal with two changes: accepting one applies only that change; Undo restores the original.
- A met watched condition produces “Thesis needs review”.
- Recovery history is visible after saved edits.
- Multi-select Align left produces matching positions; position lock disables movement.
- Responsive inspection at 375, 768, and 1280px. Mobile toolbar overflow was found and corrected.

## Limits / next validation

This work is not a claim of a universally 10/10 product. No formal WCAG certification or user study has been performed. Cloud sync, multiplayer, hosted background alerts, arbitrary external data ingestion, model-backed in-app reasoning, arbitrary chart intervals, and general formula composition remain outside the current implementation. Browser-agent collaboration requires a compatible browser. Recovery storage shares the browser's quota; users should export backups.

Next acceptance study: ask 5–8 target researchers to create a thesis, bind two assets, define an invalidation condition, review an agent patch, recover a previous version, and share/remix a board without assistance. Record completion, time, errors, and trust in data freshness.
