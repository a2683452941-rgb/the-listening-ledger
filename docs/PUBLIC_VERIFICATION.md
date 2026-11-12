# Public verification summary

Updated 11 November 2026. This is an author-recorded engineering summary, not an independent user study or an accuracy benchmark. Raw local API evidence, account identifiers, order/capture/refund IDs, screenshots of private records, credentials and database snapshots are intentionally excluded from the public source bundle. Links labelled “Public verification summary” point here rather than claiming those private files are included.

## Confirmed before the final source freeze

- The generated clean-package report is the authority for the final packaged test count. Earlier working-tree and ZIP counts are historical runs and must not be added together.
- Live DeepSeek classification and fact selection have been exercised on synthetic cases. The model produces allowed categories/evidence or selects program fact IDs; program rules control amounts and budget conclusions.
- The authorized PayPal Sandbox app returned OAuth and Transaction Search HTTP 200.
- One completed USD 12.00 Sandbox purchase was verified, subsequently returned in Transaction Search, and saved to the journal. Its provider reference matched the completed capture in private evidence.
- The purchase appeared in the actual book after a local service restart. The USD 25 monthly limit remained intact; the imported USD 12 total left USD 13 under that known snapshot. This was Sandbox activity only.
- The final art iteration includes five pre-generated, labelled AI illustrations matched locally to confirmed content, plus separately credited physical-source assets. Unknown records are not assigned a guessed image. Desktop book pages and a 390×844 browser viewport were inspected; this is not physical-device testing.

## Complete real-purchase review (G1)

Between 19:41 and 19:50 Beijing on 11 November, the existing USD 12.00 Sandbox purchase completed the real browser review: live deepseek-flash suggested Education with an exact quotation; accepting the category kept the record blue; separately recognizing the test purchase made it green. Repeat Transaction Search at 19:45:13 retained one eligible purchase and three excluded events with no duplicate. The provider amount (1200 cents) and raw uncategorized field stayed unchanged; Education is a review override. The USD 25 monthly budget and revision 2 stayed unchanged. After a service restart and reload, the Spending Collection Education page recovered the same amount, state and two history entries. Saved edits, history, budget and AI acceptance time were compared and matched. No new order, payment or refund was made. The two saved actions occurred at 19:42:27 (AI category adoption) and 19:42:34 (manual recognition). This is one controlled Sandbox workflow, not evidence for arbitrary accounts or general model accuracy.

## Separate judging-configuration verification

Between 20:56 and 21:11 Beijing on 11 November, a fresh source copy started on a separate loopback port without an existing database or saved journal state. Configuration was supplied through the child process environment; no credential file was copied into the source copy. The model key was different from the daily development key. The existing controlled Sandbox app returned one eligible USD 12.00 purchase and three excluded records.

A new November USD 25 budget was created in this copy through the UI, producing budget revision 2; it was not copied from the main journal. One live deepseek-flash request proposed Education with an input quotation. Category adoption at 20:59:11 kept the record blue; separate recognition at 20:59:23 made it green. Repeat synchronization of 1 October–30 November completed at 21:03:47. After restarting that separate service and reopening the browser, the USD 12.00 amount, Education review override, two history entries, budget and AI acceptance time all matched the saved state; no duplicate appeared. The provider category remained uncategorized. The main journal's saved edits, history and budget were unchanged.

Credential/database HTTP paths returned 404 and the checked browser error log was empty. No new order, payment or refund was made. This is an author-operated configuration check; the private access route, delivery to judges and availability throughout judging remain pending.

## Final browser sound and operation checks

In the actual browser, all three revision-4 legend auditions, switching tones, map start/replay, mute, a turn to 2 November and closing the book were exercised without console errors. Device reading was triggered for USD 12.00 and CNY 18.00, 42.00, 50.00 and 20.00, plus the USD 26.50 settings audition. Visible amount/reason text, stop feedback and close/reopen resets were checked. These observations establish browser actions and text/state feedback, not independent confirmation of natural pronunciation or absence of residual audio in physical headphones.

## Still separate from those results

The first sound revision was difficult to distinguish in headphone feedback. The user confirmed that revision 2's warm chord, wooden taps and glass bells were distinguishable but requested more volume. Revision 4 keeps those timbres and raises level; the same user then confirmed its headphone volume was appropriate. This is feedback from one person, not a general listening study. Device-voice naturalness and unobserved physical/interaction behavior cannot be inferred from automated tests or those browser state checks. The dedicated model configuration has now passed the separate local check above; private judge-access delivery, continued free availability, publication links and actual submission status remain separate pending items. See [sound notes](SOUND_DESIGN.md).

## Reproduce the published build

Follow [README](../README.md), [TESTING](TESTING.md) and [JUDGING_ACCESS](JUDGING_ACCESS.md). The generated [clean source-package report](../验收/v4-release-check.md) states the exact Node version, HTTP checks, test result and fresh-directory restart verification. `RELEASE_MANIFEST.json` lists source hashes for the audit payload; the adjacent release result records the ZIP hash. Those reports do not make external API calls or certify listening comfort.

## Scope

The application is a single-user local journal for examples and an authorized Sandbox account, with USD/CNY kept separate. It does not aggregate arbitrary consumers' banks, detect fraud, certify merchants, execute journal payments/refunds or prove measured behavioral improvements. The UI and art are ways to inspect a record, not evidence that a purchase was safe or morally good.

