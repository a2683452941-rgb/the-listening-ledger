# v0.4 美术素材与制作记录

更新日期：2026-11-11。本次加入 **5 张 AI 生成主题插画**，原有 **18 份 CC0 实物来源 WebP** 保留，后者在 2026-11-10 完成来源核验，共 2,145,424 字节，约 2.05 MiB。两组来源和权利说明分开记录，不能把新增 AI 插画写成 CC0 馆藏作品。

用户于 2026-11-11 明确允许按每天内容使用 AI 插画。五张图由 OpenAI 内置 `image_gen` 预先生成，水粉／彩铅效果属于视觉风格，不代表真人手绘或扫描作品。提示词仅使用虚构示例的消费主题，没有发送账户、金额、交易编号或私人财务记录；[完整提示词](../public/assets/illustration-prompts.json)也通过应用的 `/assets/illustration-prompts.json` 公开。

全部文件的来源类型、输出尺寸、字节数、SHA-256 与用途保存在 [完整素材台账](../public/assets/asset-manifest.json)。生成图另记工具、生成日期、提示词文件与 `rightsNote`；这些是为本项目生成的资产，不声称独占权利、真人作者身份或第三方权利已获全面审查。实物来源项另记原条目、原作者／机构、实物介质、原图与许可 URL、核验 API 及裁切坐标。仅实物来源项沿用 `verified-public-domain-and-physical-medium` 与 [CC0 许可说明](../public/assets/LICENSE-CC0.txt)。

## 生成插画与消费内容

| 插画文件（不含 .png） | 首批示例内容 | 画面主题 |
|---|---|---|
| daily-coffee-lunch | 11 月 1 日，咖啡与午餐 | 咖啡杯、简餐与餐巾 |
| daily-study | 11 月 2 日，学习课程 | 笔记本、书与铅笔 |
| daily-stationery | 11 月 3 日，纸品商店 | 文具、信封与纸袋 |
| daily-meal | 11 月 4 日，餐馆消费 | 餐食与餐具；同日不明商户不凭空配图 |
| daily-yarn | 11 月 5 日，绒线商店 | 毛线与编织材料 |

图片表达已知消费主题，不是商品实拍、实际菜单、购买清单或发生地点的证据。书页按当前已确认类别和有依据的商户主题在本地选图；换到其他日期可复用匹配主题，不能匹配或未确认的内容留白。**不是每次翻页实时调用图像模型，也不是每个日期都拥有单独生成的新图。** 分类或核对结果变化后，选图随当前内容更新；金额、预算状态与风险判断不由图片决定。

## 保留实物素材的来源核验

这组原图来自实物摄影、摄影测量色彩图和馆藏实物艺术品数字图。本项目完成素材选择、普通裁切压缩、排版与代码；没有声称原素材由我们拍摄、扫描、手作或得到机构背书。

