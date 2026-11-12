# 听账手记 · The Listening Ledger：路演与录屏材料

核验日期：2026-11-12（北京时间）。目标成片：**2 分 40 秒**。本文件是可执行的录制材料，**不是已录制的视频，也不是提交成功证明**。配套字幕为 [DEMO_SUBTITLES_EN.srt](DEMO_SUBTITLES_EN.srt)。最终字幕必须跟随真实录音调整时间。

## 1. 先用一句话讲清主题

**中文：** 听账手记是一款本地消费核对工具：把已授权的 PayPal 沙箱购买记录变成可以翻阅、听取状态、逐笔核对的手账；AI 帮助理解用途，用户决定分类、是否认识这笔消费以及预算。

**English:** The Listening Ledger is a local spending-review journal. It turns purchases from an authorized PayPal Sandbox account into a book you can explore through sound and touch. AI helps interpret purchase descriptions; the user controls categories, recognition and limits.

目标用户是愿意核对自己的消费、但不喜欢密集列表阅读的人。**这是当前设计假设，尚无规模化用户研究证明。** 本次演示只证明一个受控测试账户的可运行流程，不宣称改善理财能力、识别诈骗或适用于所有 PayPal 账户。

## 2. 参考了哪些往届材料，以及没有核实什么

### 核实结果

没有找到足以确认“同名 PayPal AI Hackathon 往届获奖项目”的官方证据。本届规则的获奖公布时间仍在 2026 年 12 月。下面引用的是**另一个赛事：PayPal Dev Days 2025 Hackathon**，不能写成此次比赛的上一届。

