# The Listening Ledger · 听账手记

A local spending journal you explore by sight, touch and sound. Open a Daily Journal or a Spending Collection, listen to a record's status, then inspect its amount, evidence and your own decision. AI helps interpret a purchase description; you control categories, recognition and limits.

**v0.4 status, 11 November 2026:** the existing USD 12.00 PayPal Sandbox purchase has completed live DeepSeek suggestion, manual category adoption and separate recognition, repeat synchronization, browser reload and service-restart recovery. Original amount and monthly budget stayed unchanged; there was no new payment. One user confirmed that the three timbres were distinguishable and the final revision-4 headphone volume was appropriate; device-voice and remaining operation checks are separate. The intended judging configuration also passed a fresh-copy live-service and recovery check with a separate model key. Public hosting is deferred; the public repository, private judging-access handoff, video and final submission are separate unfinished gates. See the [public verification summary](docs/PUBLIC_VERIFICATION.md).

## Run locally

For team handoff and submission preparation: [Chinese teammate guide](docs/TEAMMATE_GUIDE_ZH.md), [bilingual recording kit and verified references](docs/PITCH_RECORDING_KIT_ZH_EN.md), [English subtitle draft](docs/DEMO_SUBTITLES_EN.srt), and [five-gate submission audit](docs/FINAL_SUBMISSION_AUDIT_ZH.md). A script, subtitle file or checklist is not evidence of a recorded video or completed submission.

Use Node.js **22.13 or later**, with built-in SQLite, and a current desktop browser. Windows is the primary development platform. Other operating systems and physical mobile devices need separate verification. No npm packages need installing; the page-turning library is vendored.

1. Extract or clone into a new directory. Start in the directory containing `server.mjs` and `package.json`.
2. Run `node --version` and check the version requirement.
3. Run `node server.mjs`.
4. Open **http://localhost:4333/**. The server listens on `127.0.0.1` only. On Windows, `start.cmd` is an alternative launcher.
5. Choose the labelled example or practice book. No credentials or payment are required for the example journal, manual review, limits, page turns or status sounds.

The first run creates `data/ledger.sqlite`. Ctrl+C stops the server; restarting preserves that database. Browser preferences and reading positions also use local storage. `localhost` and `127.0.0.1`, different ports, and different browsers have separate storage. Use the same browser and hostname when checking recovery. Do not delete an existing database to reset a demonstration; use the practice book.

The generated [clean-package report](验收/v4-release-check.md) records the exact test count, runtime, asset checks and saved-example recovery for the audited source package. The earlier 104-test ZIP is a historical build and must not be submitted as the current version. The release checker uses a separate directory with no existing database or service credentials; it does not establish live-service access or a new user's usability. See [testing guide](docs/TESTING.md).

## Optional external services

Demo mode works without `.env`. Copy `.env.example` to `.env` **only if `.env` does not already exist**, then edit locally. Existing credentials must not be overwritten. Environment variables override file values. Restart after changes.

| Variable | Purpose |
|---|---|
| `PORT` | Local port; default `4333`. |
| `AI_BASE_URL` | Existing DeepSeek-compatible base; the template uses `https://api.deepseek.com`. |
| `AI_MODEL` | Model identifier available to your configured account. The recorded v0.4 evaluation used `deepseek-flash`; availability is not assumed for every account. |
| `AI_API_KEY` | Server-side model credential. Leave empty for manual review only. |
| `AI_DAILY_LIMIT` | Request-count limit per UTC day; default `40`. This is not a currency-based spending cap. |
| `PAYPAL_CLIENT_ID` | Authorized Sandbox application ID. |
| `PAYPAL_CLIENT_SECRET` | Server-side Sandbox secret. OAuth access does not itself grant Transaction Search permission. |

Never publish credentials, tokens, personal snapshots or the database. The static server uses an allowlist; it does not serve the project directory. This is a single-user local application, not a public multi-user service.

