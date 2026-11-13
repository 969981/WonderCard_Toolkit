# WonderCard Toolkit — 专业桌面编辑器方案

状态：**专业版工程已提交，持续开发中；真实发布和扩世代尚未完成**  
分支：`feature/pro-editor-shadcn-tauri`  
来源：`feature/studio-v0.3-i18n`（保留 `web/` 离线 v0.3、四语言 i18n、`wondercard/core.py` Python 核心）。

## 定位与范围

Windows-first、本地离线、以原始字节为权威的 Pokémon Mystery Gift/Wonder Card 研究与编辑器。面向研究者及工具使用者：文件库、结构化字段编辑、偏移联动 HEX、Diff、JSON、批量审计、来源检索。

这不是全世代格式已经可写的声明；不实现自动联网领取、对官方身份/合法性的无根据保证。支持能力延续 `docs/FORMAT_MATRIX.md` 中 L0-L5 独立标注。

## 技术定案

| 责任 | 选型 | 说明 |
|---|---|---|
| UI 状态与组件组合 | React + TypeScript | UI 不直接修改原始 buffer |
| 构建与本地预览 | Vite | SPA，静态离线发布 |
| 样式系统 | Tailwind CSS | 一个主题 token 来源 |
| 通用 UI 组件 | shadcn/ui | 组件源码归项目所有；不混用 Tabler 核心 CSS |
| JSON / 字段文本 Diff | Monaco Editor | 按需懒加载，仅限文本；不是专业 HEX 控件 |
| 专业 HEX 视图 | 自研 React 虚拟化组件 | offset / byte / ASCII / 字段区间 / old-new diff |
| 桌面容器与系统 API | Tauri 2 + Rust | Win EXE/MSI/NSIS；最小文件权限；不启动本地 HTTP 服务 |
| 二进制核心 | TypeScript 首选、必要时 Rust | 格式 adapter、不可变 snapshot、PatchSet、无损回写 |
| 既有基线 | `web/` + `wondercard/core.py` | 保留至新实现通过一致性验收，禁止提前删除 |

## 实施进度

- [当前实际实现状态和 CI 证据](IMPLEMENTATION_STATUS.md)
- [Draft PR #19](https://github.com/969981/WonderCard_Toolkit/pull/19)

## 文档地图

- [工程架构与数据契约](ARCHITECTURE.md)
- [桌面 UI/UX 设计规格](UX_SPEC.md)
- [迁移策略与版本路线图](MIGRATION.md)
- [任务拆解与依赖](BACKLOG.md)
- [验证与发布门槛](ACCEPTANCE.md)
- 继承 [仓库开发规则](../../AGENTS.md)、[全格式矩阵](../FORMAT_MATRIX.md)、[原始测试规则](../TEST_STRATEGY.md)。

## 范围控制 / 首个可用版本

`v0.4 Pro Editor Alpha`：Windows 端离线启动，文件/目录导入，WC6/WC7 非 Full 的 **仅限已验证字段** 编辑、原样回写、HEX 双向定位、Diff、Undo/Redo、无损 JSON、四种 UI 语言、另存为、基本自动化测试。

`WC6Full/WC7Full` 暂按现有门禁：可原样导出；修改后导出仅在对应真实样本、CRC/容器规则及重解析验证完成后开放。PGF/PCD/WC8/9/WA9/BCAT 按后续独立 adapter 递进，不抢跑写能力。

## 不可退让的验收标准

1. 未编辑文件导出：binary equals + SHA-256 相同，未知字节与容器元数据不被改写。
2. 已编辑文件：仅白名单字段及明确声明的派生 checksum 区域发生修改；重新解析值与输入相符。
3. 编辑状态从 PatchSet 派生；React、JSON、HEX、Diff、Save As 使用**同一个 snapshot/patch 源**。
4. Full 或探测歧义：拒绝有风险写入，不隐式升为“已支持”。
5. 兼容 v0.3 四语言（zh-CN、zh-TW、en、ja）；可回退至旧独立页面/解析结果。

## 关键官方参考

- [shadcn/ui + Vite](https://ui.shadcn.com/docs/installation/vite)
- [Tauri 2 Vite 集成](https://v2.tauri.app/start/frontend/vite/)
- [Tauri 2 Dialog](https://v2.tauri.app/plugin/dialog/)
- [Monaco 官方源码](https://github.com/microsoft/monaco-editor)
