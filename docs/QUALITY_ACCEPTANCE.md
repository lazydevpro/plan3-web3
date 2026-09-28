# Plan3 quality acceptance — 2026-09-28

## Gemini integration follow-up

The scorecard below records the earlier review. A server-side Gemini integration has since been implemented locally with validated widget proposals, selective human approval, source references, cancellation/error handling, and mocked-provider tests. The key is configured and a minimal provider response succeeded, but the full research request returned a provider error. Further payload diagnostics require approval; this integration has not been published. See [Gemini setup](./GEMINI_SETUP.md). This does not establish autonomous research, cloud sync, or background alerts, and does not change the provisional scores below.

## Verdict

The old scorecard predates two substantial improvement passes. The original defects should not be carried forward as if unchanged, but neither automated tests nor the author's opinion establish an absolute 10/10. This is a local-first CMC research builder, not yet a complete hosted AI research platform.

The strongest improvements are guided question-to-board setup, human-reviewed agent patches with recovery, and independent progressive market feeds. The largest remaining gaps are hosted reasoning, cross-device persistence, and independent accessibility/usability validation.

## Evidence-based scorecard

These are provisional engineering-review estimates, not user-study scores or certification.

| Dimension | Before | Current estimate | Implemented evidence | What prevents a defensible 10 |
|---|---:|---:|---|---|
| Onboarding | 5 | 8 | Question + asset + condition creates four connected widgets; validation keeps input; next actions explain where to go | Unassisted completion and time-to-value need target-user testing |
| Core experience | 6 | 8 | Transactional inspector, independent presets, stable Undo after save, group manipulation, readable list view | Complex multi-board/100-widget workflows and unsaved inspector navigation need further testing |
| Error handling | 3 | 8 | Partial/outage distinction, timeouts, stream interruption detection, offline recovery, per-widget error boundaries, protected storage repair | Browser quota and recovery remain device-local; no cloud backup |
| Information architecture | 5 | 8 | Instruments and fixed-scope CMC feeds separated, real previews, search, Guide, health inspection | Specialized feeds still have deliberately fixed asset scope |
| Visual polish | 7 | 8 | Existing identity preserved, readable unscaled view, larger content and controls, responsive layouts | Broader cross-browser, text enlargement, and all-preset visual audit |
| Performance | 5 | 8 | Fast feeds render independently, three-feed custom scope, cache, hidden-tab pause, bounded requests | Need production mobile/slow-network profiling and 100-widget interaction measurements |
| Accessibility | 4 | 7 | Semantic tables, chart values as table, keyboard controls, panel focus return and mobile focus containment, full-size reading view | No full assistive-technology audit, WCAG certification, or localization support |
| Feature completeness | 5 | 7 | Connected research loop, configurable instruments, selective browser-agent changes, sharing/remix, recovery | Model-backed in-app agent, arbitrary sources, cloud sync, background alerts remain unimplemented |

Overall provisional average: **7.8/10**. Do not convert this to 10/10 in marketing or release notes.

## Before / after craft review

| Before | After |
|---|---|
| Guide explains steps but leaves assembly to the user | A form assembles the question, evidence, condition, and relationships |
| Slowest CMC feed blocks every result | NDJSON updates publish completed feeds independently |
| Canvas shrink-to-fit makes text difficult to read | Full-size list view defaults on mobile; canvas layout remains untouched |
| Preset settings shared across duplicates | Each edited preset stores independent settings |
| JSON key ordering looked like a remote edit | Canonical comparison preserves Undo and stable proposal revisions |
| Closing a narrow-screen panel could lose keyboard focus | Focus cycles within the panel and returns to its trigger |

## Verification

- 22 automated tests cover prior workspace regressions plus guided setup, preset independence, canonical comparison, progressive feeds, interrupted/chunk-split streams, stale condition suppression, and retained unavailable values.
- TypeScript passes.
- Local endpoint delivered 28 stream events for 27 feeds, with first event at 104 ms and completion at 9,529 ms in one observed run. This includes warm/cacheable feeds and is not a production benchmark or SLA.
- Browser: invalid threshold focuses the input and retains the question; valid ETH setup creates four widgets and two links.
- Browser: original and copied preset theses remain different after editing; Undo remains enabled after autosave.
- Browser: mobile panel Shift+Tab wraps to the last visible control; Escape restores focus to Guide.
- Responsive: 375px and 768px document widths match their viewports; desktop reviewed at 1280px. Canvas geometry is not rewritten by reading view.
- Semantic watchlist column/row headers appear in the accessibility tree. Historical chart values have a keyboard-accessible table.

## Remaining acceptance work

1. Observe 5–8 target researchers completing setup, evidence editing, agent review, recovery, and remix without help. Record completion, errors, time, and trust in freshness. Target at least 90% unassisted completion before claiming exceptional onboarding.
2. Run keyboard + screen reader review across the full preset catalog, 200% text enlargement, reduced motion, contrast, and actual touch devices.
3. Profile production builds with cold data, slow networks, interruption, quota exhaustion, and 100-widget boards. Set measured performance budgets before claiming exceptional performance.
4. Implement hosted AI reasoning only with an approved provider/key and a defined cost policy. Keep explanations, source provenance, and selective human approval.
5. Define authenticated cloud persistence and background alerts as a separate infrastructure milestone; do not silently claim browser-local storage is cloud sync.

No trades, wallets, payment actions, new external data destinations, or broader site audience were introduced in this pass.
