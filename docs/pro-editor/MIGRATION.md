# v0.3 → Pro Editor 渐进式迁移计划

## 基线

已存在：`web/index.html`、`web/standalone.html`、`web/app.js`、`web/i18n.js`、`wondercard/core.py` 与相关构建脚本。已声明能力包括 WC6/WC7/Full 读取、非 Full 基础字段编辑、HEX/DIFF、JSON、CSV、四语言；**实际能力需由测试复核，不以 README 的声明替代验收**。

技术切换仅影响新工作台；`web/` 旧版可继续单独使用。

## 阶段与退出条件

### P0 — 基线核查与冻结
- 锁定来源分支 SHA 与所有旧版入口/预览截图/本地启动方法。
- 收集合成 fixtures、Python/JS 核心对照输出，保存 `sha256 / 格式 / 字段 / warning / byte diff`。
- 建兼容矩阵：WC6/WC7/Full 的识别、日期、编码、未知区、JSON。
- 退出：v0.3 在 CI 或本地复现，确定迁移前可比较的参考结果。

### P1 — 工程骨架与原生窗口
- 在 `apps/studio` 生成 Vite+React+TS；安装 Tailwind+shadcn/ui（选定组件底层）、路由/工作区框架。
- 初始化 Tauri 2；注册 Dialog、fs 最小权限和调试配置；修复 Windows WebView2 与 Monaco workers 兼容。
- 退出：`pnpm dev`、`pnpm tauri dev`、`pnpm build` 与 Windows 安装包 smoke；离线关闭网络仍能启动。
- 完成 P1 之前不动旧版 `web/` 和 Python 核心。

### P2 — 二进制核心与兼容门禁
- 移入或重写格式探测/快照/PatchSet/字段 schema，优先 WC6/WC7（非 Full）；Python 与 JS 旧实现都当对照而非权威规范。
- 浏览器与桌面共享 `packages/core`; 源码层只有一处可写入实现。
- 退出：合成 + 授权样本中未编辑 roundtrip 完全一致，单字段修改 offset 局限、hash 与旧实现交叉验证。

### P3 — 专业 UI / JSON / HEX
- FileLibrary、FileTabs、FieldInspector、HexViewport、FieldDiff、Monaco JSON Editor。
- 接入 DocumentSession 单一 PatchSet、Undo/Redo、i18n、主题、快捷键、保存前确认。
- 退出：真实打开 → 改字段 → HEX 定位 → Diff → 撤销 → 另存 → 重解析完整流程自动通过。

### P4 — 安全与批量工作流
- 错误隔离、读写权限、危险操作门禁、批量审计/CSV/JSON、Dry Run、崩溃恢复。
- 退出：损坏/未知/Full 输入不会进行未验证写出；错误不影响其他文件。

### P5 — 公测发行 / 扩世代
- GitHub Actions build/lint/test + Windows EXE/安装包；更新日志与操作文档。
- 分别按 `docs/FORMAT_MATRIX.md` 实施 Gen4/5/8/9 和 BCAT；每新增格式必须通过本地测试矩阵，能力等级独立记录。
- 退出：v0.4 Alpha 通过全部门禁后才打包；Full 写能力不作为 Alpha 阻塞项（继续锁定）。

## 重要架构分岔

A. 默认走 **TypeScript 核心直接读写 WC**：跨 UI/浏览器/Tauri 重用、无需运行 Python。
B. 如果验证出跨语言移植成本高，允许 Tauri/Rust 临时调用可信包装的 Python 外部进程作为开发期对照；**不得把系统 Python 作为用户运行安装包的硬依赖**。最终版要么打包并审计所有运行时资源，要么完成核心迁移。
C. 对复杂的容器/压缩/加密优先谨慎只读研究，不能靠猜测改出可导入文件。

## 迁移回退

- 旧 `web/` 运行入口与 Python 文件保持原状，直到新工作台发布并经用户确认废弃。
- 每个里程碑都可 revert 独立 PR；未通过 golden parity 不覆盖当前发布下载链接。
- 禁止一次性重构所有世代、同时换 UI 和 binary 格式规则；拆小 PR，保留可观察差异日志。
