# Testing The Listening Ledger v0.4

Evidence updated: 11 November 2026. This guide separates deterministic tests, real service calls, browser checks and human listening. A check in one category does not establish the others. The complete requirement mapping is [Public verification summary — v4-验收映射.md](PUBLIC_VERIFICATION.md).

## Recorded results and outstanding gates

| Evidence | Recorded result | What it does not establish |
|---|---|---|
| Full offline suite | Run `node --test tests/*.test.mjs`; the [clean-package report](../验收/v4-release-check.md) records the exact final count, runtime and frozen payload. | No real PayPal query or hardware-listening test is included. A working-tree run is not automatically a published release. |
| Historical runs | Earlier 104/131-test runs and targeted module runs remain development history. | Do not add overlapping runs or interpret a test count as the full acceptance-scenario count. |
| [Public verification summary — Live model evidence](PUBLIC_VERIFICATION.md) | Six synthetic classification cases and one fact-selection recap exercised the configured DeepSeek model. | Not interviews, a representative benchmark or a claim that every question is useful. See limitations for the mixed-purpose follow-up. |
| [Public verification summary — PayPal capability evidence](PUBLIC_VERIFICATION.md) | At 19:38 Beijing: Sandbox OAuth 200, reporting scope present, Transaction Search 200. Three records returned: account adjustment, merchant receipt and refund; zero eligible purchase debits. | Query access is verified. This check does not establish full-window synchronization, browser recovery or the real-purchase-to-book acceptance gate. |
| [Public verification summary — Real source synchronization](PUBLIC_VERIFICATION.md) | At 19:52–19:54 Beijing: two windows for 1 October–30 November, capped at request time; three non-purchase records saved. Repeat sync kept stable record/source fingerprints, zero eligible total and unchanged budget/edits. A server restart preserved the baseline revision, records and connection stage. | No eligible purchase entered a book. A populated single page plus an empty window is not a real multi-page result or network-interruption test. |
| [Public verification summary — Completed Sandbox payment](PUBLIC_VERIFICATION.md) and [Public verification summary — helper recovery](PUBLIC_VERIFICATION.md) | On 11 November at 10:51 Beijing, read-only order verification confirmed USD 12.00, order/capture `COMPLETED`, the expected payer and the locally saved capture. Restarting the helper and reopening its page retained the same completed result with no capture button. The journal's USD 25 monthly limit and review edits were unchanged. | No new capture was requested by verification. At 10:52, [Public verification summary — full-window sync](PUBLIC_VERIFICATION.md) still had zero eligible purchases; at 10:53 the [Public verification summary — day report](PUBLIC_VERIFICATION.md) was last refreshed at 08:59:59, before the 10:49:15 payment. This does not establish purchase import, imported-record AI review or G1 completion. |
| [Public verification summary — Eligible purchase arrival](PUBLIC_VERIFICATION.md) | On 11 November at 14:07 Beijing, full-window sync returned HTTP 200 with four records: one eligible USD 12.00 debit and three excluded events. The purchase reference matches the verified capture; amount and time match. Pure domain evaluation places it in the 11 November chapter, retains the USD 25 limit, counts USD 12 and leaves the record blue for missing category/recognition. | No payment, refund, model request or human review was executed. Those follow-up steps were not executed during the 14:07 import check; the later G1 row records their completion. |
| [Complete real-purchase G1](PUBLIC_VERIFICATION.md) | 11 November, 19:41–19:50 Beijing: live AI category suggestion, separate manual adoption/recognition, repeat query with one eligible/three excluded, no duplicate, then browser and service-restart recovery. USD 12 original amount, USD 25 budget/revision 2 and two history entries were preserved. | One controlled account and purchase; no new payment/refund. Not an arbitrary-account, live pagination or user-study result. |
| [Clean source-package check](../验收/v4-release-check.md) | Independent Windows directory, no prior database or `.env`, empty service credentials, runtime/assets/security HTTP checks, synthetic save/restart recovery and the full offline suite. Exact counts and ZIP hashes are in the generated report and manifest. | Local packaging does not establish public publication, live-service access or unassisted new-user usability. |
| [Public verification summary — Browser integration](PUBLIC_VERIFICATION.md) | Both books, focused-keyboard page turn/bookmark recovery, limit save/reload, real AI adoption and recap on fictional records, incomplete Sandbox allowance, image fallback, Esc/focus return from recap and four desktop-emulated viewports checked. The real recap preserved mandatory overages and the current Education/unrecognized decision. | Quarter/half-page drags, complete keyboard/200% text, physical touch, listening comfort and every screen/state are not certified. |
| Voice and operation | One user confirmed the revised tones were distinguishable and revision 4 volume appropriate. Real browser auditions/map/replay/mute/page-turn/close actions completed with no console errors. Five record-reading requests and the settings audition were triggered; visible amount/reason text and stop/reopen feedback were checked. | One-person tone feedback is not a population study. Device-voice naturalness, auditory pronunciation and hardware residual audio are not certified by request/state checks. Publication remains separate. |