- **The Met**：[Open Access 图像政策](https://www.metmuseum.org/policies/image-resources)。每项官方 Collection API 均返回 `isPublicDomain: true`，对应实物介质和 `primaryImage` 已核对；没有仅依据年代推断许可。图片可按 CC0 使用。原作者未识别时保留“Artist not identified”，不编造摄影师姓名。
- **ambientCG**：[许可说明](https://docs.ambientcg.com/license/)允许 CC0 图像修改及原文件分发。[CardboardSet001](https://ambientcg.com/view?id=CardboardSet001) 与 [LeafSet024](https://ambientcg.com/view?id=LeafSet024) 条目均标 Surface Photogrammetry，官方 API `creationMethod` 为 `PBRPhotogrammetry`。只使用真实 Color 和原有 Opacity 图，没有用程序 PBR 图冒充照片。供应方署名对照[官方信息](https://docs.ambientcg.com/legal/)。
- 这 18 张实物来源图像沿用 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)，不统一改成项目代码的许可证，也不将其许可套用到新增生成图。机构标志没有用于产品品牌。

## 保留文件与实物对应

下表文件均在 `public/assets/art/`。同一来源拆出的多个裁片分别有独立台账与输出哈希。用途栏记录初版装帧用途，部分装饰已退出当前书页但文件和来源记录仍保留；不表示每个文件仍在页面中显示。

| 文件（不含 .webp） | 原始条目 | 原作者／来源 | 实物与用途 |
|---|---|---|---|
| paper-warm | [Winter Landscape, 54428](https://www.metmuseum.org/art/collection/search/54428) | Katsushika Hokusai / The Met | 木版画空白纸部的摄影裁片；日期底纸 |
| paper-cool | [Sketchbook, 14962](https://www.metmuseum.org/art/collection/search/14962) | John Quincy Adams Ward / The Met | 速写册装帧空白部摄影裁片；类别底纸 |
| fabric-gold | [Textile with Floral Pattern, 39726](https://www.metmuseum.org/art/collection/search/39726) | 作者未载明 / The Met | 丝及金属线织物；日期封面 |
| marbled-board | [Normandy Sketchbook, 747568](https://www.metmuseum.org/art/collection/search/747568) | Eugène Delacroix / The Met | 时期原装速写册封面；类别封面 |
| winter-print | [Winter Landscape, 54428](https://www.metmuseum.org/art/collection/search/54428) | Katsushika Hokusai / The Met | 墨和彩色木版画；12月场景 |
| winter-drawing | [Winter Landscape, 370464](https://www.metmuseum.org/art/collection/search/370464) | Jan van Goyen / The Met | 黑粉笔与灰水墨实物画；12月交替布局 |
| tea-porcelain | [Tea cup, 191577](https://www.metmuseum.org/art/collection/search/191577) | Worcester factory / The Met | 软质瓷实物照片；餐饮 |
| station-photo | [Toulon, 285453](https://www.metmuseum.org/art/collection/search/285453) | Edouard Baldus / The Met | 玻璃底片蛋白银盐照片；交通 |
| theater-drawing | [Theater Design, 388093](https://www.metmuseum.org/art/collection/search/388093) | Anonymous, French, 18th century / The Met | 纸上剧场设计绘图；娱乐 |
| floral-print | [Wallpaper design, 384893](https://www.metmuseum.org/art/collection/search/384893) | Jules-Edmond-Charles Lachaise / The Met | 水粉纸本植物纹样设计；日期拼贴 |
| ornament-drawing | [Ornamental Panel, 364291](https://www.metmuseum.org/art/collection/search/364291) | Anonymous, British, 18th century / The Met | 纸本笔墨枝叶设计；教育边注 |
| sketchbook-board | [Sketchbook, 14962](https://www.metmuseum.org/art/collection/search/14962) | John Quincy Adams Ward / The Met | 实物速写册装帧照片；教育与档案 |
| cardboard-fold | [CardboardSet001](https://ambientcg.com/a/CardboardSet001) | ambientCG / Lennart Demes | 纸板与胶带摄影测量色彩图；购物与日期 |
| cardboard-torn | [CardboardSet001](https://ambientcg.com/a/CardboardSet001) | ambientCG / Lennart Demes | 真实撕边纸板裁片；日期纵向布局 |
| cardboard-tape | [CardboardSet001](https://ambientcg.com/a/CardboardSet001) | ambientCG / Lennart Demes | 真实胶带纸板裁片；双口袋布局 |
| cardboard-blank | [CardboardSet001](https://ambientcg.com/a/CardboardSet001) | ambientCG / Lennart Demes | 无字纸板裁片；未分类与档案封面 |
| leaf-whole | [LeafSet024](https://ambientcg.com/a/LeafSet024) | ambientCG / Lennart Demes | 真实叶片色彩图和原透明遮罩；日期 |
| leaf-fragment | [LeafSet024](https://ambientcg.com/a/LeafSet024) | ambientCG / Lennart Demes | 真实有缺损叶缘的叶片；日期 |

## 实物素材的处理与当前构图范围

这 18 张实物来源图下载后使用 Pillow 普通坐标裁切、原遮罩应用、等比 Lanczos 缩小、WebP quality 85 压缩。没有对它们扩画、内容生成、替换作品内容或假造票据／商户凭证。纸张来源是实物作品的空白部，而非宣称自行扫描纸张。新增五张插画则是独立生成的 PNG，处理方式以台账为准。

当前仍有两本书、日期页与分类页，纸面使用浅色遮罩降低原纹理强度，保留轻微书脊阴影。主图改成内容匹配的主题插画及有明确类别对应的实物素材，去掉只按日期轮换的无关纸板与花纹。日期版式存在轻微间距、边线与构图变化，分类书使用独立的冷色纸面和索引式排版。空白日期保持留白，不虚构当天场景。

交通与娱乐等有明确类别依据时仍可用已有历史摄影／绘图表达主题；它们不代表用户到过画中的车站或观看过特定演出。未知商户、未分类或没有适合素材的内容不能通过随意配图伪装成已确认事实。

实物素材原始 API 响应、下载和处理脚本存于不公开的 `_history/art-research`；静态服务及发布包需要图片、manifest、提示词记录、许可说明与本台账。没有 Cookie、密钥或下载令牌。未采用仅标 Approximation 的纸纹候选，避免把未证实的来源写成实物摄影。

图像完整性测试不等同于浏览器视觉验收。正常缩放、连续翻页、移动裁切及实际设备结果，应在最终验收记录中单独报告。

## English: provenance and production

Updated **November 11, 2026**. The working source contains **five pre-generated AI illustrations** plus **18 retained CC0 WebP derivatives** from 12 physical-source items. The physical-source set was verified on November 10 and totals 2,145,424 bytes (approximately 2.05 MiB). AI assets are separately identified as `sourceKind: generated`; they are not CC0 museum works. Generation tool, date, exact prompts and rights notes are recorded in the [manifest](../public/assets/asset-manifest.json) and [prompt file](../public/assets/illustration-prompts.json).

The AI images depict coffee/lunch, studying, stationery, a meal and yarn, corresponding to the five example spending days. No private financial records were sent to image generation. These are symbolic illustrations, not photographs or proof of actual products. The app matches existing images locally to confirmed categories and supported merchant themes, reuses appropriate themes for other dates, and leaves uncertain or unsupported content unillustrated. **There is no runtime image generation on page turns and no claim that every date has its own newly generated artwork.** Gouache/pencil styling is not a claim of human authorship or hand-painted originals.

| Source | Physical medium and verification | License and item-level references |
|---|---|---|
| The Metropolitan Museum of Art | Digitized physical works: woven silk, sketchbook bindings, porcelain, prints, drawings and an albumen photograph. Each official object record returned `isPublicDomain: true`; the recorded medium and `primaryImage` were checked. | CC0 under the [Met Open Access policy](https://www.metmuseum.org/policies/image-resources). The item links and original authors are listed above and individually in the [asset manifest](../public/assets/asset-manifest.json). |
| ambientCG | [CardboardSet001](https://ambientcg.com/view?id=CardboardSet001) and [LeafSet024](https://ambientcg.com/view?id=LeafSet024) are physical-surface photogrammetry assets. Only their photographic Color maps and supplied Opacity masks were used. | CC0 under the [ambientCG license](https://docs.ambientcg.com/license/). Each item page identifies Surface Photogrammetry; its API identifies `PBRPhotogrammetry`. |

Processing of the physical-source set consists of ordinary pixel-coordinate cropping, applying the supplied opacity masks, proportional Lanczos resizing and WebP compression at quality 85. Exact crop coordinates, output sizes, byte counts and SHA-256 hashes are preserved per file. The warm paper is a crop from the blank paper area of a digitized print; the cool paper is a crop from a photographed sketchbook binding. They are not described as paper photographed or scanned by this project. The five generated illustrations are separate PNG assets, with their own production records.

The project contributes art direction, selection, layout and interactive code. External artwork and photography remain credited to their documented creators and institutions. Only the physical-source derivatives retain the documented CC0 terms; these terms do not extend to the generated images. Generated assets are not presented as exclusive rights, human authorship or comprehensive third-party clearance. No affiliation or institutional endorsement is claimed.

Two covers and separate date/category layouts use this collection. Content-aware selection replaces the earlier date-only rotation of unrelated decorative pieces; unknown or empty entries do not acquire invented scenes. Historical station/theatre images may remain thematic choices for confirmed matching categories. No image proves the user's actual purchases, location, weather, journey or event attendance. Amounts, statuses and controls remain live text and interactive elements outside the images.

Earlier v0.4 art test counts concern the previous physical-only arrangement. The generated-asset update needs separate integrity, content-selection and browser evidence; consult the latest acceptance record rather than treating the earlier test counts as validation of the new art. Automated checks do not replace layout, device or subjective art review.
