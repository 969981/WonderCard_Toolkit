# 全世代事件文件 / 配信容器支持矩阵

**注意**：下表是目标覆盖清单，不代表仓库当前已实现。状态以每个 format adapter 的测试报告为准。每一行需记录：extensions、size candidates、detect_rule、game_scope、gift_kinds、read/roundtrip/edit/repack/game_verified、test_fixture、reference_commit。

| 分组 | 游戏/来源 | 文件或容器 | 目标 | 特殊注意 |
|---|---|---|---|---|
| Gen 1–2 | RBY / GSC、历史活动 | 活动记录、实体文件、外部档案 | 索引/元信息，只读研究 | 没有通用现代 WC 卡片；不把 .pk1/.pk2 当原卡 |
| Gen 3 | RSE / FRLG | 原始 Mystery Gift/事件卡、e-Reader、Event Script、Wonder News、配信存档块 | 分容器只读→经过验证后编辑 | 版本/地区/脚本/校验不同；PK3 是领取实体 |
| Gen 4 | DPPt / HGSS | .pgt / .pcd / .wc4（Gallery 兼容形式） | 解析、JSON、字段编辑与转换 | Gallery 的 .wc4 是由 PCD 转换的档案形式；转换可能影响实体表示 |
| Gen 5 | BW / B2W2 | .pgf / .wc5full | 解析、完整卡片头、审计、编辑 | full 包装与核心单卡分开处理 |
| Gen 6 | XY / ORAS | .wc6 / .wc6full / .pl6 | 主力读写；PL6 研究 | Full 包装与 CRC，日期与第七世代不一样 |
| Gen 7 3DS | SM / USUM | .wc7 / .wc7full | 主力读写 | 语言限制、接收状态、日期、随机生成规则 |
| Gen 7 Switch | LGPE | .wb7 / .wb7full（别名） / .wr7 | 读写并审计 | WR7 独立格式；别名要尊重实际长度 |
| Gen 8 | Sword / Shield | .wc8 / .wc8full（别名）、BCAT | 读写 + BCAT 只读索引 | 按真实结构判定，有些文件扩展名是同一底层布局 |
| Gen 8 | BDSP | .wb8、BCAT | 读写 + 外层提取 | 不能复用 WC8 偏移 |
| Gen 8 | Legends: Arceus | .wa8、BCAT | 读写 + 外层提取 | 不能复用 WB8 偏移 |
| Gen 9 | Scarlet / Violet | .wc9、BCAT | 读写 + 外层提取 | 与 WA 系列可能等长，必须结构识别 |
| Gen 9 | Legends: Z-A | .wa9、对应配信容器 | 读写 + 外层提取 | 依 PKHeX WA9 独立类，明确验证日期与 checksum |
| 特殊 | Raid / Mass Outbreak / 其他配信更新 | BCAT/event blobs、数据块 | Catalog/HEX/审计，独立子系统 | 不等于 Pokemon Wonder Card；不可按卡片字段误读 |

## 格式探测策略
1. 读取扩展名和尺寸，并计算 SHA-256；不依赖扩展名作为唯一依据。
2. 在可识别结构中验证签名、版本、保留位、字段范围、header、checksum 等；返回若干候选 + 置信度证据。
3. 同尺寸格式（例如某些 Gen 8/9）必须追加结构探针。仍不确定则进入“未知/候选”只读模式。
4. Gallery 文件有混合扩展名；内部保存 original_name, source_path, exact_hash, detected_format。
5. 对 Full、包裹格式及 BCAT 解析“内部卡片 + 外部容器”的二级对象模型。

## 支持能力等级
- L0 Indexed：只提取来源、大小、Hash、路径；
- L1 Recognized：可靠识别容器/格式，原始 HEX 只读；
- L2 Decoded：语义字段可读、批量审计；
- L3 Lossless：原样解包/JSON/再输出逐字节相同；
- L4 Editable：白名单字段可编辑、差异可解释、重新解析成功；
- L5 Verified：校验与重封装经真实样本/参考实现/目标游戏复核。

**Gate**：新格式未达到 L3 不允许 UI 标“支持导出编辑后文件”；Full/BCAT 未达到 L5 不允许承诺目标游戏可使用。未获验证的格式以 HEX 和元信息浏览为主。

## 源码索引
- PKHeX： https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/MysteryGifts
- 目前可见类：PGT, PCD, PGF, WC5Full, WC6, WC6Full, PL6, WC7, WC7Full, WB7, WR7, WC8, WB8, WA8, WC9, WA9；PKHeX MysteryGift.GetMysteryGift 有扩展名/长度分流。
- EventsGallery： https://github.com/projectpokemon/EventsGallery ，Released / Unreleased 均含 Gen 1–Gen 9。
- 特殊说明：EventsGallery README 明确记录 .wc4 由 PCD 转换；Gen 8/9 还涉及 BCAT 与 raid/outbreak 事件，不应与 WCx 卡片等同。
