# Exchange widgets

Jupiter Swap and LI.FI Bridge & Swap are configurable canvas block kinds. Find them in Library → Your instruments, preview the layout, and add them like any other block. Drag, resize, duplicate, export, import, and saved-board restoration use the normal builder paths.

## Execution boundary

- Library/editor previews are inert local representations, labeled as previews, without live quotes or external SDK loading.
- Activate explicitly on the board to load the official provider. Activation does not request a signature. Wallet connection, amounts, token/network choices, quotes, fee review, and transaction signing belong to the provider UI.
- Board asset changes never prefill or rewrite a trade. Plan3 does not store wallet credentials, amounts, recipients, or transaction state in board manifests, exports, or agent payloads.
- One active session per provider per page prevents shared SDK/singleton collisions. Duplicate cards retain independent canvas geometry, not duplicate live wallet sessions.
- Closing/deleting a card or navigating away is not transaction cancellation. The close control warns users to keep sessions open while transactions are pending. Use the provider’s transaction UI/explorer to check final status.
- No Plan3 referral/integrator fees are configured. Provider, bridge, network and trading fees still apply.
- Jupiter loads its official script on demand and disables automatic wallet connection. LI.FI is a lazy-loaded official React widget with EVM and Solana providers, public provider RPC defaults, and no secret embedded in client code. Availability, wallet compatibility, rate limits and supported routes are provider-dependent.
- Third-party SDKs run client-side. Only fixed provider integrations are accepted; imported board content cannot supply script URLs or executable widget code.

## References

- [Jupiter integration](https://developers.jup.ag/docs/tool-kits/plugin/index)
- [Jupiter configuration](https://developers.jup.ag/docs/tool-kits/plugin/customization)
- [LI.FI installation](https://docs.li.fi/widget/install-widget)
- [LI.FI configuration](https://docs.li.fi/widget/configure-widget)

## Acceptance

Verify both live forms, provider loading/recovery, duplicate session ownership, inactive previews, resize/list view, and manifest round-tripping. No funded transaction should be performed as part of automated or browser QA. A real wallet/signing test requires the owner's participation and is not implied by successful rendering.

2026-09-28 verification: 28 automated tests and TypeScript passed. Local browser rendered both official forms and their wallet-connect controls, restored both cards inactive after reload, disabled activation in a duplicate Jupiter card while the original was active, showed the close-session warning, and retained the live LI.FI form while another widget moved/resized using the keyboard. Document widths matched 375px and 768px viewports; desktop forms reviewed at 1280px. Provider script loading failure exposed a retry action during the initial interrupted test. No wallets were connected, terms accepted, tokens approved, or funded transactions submitted. Screenshot: `outputs/exchange-widgets-verified.png`.