## Automated checks: no external credentials

From the project root:

```sh
node --version
node --test tests/*.test.mjs
```

Use Node 22.13+ with native SQLite. Tests use synthetic data, injected fetch responses and memory stores; they must not require `.env` or charge an external account. The development scripts `scripts/check-connections.mjs` and `scripts/evaluate-v4-ai.mjs` are **not** this offline test suite: they can use configured external services and should only be run intentionally.

| Test file | Main checks |
|---|---|
| `tests/domain.test.mjs` | Integer amounts, exact limits, missing rules, review priorities, filtered reading and record pagination. |
| `tests/v2.test.mjs` | Calendar periods, previews, normalized PayPal events, mocked pagination/failure, model evidence, cache/quota and API input guards. |
| `tests/v3.test.mjs` | Twenty amount scripts, voice ranking, recap scope, independent practice state and reusable real-material edition coverage. |
| `tests/v4-data.test.mjs` | Complete budget baselines, missing coverage, future/ongoing periods, per-currency revisions, atomic failure, provider changes and gross purchase semantics. |
| `tests/v4-api.test.mjs` | Server-side budget/snapshot selection, source-review freshness, stale classification acceptance and stale recap rejection. |
| `tests/v4-ai.test.mjs` | Strict factId schema, Chinese fabricated-money rejection, mandatory facts, version changes, empty scopes and data minimization. |
| `tests/v4-art.test.mjs` | Physical-source manifest metadata, released-image hashes, redistribution evidence and all reachable scenes using declared images. These assertions do not replace human source/visual review. |
| `tests/sound.test.mjs`, `tests/sound-design.test.mjs`, `tests/transport.test.mjs` | Bounded synthesized samples, differentiated timbres, cached PCM, single-channel control, old callbacks, muted/missing voices, timing and cancellation. |
| `tests/release-policy.test.mjs` | Filled templates/private values/machine paths are rejected without echoing values; public documentation targets are checked. |
| `tests/migration.test.mjs` | Old state preservation, independent backups and origin checks. |

When recording the final run, save date/time, Node version, code revision or release-package hash, command, passed/failed/skipped counts and relevant output. Do not concatenate counts from overlapping runs. Do not rerun live paid tests as part of ordinary regression.

## Clean-directory release check

The automatic clean-copy startup/security/assets/persistence/offline-test checks below have passed, as recorded in [the release check](../验收/v4-release-check.md). The browser-profile and dedicated real-service portions remain separate checks. This is not a claim that publication has happened.

1. Prepare a separate release directory from an explicitly reviewed file list. Include the complete `public/`, `lib/`, `tests/`, `server.mjs`, `package.json`, `.env.example`, required documents, vendored licenses and locally referenced assets. Exclude `.env`, `data/`, logs, private evidence and `_history/`.
2. Confirm no pre-existing database or browser state is being imported. Use a fresh browser profile for this check.
3. Follow [README](../README.md) literally: Node version, `node server.mjs`, then `http://localhost:4333/`. If testing alongside another process, stop that process or deliberately set a free local port and record the difference.
4. Without credentials, open the example book, inspect a record, preview/cancel a limit, save a manual category and reopen. Source must say example; model/PayPal buttons must not claim a live connection.
5. Stop and restart. Confirm the same local saved state returns. Use the same hostname/profile.
6. Run the offline tests. Confirm `.env` and SQLite URLs return no files; inspect the publication file list rather than relying only on `.gitignore`.
7. Add only the dedicated controlled service configuration, through a verified private channel, and run the real-service tasks below. Do not ship the author's personal configuration.

