# Pro Editor 开发任务板

状态：**拟执行；以下不是已完成的功能**。按依赖排序，避免一次性铺开空代码。与既有 Issue #2–#14（全格式和旧工作台通用任务）并行，不替代其语义。

| ID | 优先级 | 任务 | 依赖 | 主要交付/完成定义 |
|---|---|---|---|---|
| PE-001 | P0 | 旧版 v0.3 基线审计 | 无 | web/Python 接口、快照、可复现命令及已知缺陷清单 |
| PE-002 | P0 | 完整 fixture manifest & parity harness | 001 | 合成 WC6/WC7/Full、原始 SHA、字段/byte diff 对照 |
| PE-003 | P0 | React+TS+Vite / Tailwind+shadcn 工程 | 001 | 可启动、可测试的 UI shell，不破坏旧版 |
| PE-004 | P0 | Tauri 2 Windows 桌面骨架 | 003 | 本地窗口、dialog/fs 权限、离线 smoke |
| PE-005 | P0 | RawSnapshot / PatchSet / FormatRegistry API | 002 | 单一 source-of-truth、capability gate、可测核心 |
| PE-006 | P0 | WC6/WC7 适配器 parity | 005 | L3/L4 逐字段测试；保留未知字节 |
| PE-007 | P0 | DocumentSession/Undo/Redo | 005,003 | tabs 隔离、patch 历史与脏状态可回退 |
| PE-008 | P0 | 多文件列表/导入/文件标签 | 003,004 | 搜索、拖拽、关闭告警、只读状态 |
| PE-009 | P0 | GiftInspector/字段表单 | 006,007 | 类型化字段、原始值、能力提示；无假编辑 |
| PE-010 | P0 | VirtualHexGrid/双向定位 | 005,007 | 16-byte 行虚拟滚动、offset->field 和反向定位 |
| PE-011 | P0 | Field/Byte Diff + Monaco JSON | 007,010 | diff 独立由 PatchSet 派生；Monaco Worker 离线 |
| PE-012 | P0 | Save As / 安全写入/重解析 | 004,006,011 | 源文件保留、先校验后写、默认不覆盖 |
| PE-013 | P0 | 四语言 i18n/主题/快捷键 | 003,009,011 | zh-CN/zh-TW/en/ja 键同步，语言不改 raw |
| PE-014 | P1 | UI E2E/Windows CI/发行预览 | 008-013 | 核心路径回归、Windows 包构建、离线启动 |
| PE-015 | P1 | 批量审计/CSV/JSON/Dry Run | 012,014 | 单文件失败隔离、预演后导出 |
| PE-016 | P2 | Gallery 本地索引/来源证据 | 015 | 离线索引、license/provenance、无自动下载 |
| PE-017 | P2 | Full CRC + 容器安全门禁闭合 | 002,006 | 每个 Full 变体按真实样本单独开启 L4/L5 |
| PE-018 | P2 | Gen4/5/8/9/BCAT 等独立格式 | 005,014 | 按 Format Matrix 分 issue 推进 L0-L5 |

## 第一批建议 PR 切片

1. `PR-A (PE-001/002)`：当前 JS/Python 基线与 golden fixtures，不包含 UI 大改。
2. `PR-B (PE-003/004)`：React/Tauri Shell、Tailwind/shadcn、Windows smoke、四语言占位路由；旧目录保持不动。
3. `PR-C (PE-005/006)`：新 core + WC6/WC7 parity 门禁；任何不一致输出差异报告。
4. `PR-D (PE-007..011)`：属性检查器、HEX、JSON、Diff 状态联动。
5. `PR-E (PE-012..014)`：安全保存、i18n、CI、Alpha 交付。

## 任务模板（创建 Issue / PR 时）

- **目标**：用户可观察的能力，而非“添加依赖”本身
- **影响格式**：格式 ID、长度、支持 L0-L5、是否可写
- **实现范围**：模块、数据契约、行为改变、兼容性影响
- **证据**：合成/获授权 fixture，hash、offset、上游 reference 与许可证
- **验收命令**：lint/typecheck/test/build/windows smoke
- **边界**：未知/Full/歧义时如何阻止写入，未完成内容
- **迁移记录**：原版功能是否仍可使用、是否改变字节输出

## 当前禁止事项

不要删除 `web/` 旧版；不要把 `wondercard/core.py` 简单翻译后就声称完全一致；不要用 Monaco 文本视图替代二进制 HEX 组件；不要在缺少真实 CRC/字节交叉验证时解锁 Full 写入；不要让 UI 对象模型直接覆盖原始 buffer。
