# WonderCard Studio 页面与交互设计 v1

## 信息架构
目标：Windows-first 研究者工作台，简体中文优先、可切 English；整体风格参考 Tabler 文件管理布局，字段分组参考 PKHeX。不是复刻或使用 PKHeX 商标/UI 素材。

### 主导航
1. **卡片库** / Library：多文件拖放，目录导入，搜索、筛选、批量操作和目录扫描。
2. **配信编辑器** / Editor：卡片预览、分组字段、HEX/DIFF、警告、撤销重做。
3. **差异工作台** / Compare：两文件或同文件基线/当前，十六进制、字段与 JSON 三种差异。
4. **批量审计** / Audit：来源/格式识别、状态、异常、差异、CSV/JSON 报告及 Dry Run。
5. **事件档案馆** / Gallery：EventsGallery Released/Unreleased 本地索引、搜索匹配、出处链接、按 hash 对照。
6. **格式研究** / Formats：适配器覆盖矩阵、证据、原始字段表、unknown 字节和测试状态。
7. **设置** / Settings：主题、语言、导出策略、安全开关、索引目录、更新检查（默认关闭）。

## 页面一：卡片库（P0）
```text
┌ 菜单 / 项目名 ─── 导入文件 · 导入目录 · 运行审计 ─── [浅/深] ┐
│ 侧栏          │ 筛选：世代 ▾ 游戏 ▾ 语言 ▾ 类型 ▾ 状态 ▾ 搜索│
│ 卡片库  ●     ├─────────────────────────────────────────────┤
│ 配信编辑器    │ [精灵缩略图] 标题 / Event / Card ID / 日期   │
│ 差异工作台    │ [..] ...                                     │
│ 批量审计      │ 支持等级 L2/L4、来源、异常警告、SHA 前缀      │
│ 事件档案馆    │                                             │
│ 格式研究      │ 底栏：载入 38 / 格式未明 2 / 已修改 3         │
└───────────────┴─────────────────────────────────────────────┘
```
拖拽多个文件/目录：显示总文件数、成功数、冲突/不识别数；不会覆盖原文件。选择卡片打开编辑器，双击与 Enter 等效；多选批量导出、审计。

## 页面二：编辑器（优先开发）
```text
┌ 阿尔宙斯 / 0081 XYORAS / wc6 / 来源：本地 / [未修改] ┐
│ [保存为] [导出JSON] [撤销] [重做] [比较原始] [校验]  │
├──────────────────────┬─────────────────┬──────────────┤
│ 卡片预览              │ 字段表单        │ HEX / DIFF   │
│ 官方标题/原文          │ 概览             │ offset  bytes│
│ 世代·语言·卡号         │ 配信/领取        │ 旧值 vs 新值│
│ 宝可梦精灵/道具        │ Pokémon / 道具  │ 字段交叉跳转│
│ 来源/限制/日期         │ OT / ID / PID    │ 变更数 / SHA │
│ 来源档案馆对照         │ IV / EV / 技能   │ 不明字节提示│
│                       │ 版本/语言限制   │              │
└──────────────────────┴─────────────────┴──────────────┘
```
- 字段右侧显示类型、有效范围、字节偏移、长度、来源、写入能力 L0–L5。
- 编辑前显示原值，编辑后高亮变化；HEX 高亮自动跟随字段；点 HEX 自动定位字段。
- PID/shiny、IV sentinel、性格/特性、版别、语言、礼物类型各用具备“原始数值”切换的选择器。
- 日期提供 ISO 日期选择器 + raw 数值视图；保存时**不**根据当前电脑日期静默改原卡日期。
- **未验证字段**只读或“专家 RAW 模式”，在导出前明确显示差异；未知字段可看 HEX。
- 导出校验若失败，保留原始文件和内存修改，显示具体阻止原因（如 Full checksum 未验证）。

## 页面三：差异对比
三种视角：字段差异、HEX 双栏、原始 JSON Patch；支持同格式不同文件、原始 vs 已编辑。定位字段 -> HEX offset/size 双向联动。可复制差异 Markdown/CSV；默认不把两个不同格式的偏移当成同字段。

## 页面四：批量审计
表格列：世代、格式、游戏、CardID、Title、OT、PID 规则、IV 规则、日期、语言、来源、CRC/Checksum、roundtrip、状态、警告级别。可检索筛选并导出 CSV/JSON。批量日期等编辑先“预演修改数/受影响字节”，再逐个保存；任何失败不会破坏其他源文件。

## 页面五：Gallery
支持按 Released / Unreleased、Gen、游戏/地区/语言、CardID、标题、OT/Species、配信周期、hash 检索；两个视图：本地文件和 Gallery 标准样本。必须区分“字节一致”、“元数据相近”、“无法核实”，不可说“官方合法已证实”。Gallery 不随安装包自动全量打包。

## 交互规范
- Windows 拖放、文件/目录选择、Ctrl+O、Ctrl+S（另存）、Ctrl+Z/Y、Ctrl+F、Ctrl+Shift+D（diff）；无网络依赖。
- 深色/浅色：主题 token（canvas/surface/surface-hover/text/muted/border/primary/warning/danger/diff-added），禁止组件内硬编码对比度不足的颜色。
- 宽屏三栏；窗口小于 1100px 右栏收为抽屉；小于 750px 切上下页签。字号≥13px，键盘焦点可见。
- 中文用语：配信卡 / 领取状态 / 发放规则 / 原始偏移 / 无损 / 未验证；“闪光”作为 PID 规则而非保证宝可梦合法性。
- 危险操作：专家 RAW 编辑，批量修改，改容器，自动修 CRC——都要求独立确认且不能默认开启。

## 组件与接口
FileDropZone、FormatFilter、CardListRow、CardPreview、FieldGroup、FieldEditor、RawValuePopover、HexViewport、DiffPanel、DiagnosticList、CapabilityChip、GalleryMatchPanel、ExportDialog、AuditGrid、ThemeSwitcher。前端值绑定到 schema 的 field_id 和 patch API，**禁止只改 UI state 而不更新导出 bytes**。

## 分期交付
P0：文件库 + 编辑器 + HEX/DIFF + JSON + CSV + 深浅主题，接通真实读写；
P1：Gallery & 批量审计 + 筛选；
P2：Formats 研究视图 + 专家 RAW 模式 + 容器编辑；
P3：Windows 包装、国际化、无障碍验收。
