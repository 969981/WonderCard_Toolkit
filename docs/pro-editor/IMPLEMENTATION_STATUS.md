# WonderCard Pro Editor 开发状态（2026-11-13，第二轮）

分支：`feature/pro-editor-shadcn-tauri`；草稿 [PR #19](https://github.com/969981/WonderCard_Toolkit/pull/19)。本文件**区分已编写、已在 CI 验证与仍待实机验证**，不以计划表示已实现。

## 已实现并接入 React UI

- `apps/studio/src/lib/json.ts`：无损 JSON v2，包含完整 raw_hex、source_sha256、baseline_fields、fields、byte patches；支持导出、重新导入及将 JSON 字段修改应用到打开的卡片。JSON 原始字节、SHA、基线字段及补丁不一致时拒绝应用。SHA 是完整性校验，不是官方来源签名。
- `apps/studio/src/lib/wondercard.ts`：WC6/WC7 合成用例中受限字段修改、Undo/Redo、HEX 字节写入白名单、无效日期阻断；Full 与未知/歧义格式继续只读。
- `apps/studio/src/components/HexPane.tsx`：双击可编辑已验证写入区的单字节（十六进制两位）。无任意未知字节 RAW 模式；不支持多字节批量选择/大型数据虚拟化。
- `apps/studio/src/components/JsonPane.tsx`：本地 Monaco JSON v2 文本编辑视图与“应用 JSON 修改”入口。编辑后必须通过 JSON 基线及字段校验，不能直接覆盖原始 buffer。
- `apps/studio/src/lib/storage.ts` + `src-tauri/src/native_io.rs`：Windows 桌面使用 Rust 原生 Open/Save 对话框，返回源字节；在 Rust 中执行不覆盖式 Save As。JavaScript 文件写权限已从 Tauri capabilities 移除；浏览器仍用下载方式导出。
- `src-tauri/src/atomic.rs`：同目录 `create_new` 临时文件、写入同步、`hard_link` 原子不覆盖发布、读回字节校验；若文件系统不支持硬链接则安全拒绝。它保护原件，但目录元数据持久化为尽力执行，断电安全不能夸大成完整事务。
- `apps/studio/src/i18n.ts`：78 个主要 UI、字段及提示键，简中/繁中/英文/日文各一套；语言切换不改变文件字节。常见安全校验错误已本地化；极少数第三方/系统原始诊断仍可能显示英文。
- `web/` v0.3 与 `wondercard/core.py` 旧版保持原状。

## 自动化测试证据

- Python 生成 `WC6 / WC7 / WC6Full / WC7Full` 的合成黄金字节及 SHA-256：`scripts/generate_parity_vectors.py`。
- TypeScript 逐字段、逐字节、修改后 hash 与 Python 对照：`apps/studio/src/lib/parity.test.ts`。
- JSON v2 读写、HASH 篡改/补丁造假、Full 只读：`apps/studio/src/lib/json.test.ts`。
- HEX 仅允许白名单字段与非法日期保护；新旧 Undo/Redo：`apps/studio/src/lib/wondercard.test.ts`。
- 四语言 key 与动态占位符测试：`apps/studio/src/i18n.test.ts`。
- **已确认 CI：23 个 Vitest 测试通过、TypeScript typecheck 通过、Vite production build 通过**，见 [Pro Editor run #43355656454](https://github.com/969981/WonderCard_Toolkit/actions/runs/43355656454)。
- **Windows Edge 浏览器 E2E：已通过**。自动打开合成 WC6、修改并下载二进制、导出/重导入 JSON v2、切换四语言、校验 Full 只读；证据 [#43357069598](https://github.com/969981/WonderCard_Toolkit/actions/runs/43357069598) 和 [#43357759029](https://github.com/969981/WonderCard_Toolkit/actions/runs/43357759029) 的 `windows-web-e2e` job。**这不是 Tauri 原生 Dialog/FS 交互测试。**
- **Tauri 原生 EXE 启动 canary：已通过**。此前 [run #43356012688](https://github.com/969981/WonderCard_Toolkit/actions/runs/43356012688) 的 `Windows native launch smoke` 阶段成功，Windows 上程序持续存活 6 秒；此项仅证明进程能够启动，不等于实际打开与保存成功。
- **Windows Tauri 2 NSIS 构建与安装包产物：已通过**，证据 [#43357069598](https://github.com/969981/WonderCard_Toolkit/actions/runs/43357069598)，artifact `wondercard-pro-editor-windows-alpha`，约 5.13 MB（artifact ID 14006841447）。后续语言诊断文案的 Windows 构建仍以对应最新 CI 结果为准。

## 未完成的重要关口

1. **Windows 原生 Dialog/FS 实际交互**：已验证 NSIS 安装版能够安装与启动（[#43359645845](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359645845)）；仍需要安装版窗口的打开/保存/取消/覆盖保护 GUI 操作证明。已添加 `scripts/windows_native_dialog_smoke.py` 的非阻断自动化尝试，不应把其存在当作通过。详见 [WINDOWS_SMOKE.md](WINDOWS_SMOKE.md)。
2. **真实文件与游戏复核**：目前 CI 只有 4 个合成跨语言向量；新增 [私有真实卡文件测试](PRIVATE_REAL_PARITY.md) 可本地逐字节核对 Python/TypeScript，但仓库无可授权真实样本，未在 CI 执行。Checksum/CRC、独立 PKHeX 与游戏端可用性依然待验收。
3. **JSON 多格式支持**：已覆盖当前 WC6/WC7 与 Full 原样往返，尚未实施 Gen4/5/8/9 的独立格式 adapter。
4. **HEX 专业高级功能**：多字节写入、未知区受控 RAW 专家模式、可撤销批量字节操作、虚拟化、完整字段区间映射仍未开发。
5. **四语收尾**：第三方异常堆栈、本地化辅助提示以及 Windows 原生对话框由 OS 决定的语言，仍需 UX 审核。
6. **文件事务保护**：Rust 已改用不覆盖式原子发布，旧版检查后写入竞态已消除。仍须验收断电/网络盘/不支持硬链接的卷；在进程异常终止时可能遗留 `.partial` 文件，但不会发布截断的目标文件。

## 安全和授权边界

- 原始 bytes 是权威：未编辑 bytes+SHA 一致；JSON 变更只通过已验证字段补丁；保存默认新路径。
- Full、未知和歧义格式未验证前保持只读，不承诺合法/官方来源。
- 无强制联网、无私人存档上传，无未经许可捆绑的配信文件。

## 第三轮 Windows 原生读写质量结果（独立门槛）

- **已通过**：Windows Rust 原生测试 8 项，涵盖不覆盖并发、别名保护、字节完整性、原生读取和文件大小限制（[#43359519944](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359519944)）。
- **已通过**：实际 NSIS 安装版安装及启动，之前的构建记录为 [#43359645845](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359645845)。
- **CI 测试中，未宣告通过**：自动操作安装版 Windows 原生 Open/Save 对话框、重新打开导出文件及人工检查；该图形自动化标为 `continue-on-error`，不能仅凭工作流绿色判断它通过。
- **未执行**：获授权的真实 WonderCard 数据与独立 PKHeX/目标游戏交叉验证；不得伪造验收记录。

参考 [安全写入实现细节](ATOMIC_SAVE.md)、[私有实卡测试](PRIVATE_REAL_PARITY.md)。
