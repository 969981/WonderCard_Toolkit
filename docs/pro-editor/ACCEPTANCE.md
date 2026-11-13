# 专业编辑器测试与验收门槛

继承 `docs/TEST_STRATEGY.md`。新增内容主要是 React/Tauri、HEX 联动及迁移兼容的测试要求。

## A. 最小自动化矩阵

| 测试层 | 工具建议 | 必须覆盖 |
|---|---|---|
| core 单元 | Vitest | detector、多候选、字段 codec、PatchSet、hash、JSON schema |
| Python 基线 | unittest/pytest（按现存依赖） | `wondercard/core.py` 已有用例、已知偏差 |
| Cross-runtime parity | golden fixtures | Python / Legacy JS / TS: 字段、warnings、HEX bytes、hash 差异 |
| React UI | Testing Library + Vitest | 表单 -> PatchSet -> Hex/DIFF/JSON 联动 |
| Browser E2E | Playwright | 拖放、筛选、四语言、Undo/Redo、只读 gate |
| Tauri Windows smoke | Windows runner + 构建检查 | 原生打开/另存、路径权限、离线启动、安装包生成 |
| Robustness | fuzz / mutation tests | 截断文件、非法长度、极端值、未知区、Unicode、恶意 JSON |

## B. 精确场景

1. **空操作往返**：对 L3+ 每个 fixture，`serialize(parse(raw), []) === raw`；SHA-256 完全相同。
2. **字段级 patch**：保存前检查 expectedOldBytes，修改只发生在声明区间及明确的校验派生字段，重解析与目标一致。
3. **原始字节不可变**：初始 `RawSnapshot.bytes` 不被 UI/worker 意外改动；避免 TypedArray 共享视图的隐式写入。
4. **Undo/Redo**：撤销到 0 patch 可导出原字节；redo 后输出与修改前副本一致；切换 tabs 不丢历史。
5. **WC6 日期 golden**：沿用 `docs/TEST_STRATEGY.md` 的 offset 0x4C 用例；只在确认参考字节及格式后允许编辑。
6. **Full gate**：未经 CRC/container 真实交叉验证的 Full 卡显示只读；不因 UI 新建而解除锁定。
7. **歧义 gate**：对相同长度但不同布局的候选必须输出多个格式及证据，默认不允许写。
8. **UI 联动**：选字段->选字节；选字节->字段或未知；修改->HEX diff->JSON patch->另存->重新打开值一致。
9. **保存保护**：确认默认另存到不同路径；拒绝没有选择的覆盖、无授权目录外写入；写出失败不能破坏源文件。
10. **离线测试**：断网后启动/导入/修改/导出/中文及其他语言切换均可；不依赖 CDN 图标、字体或 Monaco worker。
11. **i18n**：四语言键集合一致；变更 UI 语言不得修改 raw bytes。
12. **安全**：异常/超大文件、恶意 JSON/路径穿越、非法 UTF-16、非法 offset、重复/重叠 patch 不崩溃、不越权写文件。

## C. 兼容性报告格式

每次 PR 附 `tests/parity/report.json` 或等价报告：
- source_branch_commit, new_branch_commit, fixture_id, provenance, sha256
- format candidates + confidence/reasons
- parsed field values + offset/size/codec
- before/after hex region and declared diff
- old/new result (equal / known divergence / blocked) + why
- test commands, runner OS, pass/fail count

真实配信样本、个人存档、账号/密钥不得未经许可加入公开仓库；合成样本应注明不可视为官方配信。

## D. Release gate

`v0.4-alpha` 必须：P0-P3 关键任务完成；`pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build`、Windows Tauri smoke 全绿；E2E 核心路径可复现；已知不支持格式明确只读；有操作文档和 changelog。未完成的能力应在支持矩阵中显示，而不是隐藏测试失败。