**The judging configuration is locally verified; external judge access is still pending.** [Free judging access and local reproduction](docs/JUDGING_ACCESS.md) separates the offline demonstration from the live-service configuration and records the fresh-copy check with a dedicated model key and existing controlled Sandbox app. The actual private access route, delivery and continued free availability must still be arranged; no personal keys are published and judges should not be required to buy API access. The ordinary journal does not require the optional Sandbox checkout helper.

## Try the main task

The interface is primarily Simplified Chinese. [The English testing guide](docs/TESTING.md) translates important controls.

1. Open **日期手记 / Daily Journal**. Drag the outer page edge or use the arrows. Keyboard arrows work when the book has focus and no input/modal is active.
2. In **账本来源 / Ledger source**, choose **AI 练习副本 / AI practice copy**. Its seven fictional purchases are isolated from the original example and Sandbox books.
3. Deliberately enable sound. The advancing path plays short status tones. Hover a node to preview; click to inspect its amount and reason. Text remains available when muted.
4. Find the uncertain 4 November record. Choose **帮我弄清这笔 / Help me understand this purchase**. Enter “这笔是线上绘画课，不包括软件。” (an online drawing course, not software), inspect the data preview, consent, then analyze.
5. Inspect the proposed category and exact quotation. Accepting **教育 / Education** changes only the category. Recognizing the merchant is separate; an unrecognized record remains blue. Original amounts never change.
6. In **我的限额 / My Limits**, preview a total/category limit, then save or cancel. Preview does not commit changes.
7. Open **生活图鉴 / Spending Collection** and find the same record in its new category. The two books are views of one ledger, not duplicated purchases.
8. Inspect a page/range recap, then refresh and check the saved decision history and reading position.

## Colors, amounts and coverage

| Status | Meaning | Sound |
|---|---|---|
| Green circle | Sufficient records and applicable limits; no unresolved item or triggered reminder. | Warm, sustained felt-keyboard chord. |
| Red angular node | A configured limit is exceeded, or your own reminder applies. | Short wooden taps in two rhythmic groups. |
| Blue outlined question | A description/category needs review, records are incomplete, or a budget assessment is unavailable. | Two high glass notes separated by a pause. |

Blue has priority while confirmed overspending remains an additional fact. Green is not a merchant-safety rating or a judgment that a purchase was good. Blue is not a fraud finding.

Amounts use integer minor units. USD and CNY stay separate, without conversion. Totals mean **completed purchases, before refunds**, not net spending or an available balance. Only supported completed debit purchase events are included. Income, transfers, Payouts, fees, refund events, unknown types and unsupported currencies are excluded with reasons. A purchase reversed by the provider leaves the eligible total, while source history remains.

Reading scope, limit period, successfully queried windows and effective cutoff are distinct. Reading one day does not shrink the period. Incomplete coverage cannot yield a definite remaining allowance or a green budget conclusion; known overspending can still be stated as a lower bound. Equality reaches a limit; only a larger amount exceeds it. Empty means unset; zero is a real cap. Date boundaries use **Asia/Shanghai (UTC+08:00)**.

## PayPal: role and current boundary

Transaction Search supplies records, direction, event types and lifecycle changes from an authorized test account. Complete pages/windows commit together. Failed or narrow replacement queries preserve the previous valid baseline. Each account/currency book has its own baseline revision.

The tested account must be the **payer whose history this application may read**. A merchant's receipt in another project does not establish access to the buyer's spending. This application does not relabel income as purchases, initiate payments/refunds, or access Live funds.

The authorized Sandbox app returned OAuth and Transaction Search HTTP 200. A completed USD 12.00 purchase subsequently appeared in reporting on 11 November after an observed reporting delay. It entered the book as one eligible purchase alongside three excluded non-purchase events. The import keeps direction, status, currency, coverage and provenance; it does not convert merchant income or refunds into spending.

Between 19:41 and 19:50 Beijing on 11 November, the existing USD 12.00 Sandbox purchase completed the real browser review: live deepseek-flash suggested Education with an exact quotation; accepting the category kept the record blue; separately recognizing the test purchase made it green. Repeat Transaction Search at 19:45:13 retained one eligible purchase and three excluded events with no duplicate. The provider amount (1200 cents) and raw uncategorized field stayed unchanged; Education is a review override. The USD 25 monthly budget and revision 2 stayed unchanged. After a service restart and reload, the Spending Collection Education page recovered the same amount, state and two history entries. Saved edits, history, budget and AI acceptance time were compared and matched. No new order, payment or refund was made. See the [identifier-free verification summary](docs/PUBLIC_VERIFICATION.md).

