# WonderCard Pro Editor 开发状态（2026-11-13，第二轮）

分支：`feature/pro-editor-shadcn-tauri`；草稿 [PR #19](https://github.com/969981/WonderCard_Toolkit/pull/19)。本文件**区分已编写、已在 CI 验证与仍待实机验证**，不以计划表示已实现。

## 已实现并接入 React UI

- `apps/studio/src/lib/json.ts`：无损 JSON v2，包含完整 raw_hex、source_sha256、baseline_fields、fields、byte patches；支持导出、重新导入及将 JSON 字段修改应用到打开的卡片。JSON 原始字节、SHA、基线字段及补丁不一致时拒绝应用。SHA 是完整性校验，不是官方来源签名。
- `apps/studio/src/lib/wondercard.ts`：WC6/WC7 合成用例中受限字段修改、Undo/Redo、HEX 字节写入白名单、无效日期阻断；Full 与未知/歧义格式继续只读。
- `apps/studio/src/components/HexPane.tsx`：双击可编辑已验证写入区的单字节（十六进制两位）。无任意未知字节 RAW 模式；不支持多字节批量选择/大型数据虚拟化。
- `apps/studio/src/components/JsonPane.tsx`：本地 Monaco JSON v2 文本编辑视图与“应用 JSON 修改”入口。编辑后必须通过 JSON 基线及字段校验，不能直接覆盖原始 buffer。
- `apps/studio/src/lib/storage.ts`：WC 与 JSON v2 文件选择/拖拽导入和另存为；取消保存不会报告成功；不覆盖现有文件。仍未实现生产级原子提交或崩溃回滚。
- `apps/studio/src/i18n.ts`：67 个主要 UI、字段及提示键，简中/繁中/英文/日文各一套；语言切换不改变文件字节。部分低层异常消息仍需完整本地化。
- `web/` v0.3 与 `wondercard/core.py` 旧版保持原状。

## 自动化测试证据

- Python 生成 `WC6 / WC7 / WC6Full / WC7Full` 的合成黄金字节及 SHA-256：`scripts/generate_parity_vectors.py`。
- TypeScript 逐字段、逐字节、修改后 hash 与 Python 对照：`apps/studio/src/lib/parity.test.ts`。
- JSON v2 读写、HASH 篡改/补丁造假、Full 只读：`apps/studio/src/lib/json.test.ts`。
- HEX 仅允许白名单字段与非法日期保护；新旧 Undo/Redo：`apps/studio/src/lib/wondercard.test.ts`。
- 四语言 key 与动态占位符测试：`apps/studio/src/i18n.test.ts`。
- **已确认 CI：23 个 Vitest 测试通过、TypeScript typecheck 通过、Vite production build 通过**，见 [Pro Editor run #43355656454](https://github.com/969981/WonderCard_Toolkit/actions/runs/43355656454)。
- Windows Edge 浏览器 E2E、Tauri EXE 启动 canary 代码已提交到 `scripts/windows_*_smoke.*`；**最新 Windows CI 运行中，尚不得标为通过**：[run #43356012688](https://github.com/969981/WonderCard_Toolkit/actions/runs/43356012688)。
- 历史 Windows Tauri 2 NSIS 构建曾成功并上传 installer artifact，证据 [#43346556664](https://github.com/969981/WonderCard_Toolkit/actions/runs/43346556664)。本次新增代码的 Windows 安装包要看最新 CI。

## 未完成的重要关口

1. **Windows 原生 Dialog/FS 实际交互**：安装后的 Windows 桌面打开文件、选择多个文件、Save As、原路径覆盖保护、取消操作、重启离线复测。不能仅依靠 Edge 浏览器测试；见 [WINDOWS_SMOKE.md](WINDOWS_SMOKE.md)。
2. **真实文件与游戏复核**：目前仅 4 个合成跨语言向量；真实配信的完整字段、Checksum/CRC、游戏端可用性均未完成验证。
3. **JSON 多格式支持**：已覆盖当前 WC6/WC7 与 Full 原样往返，尚未实施 Gen4/5/8/9 的独立格式 adapter。
4. **HEX 专业高级功能**：多字节写入、未知区受控 RAW 专家模式、可撤销批量字节操作、虚拟化、完整字段区间映射仍未开发。
5. **四语收尾**：部分错误堆栈/低层诊断消息、本地化辅助提示以及 Windows 原生对话框由 OS 决定的语言，仍需 UX 审核。
6. **文件事务保护**：当前写盘采用对话框返回路径后检查再写，目标路径被并发创建时存在 TOCTOU 风险；尚非原子保存与回滚。

## 安全和授权边界

- 原始 bytes 是权威：未编辑 bytes+SHA 一致；JSON 变更只通过已验证字段补丁；保存默认新路径。
- Full、未知和歧义格式未验证前保持只读，不承诺合法/官方来源。
- 无强制联网、无私人存档上传，无未经许可捆绑的配信文件。
