# Free judging access and local reproduction

Updated 11 November 2026. This project runs locally; public deployment is not required for this build. This guide distinguishes the free offline demonstration from real external services.

## Start the offline book

1. Install Node.js 22.13 or later. Open a terminal in the extracted repository directory.
2. Run `node server.mjs`, then open `http://localhost:4333/` in a current desktop browser.
3. Open **账本来源 / Ledger source → AI 练习副本 / AI practice copy**. No credentials, npm install or payment are needed for the fictional purchases, manual review, limits, page turns and sounds.
4. See [TESTING.md](TESTING.md) for English control translations and steps. Keep the same browser, hostname and port when checking saved state.

Without service configuration, the app must show the model and PayPal as unconfigured. Offline examples do not prove a live model call or a live PayPal query.

## Live model and PayPal testing

**Configuration verification: passed locally. External judge handoff: still pending.** The intended judging configuration passed an author-side check in a fresh local source copy between 20:56 and 21:11 Beijing on 11 November. A dedicated model key, different from the daily development key, made one live deepseek-flash request. The existing controlled Sandbox app returned the USD 12.00 purchase; no new payment was required. This verifies the configuration locally, not its delivery to an external judge or uninterrupted availability throughout judging. No test credentials or personal developer credentials are published in this repository.

The intended handoff is a dedicated test configuration supplied through a private testing channel identified in the final Devpost testing instructions. The final entry must specify the actual contact/access route; this document does not invent one. Access must remain available throughout judging, through 15 December 2026 08:00 PST (16 December 00:00 in Beijing), and must not require a judge to buy model credits or fund a PayPal account. The dates and free-access requirement were checked against the [official rules](https://paypalaihackathon.devpost.com/rules) on 11 November 2026.

The handoff needs:

- A dedicated model API credential with a model identifier that is actually available to that test account, supplied and funded by the author.
- A PayPal **Sandbox** app authorized to query its own test account with Transaction Search enabled. OAuth success alone does not establish this permission.
- An already recorded eligible Sandbox purchase in the queried account's history, plus a specified currency and reading/budget date range. A second new payment is not necessary to review an existing record.
- A precise private configuration path and support/contact route. Test account credentials are required only if the reviewer needs to visit Sandbox UI; do not share the author's main account password.

Copy `.env.example` to `.env` only if `.env` does not already exist. Populate the supplied configuration locally, restart the server and use **账本来源 / Ledger source** to inspect the actual status and synchronize the specified range. Inspect the fields shown in the model consent preview before any model call.

### What a reviewer should verify

1. The transaction source is **PayPal Sandbox**, not a fictional example, and reports the successful synchronization range/cutoff.
2. The purchase amount and description appear in the appropriate currency book. Non-purchase events remain excluded with reasons.
3. A truthful purpose supplement produces an AI category suggestion with a quote from current input. Accepting it is separate from recognizing the merchant; either can be left unconfirmed.
4. Changing or previewing a limit changes the deterministic assessment, not the original purchase amount.
5. Repeat synchronization, reopen and restart using the same hostname. The same record and saved review history remain; no duplicate purchase is created.

A failed API call must leave the last valid state intact and display a failure. Do not substitute fictional data for a failed Sandbox query.

## Optional Sandbox checkout helper

The ordinary journal does not initiate payments or refunds. `scripts/sandbox-checkout.mjs` is an explicitly launched development helper for producing a **USD 12.00 Sandbox-only test purchase** when no suitable existing record is available. It is not required for the offline demonstration or for reviewing an existing purchase.

The payer must be the account whose history the journal is authorized to read. A separate receiver Sandbox merchant app belongs in `.env.sandbox-checkout`, copied from the blank `.env.sandbox-checkout.example` without overwriting an existing file. First run the journal and successfully query the payer's account. Then run `node scripts/sandbox-checkout.mjs` and open `http://localhost:4335/`. A person logs in to Sandbox and approves; the local service verifies the payer, order and amount before capture. It never requests Live funds. See the detailed [two-account guide](沙箱购买联调.md).

## Author's release checklist

- [ ] Replace the pending handoff status with a tested, concrete free-access route in the Devpost private testing instructions.
- [x] Test the intended judging configuration in a clean local copy, without the author's existing database or saved journal state (11 November, 20:56–21:11 Beijing).
- [x] Confirm the documented model works with the new key and the existing controlled Sandbox app has query permission and the suitable USD 12.00 record.
- [ ] Keep that access working for the full judging period.
- [ ] Publish only the audited source payload; never include `.env`, `.env.sandbox-checkout`, `data/`, logs, private raw evidence or passwords.

The release checker exercises offline startup and persistence with all service variables empty. The separate author-side live configuration check above does not replace the pending private handoff or certify future availability. See [PUBLIC_VERIFICATION.md](PUBLIC_VERIFICATION.md) for the current, identifier-free evidence summary.