Record actual OS, Node/browser versions and results. Other operating systems remain untested unless recorded explicitly. Publish the final hash/tag used in the video, not a different development copy.

## English guide to the current controls

| Chinese control or label | Meaning |
|---|---|
| 日期手记 | Daily Journal: purchases grouped by calendar date. |
| 生活图鉴 | Spending Collection: the same purchases grouped by category. |
| 翻开 / 继续阅读 | Open / resume the selected book. |
| 账本来源 | Choose example, practice or authorized Sandbox data. |
| AI 练习副本 | Isolated fictional seven-record practice ledger. |
| 我的限额 | Set total/category limits and the evaluation period. |
| 预览未生效 / 保存 / 取消 | Preview is not applied / save / cancel. |
| 目录与日期 / 账单索引 | Chapter/date navigation / direct record index. |
| 帮我弄清这笔 | Describe this purchase and ask for an AI category suggestion. |
| 开始分析 / 定位原话 | Send the consented text / locate the quoted input. |
| 采用分类 / 我认识这笔 | Accept a category / separately recognize the record. |
| 待核对 / 需要关注 / 预算内 | Needs review / needs attention / within applicable limits. |
| 数据待补齐 | Insufficient query coverage; no definite remaining allowance. |
| 朗读设置 / 试听 / 停止 / 静音 | Device voice settings / audition / stop / mute. |
| 本页回顾 / 这段时间的回顾 | Current-page facts / facts for the selected reading range. |
| 规则摘要 / 缓存建议 / 历史建议 | Program facts / cached suggestion / historical suggestion. |

Raw merchant names, descriptions and quotes remain in their original language. The glossary is an English guide, not a claim that every screen has an English UI. The final video needs English narration/subtitles for each operation and result.

## Task A: the seven-record example

1. Select the practice source and the date range **2026-11-01 to 2026-11-07**. The fictional CNY purchases total **¥320.00 before refunds**, under a **¥300.00** total cap. Dining and shopping each total **¥110.00** under their respective **¥100.00** caps.
2. Open the Daily Journal. Check the path arrives at each node once. A node plays only a status tone. Clicking a record exposes its amount and reasons. Muting must leave all facts readable.
3. On 4 November find record N06, **¥20.00**, initially uncategorized with an unrecognized merchant. Add the course purpose. Before invoking AI, inspect the exact fields to be sent; classify input must omit the raw amount and account identifier.
4. With live AI configured, request a suggestion. Inspect the real quote, proposed category and source label. Accepting Education alone keeps the record blue because recognition is still unresolved. Separately confirm recognition only when justified by the synthetic exercise. Neither action edits the source amount.
5. Preview a new limit, then cancel. Confirm no rule/version/color changes were saved. Repeat and save; reopen to confirm the persisted value.
6. Narrow reading to one day. The page total changes, but full-period budget evidence must not change to that day's total. Show both scopes.
7. Switch to Spending Collection and locate N06 in its current category. Open the recorded decision history, then refresh. Check there is one record and the same amount.

These amounts are expectations for the shipped fixture only. Never force real Sandbox transactions to match them or insert fake transactions into a Sandbox book.

## Task B: real AI evidence

The recorded evaluation uses synthetic descriptions and explicitly records model, prompt version, inputs, validated result, timing and source. It is separate from the user's actual financial data.

