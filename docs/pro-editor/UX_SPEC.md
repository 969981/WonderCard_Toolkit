# WonderCard Pro Editor — 桌面交互与布局规格

## 目标人群与核心流程

核心流程：打开多个文件 → 确认格式与支持能力 → 浏览卡片元信息 → 修改已验证字段 → 双向定位字节 → 预览差异 → 校验 → 另存为 → 复核 SHA/报告。

桌面设计为**研究型工具工作台**，不是 CRM/后台仪表盘。主要编辑页应一屏完成 80% 操作，减少弹窗跳转。

## 工作区布局（≥ 1280px）

```text
┌ 顶栏: 文件 / 编辑 / 视图 / 工具 / 帮助     当前文件    语言/主题 ┐
├ 左侧资源导航(260) ┬ 中部字段编辑区(弹性) ┬ 右侧 HEX/Diff(420) ┤
│ 文件库及筛选       │ 文件标签/状态         │ Hex | Diff | JSON │
│ 已打开 / 未保存    │ Gift 概览/来源        │ offset hex ascii  │
│ WC6/WC7/Unknown    │ Pokémon/Item/Rules    │ 字段范围着色      │
│ 批量审计           │ 训练家/日期/语言       │ before / after    │
│ Gallery (后续)     │ 原始值/字节映射        │ 跳转到指定偏移    │
├───────────────────┴──────────────────────┴─────────────────┤
│ 状态栏: 格式/支持等级 L0-L5 · SHA 前缀 · 已改字节数 · 警告   │
└────────────────────────────────────────────────────────────┘
```

布局是建议尺寸：侧栏 240-320px，HEX 360-560px，可拖动、可折叠、记住窗口内布局。窗口较窄时 HEX 变为底部或抽屉；不强制三栏导致文字溢出。

## 组件/页面清单

| 模块 | v0.4 | 功能 |
|---|---|---|
| Shell / CommandBar | 必需 | 菜单、快捷键、工作区状态、主题语言 |
| FileLibrary | 必需 | 多选、拖放、筛选、模糊搜索、格式识别 |
| FileTabs | 必需 | 多文件标签、* 未保存、关闭前提示 |
| GiftSummary / Inspector | 必需 | Gift 类型分组、字段型编辑器、范围和原始值 |
| VirtualHexGrid | 必需 | offset / hex / ASCII，可定位字段和变化字节 |
| ByteDiff / FieldDiff | 必需 | old/new 变更，不把未知字段推断为语义变化 |
| JsonEditor (Monaco) | 必需 | View/Edit JSON Patch，schema 检查、导入失败回退 |
| Diagnostics | 必需 | 只读原因、校验错误、编码与 CRC 警告 |
| AuditGrid | 后期 | batch dry-run、逐文件报告、CSV / JSON 导出 |
| GalleryMatch | 后期 | 本地索引、released/unreleased、hash 出处 |

## 关键联动

- 点击属性 → 右侧 HEX 定位至对应 offset/length；点击 HEX → 高亮覆盖该字节的字段或明确显示未知区。
- 修改字段 → PatchSet 更新 → HEX Diff 实时重算 → 顶栏显示未保存；Undo/Redo 同步回退所有视图。
- 非白名单字段显式锁定并提示 L0-L5 能力与证据，而不是灰化后无说明。
- Full、ambiguous、损坏输入禁止修改输出；用户可查看原始 HEX/诊断、原样导出。
- JSON 视图显示 baseline + patches；仅验证结构、hash、旧字节通过后允许导入修改；失败绝不部分写入。
- 修改文件日期须是显式操作；不能因时区、系统时间或语言切换改变 raw bytes。

## 交互设计规范

- 中英日韩四语言：`zh-CN`/`zh-TW`/`en`/`ja` 继承 v0.3 键表，补充缺失键要同步四语。
- 深浅色主题统一设计 token（bg/surface/border/text/focus/diffAdd/diffRemove/warning/error），差异颜色需配图标或文本，不能只靠颜色区分。
- 命令：`Ctrl+O` 导入、`Ctrl+Shift+O` 导入目录、`Ctrl+S` 另存、`Ctrl+Z` 撤销、`Ctrl+Y` 或 `Ctrl+Shift+Z` 重做、`Ctrl+F` 搜索、`Ctrl+Shift+D` 差异视图、`Ctrl+G` HEX 偏移跳转。阻止 Monaco 自身快捷键与全局命令冲突。
- 可访问性：键盘 Tab 顺序、焦点可见、ARIA 标签、图标文字提示；至少 1280×720 桌面尺寸可用。
- 必须显示诊断等级：结构校验通过 ≠ 官方配信来源匹配 ≠ 游戏接受验证。
- 批量修改先执行 Dry Run，逐文件列出受影响字段/偏移/预计字节 diff，用户再确认导出到新目录。

## 视觉参考

以 shadcn/ui 的中性灰视觉和密集桌面属性检查器为主，不照搬 Tabler 后台模板；使用垂直分隔线、紧凑表单、可停靠面板。目标是专业工具感与稳定效率，而非大量统计卡或营销页面。