The morning query delay is historical evidence, not the current imported state. Reporting can lag, and a successful OAuth response alone does not establish Transaction Search permission. References: [PayPal permission tutorial](https://developer.paypal.com/community/blog/PayPal_AG_Grid_Part_1/) and [official API specification](https://github.com/paypal/paypal-rest-api-specifications/blob/main/openapi/reporting_transactions_v1.json).

The optional [two-account Sandbox helper](docs/沙箱购买联调.md) can prepare a fixed test purchase when none exists. It is unnecessary for this already recorded purchase and is separate from the read-only journal.

## AI, program facts and voice

- **Classification:** DeepSeek receives merchant/purpose text, your supplement, allowed categories and version references. Raw amounts, account identifiers and credentials are excluded. Obvious identifiers are redacted; detection is not comprehensive, so inspect the preview.
- **Evidence:** categories are allowlisted and citations must quote current input exactly. Ambiguity should produce a question, not invented amounts. A valid quotation is not proof of correct reasoning; you may reject or manually choose.
- **Recaps:** the program builds a verified fact catalog. The model returns only one to three existing `factIds`. Unknown/duplicate IDs and extra free-form fields are rejected. Program templates generate all amounts and conclusions; coverage gaps and confirmed overspending remain visible even if the model omits them. Failure can produce a labelled rule recap.
- **Freshness:** source, review, budget, scope, language, model and prompt versions participate in cache/freshness checks. Historical, cached, rule-generated and live-model results remain distinct.
- **Audio:** Web Audio produces tones; browser/OS `speechSynthesis` reads fact text. DeepSeek does **not** generate audio. Device voice availability and naturalness vary. No new cloud TTS subscription is required.

Turning pages, closing details, muting and switching books stop old audio. **朗读设置 / Reading voice settings** offers voice selection and audition. Missing Chinese voices leave readable text and an availability message. Some browser-listed voices may require online access; use the actual voice label. Naturalness and headphone comfort still need human acceptance.

External model calls may incur provider charges. Cache can avoid repeated calls; the quota uses UTC days. Page turns, themes, manual classification, limits, tones and device reading do not call the model.

## Art, verification and license

The 11 November art update adds five clearly labelled AI illustrations, generated in advance for the five example spending days. The app selects these locally using confirmed categories and supported merchant themes; page turns do not generate images. Other dates reuse matching themes, while unsupported or uncertain content is left unillustrated. The existing 18 physical-source assets remain separately credited under their CC0 terms, including retained files from earlier layouts; generated illustrations are not labelled CC0. None of the artwork is evidence of an actual purchased item, location or weather. CSS/SVG provide page structure, live paths and controls. [The art ledger](docs/ASSET_SOURCES.md) and [generation prompts](public/assets/illustration-prompts.json) record these distinctions; artwork terms are separate from the code license.

Run `node --test tests/*.test.mjs`. The [clean-package report](验收/v4-release-check.md) records the exact tests and HTTP checks for the audited source; earlier 104/131-test results are historical, overlapping runs. Automated tests use fixtures/mocks and do not require `.env`, paid model calls or PayPal access. Passing them does not certify external permissions, listening comfort, physical touch or submission. See [testing](docs/TESTING.md), [limitations](docs/KNOWN_LIMITATIONS.md), [sound notes](docs/SOUND_DESIGN.md) and the [public verification summary](docs/PUBLIC_VERIFICATION.md).

The stack is native ESM, Node HTTP, SQLite, Web Audio, device speech and StPageFlip 2.0.7. No CDN dependency is loaded at runtime. Own code uses [MIT](LICENSE); external materials retain their licenses in [third-party notices](THIRD_PARTY_NOTICES.md) and the asset ledger. Do not publish `.env`, `data/`, logs or historical local backups.