| Case | Expected behavior |
|---|---|
| Clear course purpose | Suggest Education and quote the current course description. |
| Unrecognized abbreviation, no remembered purpose | Ask one useful clarification; no invented classification. |
| “Not a meal; kitchen storage boxes” | Use the correction rather than the negated meal. |
| Misleading merchant name | Follow the explicit item, not the merchant's apparent theme. |
| Course and software membership together | Leave category undecided; ask for the main purpose/user preference. Do not require or invent a monetary split. |
| Text asks to change money and declare safety | Do not edit money or present merchant-safety claims. |

The initial mixed-purpose output asked for separate amounts. That quality issue is preserved in `previousAttempts` in the live evidence. A targeted real rerun with prompt **4.1**, at **2026-11-10 10:24:52 UTC**, returned no category and asked: “这笔消费主要用于课程还是软件会员？” (“Was this mainly for the course or the software membership?”). The targeted example is improved without inventing a monetary split. This is one rerun, not a general reliability claim.

For recap verification, send only the current fact catalog; accept a strict `{ "factIds": ["..."] }` response. Extra `text`, fabricated Chinese amounts such as “一万元”, nonexistent IDs, duplicates and stale catalogs must not enter displayed or spoken fact text. Confirm mandatory overage/coverage facts remain when the model omits them. Failure uses a labelled rule recap and preserves manual review.

For freshness, start a request and change its supplement/source/review/budget before it returns. The old result must neither overwrite new input nor be accepted by a direct API request. Browser cancellation and backend freshness require separate evidence.

## Task C: real PayPal purchase — completed controlled G1 workflow

**Current result:** Between 19:41 and 19:50 Beijing on 11 November, the existing USD 12.00 Sandbox purchase completed the real browser review: live deepseek-flash suggested Education with an exact quotation; accepting the category kept the record blue; separately recognizing the test purchase made it green. Repeat Transaction Search at 19:45:13 retained one eligible purchase and three excluded events with no duplicate. The provider amount (1200 cents) and raw uncategorized field stayed unchanged; Education is a review override. The USD 25 monthly budget and revision 2 stayed unchanged. After a service restart and reload, the Spending Collection Education page recovered the same amount, state and two history entries. Saved edits, history, budget and AI acceptance time were compared and matched. No new order, payment or refund was made. [Public result summary](PUBLIC_VERIFICATION.md). The following steps are a reproduction guide, not a claim that every optional failure scenario has been tested.

1. Verify the application's Sandbox environment, associated account and actual Transaction Search access. Do not send secrets to reviewers or place them in a recording. [Official feature/permission guidance](https://developer.paypal.com/community/blog/PayPal_AG_Grid_Part_1/) describes account-dependent setup and potential token/report delays.
2. Establish an authorized same-account test: the queried account must itself have made an eligible Sandbox purchase. Merchant income, Payouts or a different buyer's payment are not substitutes. Creating test purchases is a separate authorized account task; this journal is read-only.
3. Query the entire limit period through the source panel. For a current period use its actual cutoff; for a completely future period no reversed or future query is made.
4. Record environment, account role (without secret identifiers), requested windows, query status, cutoff, returned/included/excluded counts and revision. All windows/pages must succeed before the new baseline is committed.
5. If `200` returns no eligible purchases, show exactly that state. Do not call it a spending import or automatically switch to example data. Reporting can be delayed.
6. If an eligible purchase appears, open that exact record in the book and compare date, direction, currency and amount with the source response. Then repeat sync, refresh and reopen; no duplicate or changed amount should appear.
7. Use isolated mocks to test a second-page/network failure while preserving the prior snapshot and human decisions. Deliberately causing a new financial operation is unnecessary for this failure check.

The controlled G1 flow above passed using the existing purchase; no additional payment is needed. A fresh reviewer must still check the supplied account/configuration and execute the workflow rather than infer success from HTTP 200. Live multi-page responses and network-interruption scenarios remain separate from this result.

## Browser, audio and art checks

**Final observed subset:** In the actual browser, all three revision-4 legend auditions, switching tones, map start/replay, mute, a turn to 2 November and closing the book were exercised without console errors. Device reading was triggered for USD 12.00 and CNY 18.00, 42.00, 50.00 and 20.00, plus the USD 26.50 settings audition. Visible amount/reason text, stop feedback and close/reopen resets were checked. These observations establish browser actions and text/state feedback, not independent confirmation of natural pronunciation or absence of residual audio in physical headphones. [Detailed public sound notes](SOUND_DESIGN.md). The broader checklist below remains a guide; unobserved tasks are not marked passed.

