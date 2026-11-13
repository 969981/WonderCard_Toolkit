# Pro Editor 实际开发状态（2026-11-13）

分支：`feature/pro-editor-shadcn-tauri`，基于 `feature/studio-v0.3-i18n`。本记录用于区别**已提交**、**CI 已验收**和**尚未验证**，不将规划当作实现。

## 已实际提交

- `apps/studio/`：React/TypeScript/Vite 8、Tailwind 4、shadcn/ui 风格自有按钮组件、深浅主题。
- `apps/studio/src/lib/wondercard.ts`：原始字节副本、格式探测候选、WC6/WC7 少量数值与日期字段、只读 Full、Copy-on-write history、Undo/Redo、ByteDiff、保守导出门禁。
- `apps/studio/src/App.tsx`：多文件导入、搜索、属性面板、HEX 字节和字段双向定位、差异展示、另存为、合成演示卡。
- `apps/studio/src/components/JsonPane.tsx`：本地 Monaco JSON **只读预览**，Vite Worker 使用 Monaco 0.57 导出子路径，禁止 CDN 加载。
- `apps/studio/src-tauri/`：Tauri 2 Rust 桌面壳、Dialog/FS 受限文件操作、基础 CSP、NSIS 打包配置。
- `tests/test_legacy_core.py` 和 `wondercard.test.ts`：Python 旧版测试、TS 单元测试；均采用合成数据，未声明实卡合法性。

## 真实 CI 结果

- **旧版 baseline：通过**。包括 Python `unittest`、四语 i18n 键检查及旧版 standalone 构建。
- **新版 TypeScript 类型检查：通过**。
- **新版 Vitest：通过**（原始快照不变、date/level 字节差异、Undo/Redo、Full 与歧义写锁）。
- **新版 Vite production build：通过**。此前 Monaco worker 路径错误已经修复；证据见 [Pro Editor checks #43346556664](https://github.com/969981/WonderCard_Toolkit/actions/runs/43346556664)。
- **Windows Tauri 2 / NSIS 自动构建：通过**。[Pro Editor checks #43346556664](https://github.com/969981/WonderCard_Toolkit/actions/runs/43346556664) 的 `windows-bundle` job 成功，上传了 artifact `wondercard-pro-editor-windows-alpha`（约 5.1 MB，artifact ID 14001713456）。这只证明 Windows 构建和上传成功，**不等于手动启动/文件权限/实际保存操作都已验收**。

## 未完成 / 不能宣称

| 任务 | 状态 | 下一关口 |
|---|---|---|
| PE-001 旧版兼容基线 | 部分 | UI 截图与 Python/JS 真值检查 |
| PE-002 shared parity fixtures | 部分 | 跨 JS/Python/TS 字段和 SHA 对照报告 |
| PE-003 React/UI 工程 | 首个代码和生产构建通过 | 更多组件及界面交互测试 |
| PE-004 Tauri Windows | NSIS CI 构建通过 | Windows 实机启动、文件权限和存储流程 smoke |
| PE-005 PatchSet & FormatRegistry | 原型实现 | 独立共享包及 schema 与校验策略 |
| PE-006 WC6/WC7 | 合成样本通过 | 授权实卡、PKHeX 字段/byte parity |
| PE-007 Undo/Redo | 基础实现 | UI E2E，跨文件/异常操作 |
| PE-008/009 文件库与字段编辑 | 基础实现 | 多窗口/文件/键盘可访问性 |
| PE-010 HEX | 可视化 16-byte 行 | 虚拟滚动、独立 HEX 修改与完整 field mapping |
| PE-011 Diff/Monaco | ByteDiff + JSON 预览 | Monaco Diff、经过验证的 JSON 反向导入 |
| PE-012 Save As | 实验性实现 | 原子写盘、磁盘故障回滚、真实 Windows IO |
| PE-013 i18n | 旧版四语完整，新版尚未迁移 | 四语新 UI 字段/快捷键 |
| PE-014 Windows CI | Web+NSIS CI 构建通过，artifact 已上传 | 实际运行/文件打开保存的 E2E 启动检查 |
| PE-015+ 全世代/批量/Gallery | 未开始 | 按 L0–L5 格式矩阵逐个开放 |

## 原则

不合并 PR、不删旧版。Full CRC 未验证不能编辑，单卡修改输出目前仅研究用途。不联网、不捆绑 EventsGallery 原卡。禁止“可在 UI 填值”被误写成“经游戏验证可用”。初始保存不是事务性原子写入，因此不要对珍贵源文件做唯一备份。

- [开发草稿 PR #19](https://github.com/969981/WonderCard_Toolkit/pull/19)
- [总任务 Issue #17](https://github.com/969981/WonderCard_Toolkit/issues/17)