| 已核实的项目／材料 | 官方依据与可打开的入口 | 可以支持什么 |
|---|---|---|
| CrawlerPal，2025 Dev Days 第一名 | [PayPal 官方获奖公告](https://developer.paypal.com/community/blog/winners-dev-days-hackathon/) | 官方将其描述为使用 PayPal API 的 AI 付费墙助手，确认了获奖身份。 |
| Codebusters，2025 Dev Days 第二名 | 同一 [PayPal 公告](https://developer.paypal.com/community/blog/winners-dev-days-hackathon/)；[Shopware 团队复盘](https://www.shopware.com/en/news/shopware-at-paypal-dev-days-2025/) | Shopware 的实际问题是商品较多页面上的支付按钮表现；项目升级了 PayPal 集成。团队复盘说明视频含现场演示。 |
| 官方路演／开场入口 | [Hackathon Awards · Opening](https://www.youtube.com/watch?v=cb-AnEcld_M) | 由 PayPal 获奖公告直接链接，公告将该入口关联到现场短演示。 |
| 获奖团队的现场视频入口 | [Shopware／PayPal Dev Days 视频](https://www.youtube.com/watch?v=pMxmvYl8IvE) | URL 来自 Shopware 上述官方复盘内嵌视频。 |
| 颁奖视频 | [Hackathon Awards Ceremony](https://www.youtube.com/watch?v=v0JKxyZZe2g) | 由 PayPal 公告直接链接；颁奖不能代替产品演示。 |

**观看限制：** 本次读到了主办方和获奖团队的正式介绍，定位了视频链接；YouTube 文本页未提供字幕，浏览器打开超时，另一个视频请求被限流。没有完成逐帧观看或字幕核验，因此不编造“某分钟展示什么”、逐字台词、镜头时长或“他们因此获奖”的因果结论。也不把三个链接说成三个已逐一看完的获奖产品路演。

### 对我们的具体启发（以下是产品表达判断，不是视频观察结论）

- CrawlerPal 的官方介绍能用一件任务说明 PayPal 与 AI 的关联。我们也应围绕**一笔 USD 12 购买怎样被理解、核对和保留**讲述，避免罗列页面。
- Codebusters 的团队复盘从一个具体使用障碍出发，说明更改了哪一步。我们应让评委直接听出三种状态，并看见“AI 建议分类”和“用户认识交易”是两个动作。
- 我们有鲜明的书体和声音，但演示的中心仍是核对任务。片头不花 30 秒放品牌动画，真实操作尽早出现。
- 不复制获奖项目画面、背景音乐或旁白；参考任务表达方式，不把别人的素材放进自己的参赛片。

## 3. 本届硬性要求对录制的影响

截至核验日，正式规则要求 PayPal 与 AI 的实际集成、可运行作品、公开开源仓库；本地完整运行说明可替代公开部署。演示应少于 3 分钟，包含设备上实际运行画面，上传为 YouTube 公开可见视频。提交材料须为英文或提供英文翻译；评审期间须免费可测试。**截止：2026-11-13 04:00 北京时间，即 11 月 12 日 12:00 PST。** [正式规则](https://paypalaihackathon.devpost.com/rules)

官方五项评审维度为技术实现、设计、潜在影响、创新、呈现，权重相同。我们分别用来源与核对流程、真实书体与声音、具体使用场景、听觉与逐笔核对结合、清楚的操作链来回应；这不是获奖概率预测。[官网](https://paypalaihackathon.devpost.com/)、[规则](https://paypalaihackathon.devpost.com/rules)

Resources 的消费体验示例包含交易分类与预算工具；不要求每个作品都自动付款，也不要求为了工具奖添加无关服务。[官方资源](https://paypalaihackathon.devpost.com/resources)

## 4. 这次录什么：选择已验证的状态，保留真实来源

使用现有 **USD 12.00 Sandbox 购买记录**，无需再付款。核对证据见 [PUBLIC_VERIFICATION.md](PUBLIC_VERIFICATION.md)。现在这笔记录已经完成“真实 DeepSeek 建议 → 采纳教育分类 → 单独确认认识消费 → 再次同步 → 重启恢复”。

录制时显示的是**已保存的真实模型分析和人工历史**。加上 `Saved live-model review · confirmed earlier` 字幕；旁白用过去时。不要删除历史让它看似第一次发生，不要剪成“刚点击就返回”的假实时响应。

这笔测试购买的用途说明确实是：

> 这笔是沙箱测试购买的虚拟学习笔记本，用于整理课程笔记和学习资料；不涉及真实商品发货。

相应英文翻译：

> This was a Sandbox test purchase of a virtual study notebook for organizing course notes and learning materials. No physical goods were shipped.

若画面里的模型引用只截取这句话的一部分，就只翻译所引用的部分。保留中文原文，不把译文冒充原始证据。

**两种资料不能混剪：** 开头书体与三音型可使用带有“示例数据”标记的练习书；切入真实导入时明确显示 `PayPal Sandbox · no real money`。USD 12 的“真实”是确实发生过的沙箱 API 操作，不是真实资金消费。

## 5. 2:40 分镜、怎么讲、实际做什么

旁白建议自己读，平静、清楚，约每分钟 125–140 个英文词。每句只强调一件事。音型与设备朗读期间不讲话，不加背景音乐。下表英文可直接录音；中文说明帮助理解与排练。

| 时间 | 实际画面与操作 | 中文讲述意图 | English narration |
|---|---|---|---|
| 00:00–00:13 | 从真实首页的日期手记封面开始。开启声音，点击开始，显示实际翻开和地图延伸。角标 `Synthetic example`。 | 先说谁遇到什么困难，再出现产品；不要先讲技术栈。 | A transaction list shows what I spent. It does not make me want to review it. The Listening Ledger turns that review into a book I can open and explore. |
| 00:13–00:24 | 打开“声音图例”，三个含义与形状保持可见，暂不连续播放。 | 听觉表达的是待办状态，不是消费好坏。 | Each purchase has a short sound. Green means within the applicable limits. Red needs attention. Blue means there is still something to check. |
| 00:24–00:33 | 依次点绿、红、蓝试听，每种约 1.25 秒，中间留约 1 秒；实际声音必须录入。 | 这是记忆点，让评委真正听到区别。 | **No narration.** Capture the actual warm chord, wooden taps and glass tones. |
| 00:33–00:47 | “账本来源”切到 PayPal 沙箱。展示导入概要、范围和 USD；不展开私人账户或完整交易 ID。打开现有 USD 12 记录。 | 证明支付数据不是手写示例；也把沙箱边界说清。 | Now I switch to PayPal Sandbox. This authorized test account contains a twelve-dollar purchase. The importer preserves its amount, currency and source, while excluding non-purchase events. No real money moves. |
| 00:47–01:01 | 展示本笔保存的用途、生成信息与输入版本。角标 `Saved live-model review · confirmed earlier`。 | 用户补充用途是模型理解的依据。 | This purchase was a virtual study notebook used for testing. I supplied that context. Here is the saved review from an actual DeepSeek request, with the original input still visible. |
| 01:01–01:18 | 显示保存的教育建议和具体引用；再展开“原始信息与核对历史”。保持原始分类和核对后分类可辨。 | 强调AI解决了含糊文字理解，用户可以核查依据。 | The model suggested Education and quoted the words supporting that suggestion. It did not decide whether I recognized the purchase. I accepted the category, then separately confirmed that I knew this transaction. |
| 01:18–01:30 | 指向两条历史记录与当前绿色状态；不要再次点保存。 | 两次人工动作分别留痕，原金额未改。 | These are two recorded human decisions. The original twelve-dollar amount stays unchanged. The journal keeps the source information and my review separately, so I can revisit both. |
| 01:30–01:45 | 关闭详情，打开“朗读设置”，点“试听这段文字”。实际设备读出咖啡18元和另一笔26.50美元。字幕注明 `Voice-setting sample · not the imported purchase`。 | 让评委听到当前实际设备声音，不能用旁白替换应用声音。 | **No narration.** Add the English translation of the actual device reading; see below. |
| 01:45–02:04 | 停止试听、关闭设置；“我的限额”显示已保存的 USD 25 月限额。将总限额改为10，点预览，看本笔进入关注；**取消**，保留25。不点保存。 | 限额由用户决定；预览给出具体后果，模型不判断该不该消费。 | My budget is a rule I set, not a judgment from AI. Changing the monthly limit from twenty-five dollars to ten previews an alert. I cancel the change. The original budget remains. |
| 02:04–02:18 | 返回书封面，打开生活图鉴。选教育页，同一笔 USD 12；展示一次真正翻页。 | 第二本书不是第二份账；体现不同组织和美术。 | I can also open the Spending Collection. It groups the same records by category, with a different page design. The purchase and my saved decision remain the same. |
| 02:18–02:31 | 刷新页面，回到同一来源和记录，再展开两条历史。若当前测试环境不能自动回到原页，使用目录定位，保留真实操作。 | 给出保存与恢复证据，不用重复付款。 | Reopening restores the review. Repeat synchronization and restart recovery were also verified. This is a working local prototype, tested with one controlled Sandbox account. |
| 02:31–02:40 | 停在真实书页和简洁结尾卡；显示实际公开仓库 URL、`Run locally — see README`、技术和素材出处入口。 | 用明确收益收尾，给评委测试路径。 | Listen for a signal. Inspect the evidence. Make the decision yourself. The Listening Ledger: a spending review you can hear and revisit. |

### 设备朗读段的英文字幕

当前源码的“朗读设置”试听文本为：

> 松果咖啡，十八元。这笔没有触发你设置的超额提醒。另一笔是二十六美元五十美分，分类还需要你核对。

配套 SRT 已放入以下英文翻译，不作为旁白朗读：

> Pinecone Coffee: eighteen yuan. This did not trigger your overspending alert. Another purchase is twenty-six dollars and fifty cents. Its category still needs review.

这是声音设置中的固定例句，**不是 PayPal 导入的第二笔消费**。画面与字幕须保留 `Voice-setting sample`。若设备播放太慢，给它更多时间，压缩下一段停顿；若改成朗读其他账单，应重写字幕，不能沿用本例。设备读音异常时保留真实听感，不把剪辑软件配音冒充产品能力。

### 如果预算预览或模型画面与脚本不相符

先以实际状态为准。若覆盖范围不足，画面可能同时给出覆盖提示，必须保留并翻译；不要为了得到绿色而改变记录或省略限制。若本地找不到该次保存的 AI 结果，先用原本受控实例打开历史；没有结果就不能把文字截图贴上去。必要时录制一次明确标识的新请求，保留同意、实际等待与返回结果，并据实改写旁白，但无需新付款。

## 6. 关键中文界面的英文覆盖字幕

SRT 包含旁白与试听句子；它不会自动翻译整块界面。剪辑时为当前操作加短英文注释或放大字幕，保持中文原文可见。以下是本片需要的最小覆盖：

| 原界面 | 英文覆盖 |
|---|---|
| 日期手记／生活图鉴 | Daily Journal / Spending Collection |
| 示例数据／AI练习副本 | Synthetic example / AI practice copy |
| PayPal沙箱／USD | PayPal Sandbox · USD · No real money |
| 预算内／需要关注／待核对 | Within limits / Needs attention / Needs review |
| 帮我弄清这笔／补一句用途 | Help me understand this purchase / Add the purpose |
| 教育／未分类 | Education / Uncategorized |
| 生成信息与输入版本 | Generation details and input version |
| 采纳AI建议／人工确认 | Accepted AI suggestion / Manual recognition |
| 我认识这笔消费 | I recognize this purchase |
| 原始信息与核对历史 | Source information and review history |
| 我的限额／预览／取消 | My limits / Preview / Cancel |
| 朗读设置／试听这段文字 | Reading voice settings / Play sample |
| 保存的模型结果 | Saved live-model review · confirmed earlier |

模型解释、提醒原因、覆盖范围和错误若出现额外内容，要另行翻译实际文字；不要用一条泛化英文旁白代替所有关键结果的翻译。

## 7. 录制操作：最短可靠流程

1. **选择实例。** 使用当前已保存核对结果的本地实例。不要把已压缩给队友的无数据源码包直接当成原实例；干净包不会包含私有数据库和现有核对历史。
2. **固定画面。** 建议桌面浏览器正常100%缩放，录应用窗口或裁切后的固定区域，1920×1080、30fps即可。先关通知、聊天、密码管理器弹窗和其他标签页。
3. **先录10秒测试。** 用已批准的三音型音量与同一副耳机。录屏软件开启系统声音；回放确认实际录到，而非只录了麦克风。系统声音与旁白最好分轨。
4. **声音验收单独做完。** 听三音型、18元和26.50美元；播放时分别测试翻页、静音、关闭详情是否停止旧声音。记录你真正听到的结果。用户已经认可三音型辨识度与最终响度，不代表其他动作已经完成人耳验收。
5. **录真实操作素材。** 按表分成“开书与三音型”“USD12来源和历史”“声音试听”“限额预览”“换书与恢复”五段。停顿允许剪短，不改变动作先后或数据来源。
6. **录旁白并合成。** 英文读不顺可用中文讲、配完整英文字幕；若使用提供的英文旁白，建议短句分段录。保留01:30–01:45的设备声，不叠旁白或音乐。
7. **导入 SRT。** 这是按2:40设计的时间轴，须对齐实际口述和操作。如果保留真实等待但剪短，角标 `Waiting time shortened`。缓存、规则生成、历史结果用对应标签。
8. **导出后看完整一遍。** 确认最终文件而非编辑器时间线小于3分钟。所有关键文字可读，三音型清楚，设备样句没有被切断；最后一帧没有占位链接。

不需要大量动画、背景音乐、人物抠像或代码滚动。保留真实翻页与地图生长即可；避免用急促转场掩盖产品实际行为。

## 8. 录屏隐私与准确性检查

- 永远不录 `.env`、`.env.judging`、Sandbox应用密钥、OAuth token、评委专用 Key、密码或完整账户资料。
- PayPal来源说明可以展示，但私人商户／邮箱、完整交易与账户ID、浏览器自动填充不要露出；打开历史前先确认没有私人字段。若原页面暴露私人名称，要同时处理字幕和设备朗读中的名称，不能只给画面打码。
- 这次不需要打开 Sandbox 登录页、创建订单、付款或退款。购买联调助手不是账本的主界面。
- 暖和弦／木敲／玻璃铃来自应用的 Web Audio。朗读来自设备／浏览器语音，**不是DeepSeek语音合成**。
- 目前预生成的主题插画按已确认内容本地匹配，不是每次翻页实时出图；也不是购买商品的真实照片。素材来源见 [ASSET_SOURCES.md](ASSET_SOURCES.md)、[THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。
- 不声称“自动发现坏商户”“完整读取所有账户”“证明每笔交易安全”“节省了多少时间”。这些未被本次验证。
- 不把旧版 ReturnChoice 的退款能力、UseRights 的版权能力写进新项目介绍。

## 9. YouTube 标题、简介与提交前检查

建议标题：

**The Listening Ledger — Hear, Review, and Understand Your Spending | PayPal AI Hackathon**

英文简介已填入本轮核实的公开仓库与文档链接；视频发布前按实际录制结果检查文字。公开操作指南不等于私密评审配置已交付，后者仍需安排：

```text
The Listening Ledger is a local spending-review journal with page turns, status sounds, transparent AI suggestions, and user-controlled limits.

This demo uses labelled synthetic examples and an existing USD 12.00 PayPal Sandbox purchase. No real money moves. The AI review shown is a saved result from an actual DeepSeek request; its human confirmations are presented as history, not a new live call.

PayPal: authorized Sandbox Transaction Search, purchase filtering, source and coverage preservation, repeat-sync recovery.
AI: purpose interpretation with quoted evidence. People confirm categories and recognition; program rules calculate budget status.
Sound: application-generated tones and actual device speech. The voice-setting sample is separate from the imported transaction.

Source and local run instructions: https://github.com/a2683452941-rgb/the-listening-ledger
Public testing guide (private live-service configuration handoff still pending): https://github.com/a2683452941-rgb/the-listening-ledger/blob/main/docs/JUDGING_ACCESS.md
Asset credits and generation disclosures: https://github.com/a2683452941-rgb/the-listening-ledger/blob/main/docs/ASSET_SOURCES.md
Third-party software credits: https://github.com/a2683452941-rgb/the-listening-ledger/blob/main/THIRD_PARTY_NOTICES.md

Current scope: one local user and a controlled Sandbox account. No live-funds access, fraud detection, or measured user-outcome claims.
```

使用本届规则要求的 **Public／公开** 可见性；不要凭经验把“私人”或“未列出”当成已满足要求。上传后用未登录浏览器验证声音、字幕和链接可访问。[规则](https://paypalaihackathon.devpost.com/rules)

最后记录：视频URL、最终时长、版本或提交hash、公开播放检查日期。再到Devpost填写团队、介绍、仓库、视频与测试方式，实际完成提交并确认成功状态；保存草稿不等于参赛提交。

## 10. English production and truthfulness summary

Use the existing controlled USD 12.00 Sandbox purchase. Show its saved actual-model suggestion and two earlier human decisions as history. Do not reset the purchase, invent a live response, or make another payment for this recording. Clearly label every switch between synthetic data, the Sandbox book and the voice-setting sample. Capture actual page turns, Web Audio status tones and device speech; narration must not replace the application's voice. Translate all task-relevant Chinese UI, evidence, warnings and spoken examples. The accompanying SRT follows the planned 2:40 sequence and needs final timing checks against the exported video.

The historical reference is the separate PayPal Dev Days 2025 event, not a verified previous edition of this contest. Official winner announcements and video links were verified; full video playback/transcripts were unavailable. The proposed pitch structure is our own product-specific interpretation, not a claimed shot-by-shot analysis of those videos.

Before publishing, replace placeholders with verified links, check privacy, confirm the final duration is below three minutes, upload publicly to YouTube and test logged-out playback. Keep credentials in the private judging channel; never add them to the repository or video. This kit does not certify that recording, publication or Devpost submission has happened.