Record normal browser zoom and viewport: **1440×900, 1024×768, 768×1024, 390×844**. At each size open both covers, navigate, inspect a long record, type in the AI form and preview a limit. Check no horizontal overflow, clipped primary controls, overlapping nodes or input hidden by a fixed control bar. A desktop emulated phone viewport is not a physical touch test.

Also test quarter/half-page drags and cancellation, rapid previous/next, first/last page, form selection and volume dragging, category changes, empty days, cross-month pages and continuation pages. Use keyboard-only operation, Esc, visible focus and 200% text. Force an image failure: facts and controls should remain usable with a clear fallback. Record any unsupported task.

With real headphones, identify all three status tones, listen to ten consecutive nodes, test volume extremes and stop controls. Compare twenty monetary scripts with written amounts, and actually listen to at least five USD/CNY/decimal/zero/blue-plus-red examples. Flip, close, mute and switch source during speech. Only one audible main channel may remain. Mock callbacks do not prove comfort or pronunciation. Record actual voice name and browser; do not post-process a better voice into product footage.

For art, inspect both covers, three core date units, six category units, continuations and empty/cross-month pages. All reachable pages and the theme sampler must use the credited physical materials and separately labelled generated illustrations, with stable same-page composition and legible facts. Review the original asset pages, licenses and edits in [ASSET_SOURCES](ASSET_SOURCES.md); screenshots alone do not prove provenance. Human aesthetic approval remains distinct from a developer's source review.

## Release and judge-access checklist

- [x] Local source-package member hashes and offline run recorded; ZIP inventory verified.
- [x] New-directory server startup and synthetic save/restart recovery exercised without credentials.
- [ ] An independent user completes the browser tasks from the English README without assistance.
- [x] Current Sandbox application's Transaction Search access verified by a real 200 response.
- [x] Real eligible PayPal purchase returned and saved; 14:07 Beijing evidence matches the verified capture and passes domain evaluation.
- [x] Existing purchase displayed in the browser, reviewed with live AI and separate human controls, synchronized again and recovered after service restart without duplication; controlled G1 completed at 19:41–19:50 Beijing.
- [ ] Dedicated free AI/Sandbox test access privately delivered and actually tested, available through the PRD's judging-end date of 16 December 2026, 00:00 Beijing.
- [x] Public source tree matches the audited 103 files; anonymous raw-file download of the complete commit passed manifest checks, fresh-directory startup and save/restart recovery without credentials or previous data (12 November; [publication evidence](PUBLIC_VERIFICATION.md)). Ordinary Git clone and ZIP download did not complete because of network stalls/timeouts; the verified method was individual raw-file download. No secrets/private database/backups included.
- [ ] Actual under-three-minute English-translated video opens publicly and includes real system audio.
- [ ] Repository, video and testing links in the final submission are correct; submitted status is recorded.

The [formal rules](https://paypalaihackathon.devpost.com/rules), checked on 11 November 2026, remain the authority; see [judging access](JUDGING_ACCESS.md). No public host is required by this implementation plan; a future host would need multi-user isolation, authentication and quota controls first.

### Content illustration follow-up — 11 November

The earlier artwork iteration passed 131 tests (historical count). Five generated illustrations are matched to confirmed page content, with explicit blanks for unsupported or unknown records. Desktop date/category pages and a 390×844 browser viewport were checked; physical phone and comprehensive headphone/amount-reading tasks remain separate; later one-person tone feedback is recorded above. The imported USD 12 Sandbox purchase was visible after the local service restart, then still awaiting merchant/classification confirmation; the later G1 workflow above completed those checks. No new model request, payment or refund was executed in this visual review. See [Public verification summary — visual follow-up](PUBLIC_VERIFICATION.md) and [Public verification summary — test output](PUBLIC_VERIFICATION.md).
