# WonderCard Toolkit

> 全世代 Pokémon 配信档案馆、无损解析器与可视化编辑工作台（规划阶段）。

本项目目标是研究、查看、检索、批量审计和**安全修改**历代 Mystery Gift / Wonder Card / 配信事件资源。本分支已包含可离线运行的 **WonderCard Studio v0.3 前端代码与 i18n**（见 [web/README.md](web/README.md)）；已引入 WC6/WC7 的 Python 核心模块。其他世代、PCD/PGF/BCAT 和完整 CLI 仍需按 Issues 实施，请勿把“规划格式”理解为“已支持编辑”。

## 核心原则

1. **原始字节是唯一权威**：不做编辑时导出必须与源文件逐字节一致，SHA-256 相同。
2. **识别与读写分级**：检测 / 只读 / 无损回写 / 字段修改 / 校验后写入 / 游戏验证分别标记，绝不以“可打开”代替“可编辑”。
3. **一代一格式适配器**：不将 WC6 字段偏移直接套用到 WC7/8/9、PGF/PGT、PCD 或 BCAT。
4. **未知与保留字段不动**：不静默清零、补齐、规范化，也不覆盖原始文件。
5. **研究与合法性判断分离**：模板结构通过校验不等于官方事件或宝可梦合法性得到证明。

## 现在就能运行的前端

直接打开 [web/standalone.html](web/standalone.html)，或者下载仓库后运行 `web/index.html`。**无需联网，不需安装 Python**。首批支持 zh-CN、zh-TW、en、ja 四种界面语言；可拖入 WC6/WC7 及 Full，查看、修改基础字段、HEX DIFF、导出 JSON/审计 CSV。Full 修改后安全写回尚未验证，因此禁用该操作。公共仓库内置的是合成演示卡，不是官方配信档案。

```bash
node scripts/check_locales.js
python scripts/build_standalone.py
```

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

## v0.4 — Nine UI locales + safe archive viewer (PR pending)

WonderCard Studio has **nine UI languages**: 简体中文, 繁體中文, English, 日本語, Français, Deutsch, Italiano, Español, 한국어. Language changes are display-only and never change Wonder Card bytes.

**Gen6/7 WC6/WC7 remains the only template field editor.** PGT, PCD/WC4, PGF, WC5Full, PL6, WB7/WR7, WC8/WB8/WA8, WC9/WA9 (plus named aliases) now have **read-only** import, HEX inspection, lossless JSON and original binary export by extension + byte length. **No Gen4/5/8/9 field editor or checksum verification is claimed.** See [archive support notes](docs/ARCHIVE_READONLY.md) and [i18n](docs/I18N.md).

The built-in demonstration is synthetic and not an official event card. The original imported file is never overwritten. Modified WC6Full/WC7Full export is blocked in the browser until the checksum rules are verified against real samples.

Development branches are not automatically merged. Run `node scripts/check_locales.js`, `python -m unittest discover -s tests -p test_editor_synthetic.py`, `python -m unittest discover -s tests -p test_readonly_formats.py`, and `python scripts/build_standalone.py` to reproduce the checks.
