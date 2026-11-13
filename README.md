# WonderCard Toolkit

> 全世代 Pokémon 配信档案馆、无损解析器与可视化编辑工作台（规划阶段）。

本项目目标是研究、查看、检索、批量审计和**安全修改**历代 Mystery Gift / Wonder Card / 配信事件资源。当前仓库正在初始化；此前聊天中的 v0.2 Python + 离线 HTML 原型尚未导入本仓库，请勿把规划项视为已实现功能。

## 核心原则

1. **原始字节是唯一权威**：不做编辑时导出必须与源文件逐字节一致，SHA-256 相同。
2. **识别与读写分级**：检测 / 只读 / 无损回写 / 字段修改 / 校验后写入 / 游戏验证分别标记，绝不以“可打开”代替“可编辑”。
3. **一代一格式适配器**：不将 WC6 字段偏移直接套用到 WC7/8/9、PGF/PGT、PCD 或 BCAT。
4. **未知与保留字段不动**：不静默清零、补齐、规范化，也不覆盖原始文件。
5. **研究与合法性判断分离**：模板结构通过校验不等于官方事件或宝可梦合法性得到证明。

## 计划功能

- 多文件/文件夹拖放；按世代、游戏、语言、类别、配信标题、日期、Card ID 筛选；
- 宝可梦 / 道具 / 特殊礼物分型可视化表单，PID、IV、OT、技能、日期与版本条件；
- HEX 双视图、字段偏移定位、实时 DIFF、撤销/重做、无损 JSON、批量 CSV；
- EventsGallery 本地索引与出处比对；另设 BCAT 与第三世代事件容器研究路径；
- Windows 离线桌面版 + 可独立使用的 CLI/核心库；中文/英文与深浅主题。

## 设计与协作

- [AI/贡献者开发规则](AGENTS.md)
- [总体架构](docs/ARCHITECTURE.md)
- [全格式支持矩阵](docs/FORMAT_MATRIX.md)
- [页面、组件与交互设计](docs/UI_UX.md)
- [分期路线图与任务拆解](docs/ROADMAP.md)
- [测试和验收标准](docs/TEST_STRATEGY.md)
- [参考来源、版本和许可注意事项](docs/REFERENCES.md)

## 上游研究资料

- [PKHeX MysteryGifts](https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/MysteryGifts) — 解析行为与字段语义参考（PKHeX 使用 GPLv3；不得直接复制实现而忽视许可）。
- [Project Pokémon EventsGallery](https://github.com/projectpokemon/EventsGallery) — Released / Unreleased、Gen 1–9 配信档案索引；**不默认打包或重新分发整个档案库**。

> 此仓库中的文档是开发规格，不代表已实现全部功能。每项能力以真实样本和自动化回归测试为验收依据。
