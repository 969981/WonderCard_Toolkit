# Windows 11 实机验收手册 — WonderCard Pro Editor

**区分三类证据：**
1. GitHub Windows runner 编译出 NSIS 安装包：**构建验证**，不能替代运行。
2. Windows runner 执行 Edge Playwright 打开/修改/保存/JSON 往返：**浏览器同前端端到端**，不等于 Tauri Dialog/FS 插件验证。
3. 在真实 Windows 桌面运行 Tauri 安装版，对原生 Dialog/FS 进行打开/保存/崩溃恢复：**桌面实机验收**，完成前不得标记全部通过。

## 1. 安装与环境

- 使用 GitHub Actions [Pro Editor checks](https://github.com/969981/WonderCard_Toolkit/actions) 已完成的 Windows artifact `wondercard-pro-editor-windows-alpha`。
- Windows 10/11 x64，WebView2 可用，无管理员权限用户也能启动。
- 安装包当前未签名，测试前确认来自本仓库 GitHub Actions 的构建与 SHA；不要用官方活动卡的唯一副本。
- 离线情况下启动，确保不会强制请求 CDN 或外部服务器；检查旧版 `web/standalone.html` 仍可运行。

## 2. 原生文件 Dialog/FS（尚需人工验收）

准备合成 `*.wc6`、`*.wc7`、`*.wc6full`、`*.wc7full`；测试输入需自行备份。

| 步骤 | 输入/操作 | 正确行为 |
|---|---|---|
| W1 | 从程序的“打开文件”选择 WC6 | Windows 原生选择框正常关闭，界面识别格式并展示字段 |
| W2 | 同时选择多个 WC6/WC7 | 文件库正确增加多条记录，无路径权限错误 |
| W3 | 更改 WC6 的 Level 10→50 | HEX offset `0xD0` 变化 `0A→32`，Diff 仅出现一个字节 |
| W4 | 选择“另存为 WC”，新文件名 | 原文件 SHA 不变，目标文件内容正确且可重新打开 |
| W5 | 另存为原路径/已存在路径 | 明确阻止覆盖，文件内容和 SHA 均不变 |
| W6 | 取消保存对话框 | 不弹出“保存成功”，原文件不变 |
| W7 | 导出 JSON v2 并重新导入 | 字段与补丁还原，SHA 一致，未知字段完整 |
| W8 | 篡改 JSON 中 source_sha256/raw_hex/baseline | 阻止应用，文档和原文件保持不变 |
| W9 | 双击已允许字段的 HEX 字节，输入两位数 | 校验后修改并可 Undo/Redo；其他字节不可写 |
| W10 | 打开 Full、未知扩展、错误长度 | 只读，不允许修改字段或覆盖写出 |
| W11 | 切换简中、繁中、英文、日文 | 主界面切换，文件 SHA、当前字段值和修改历史不变 |
| W12 | 断网后重启程序并重复 W1–W4 | UI 与本地文件处理不依赖联网 |

## 3. 字节级复核

在 PowerShell 中记录源文件和导出文件 Hash：

```powershell
Get-FileHash -Algorithm SHA256 .\synthetic.wc6
Get-FileHash -Algorithm SHA256 .\synthetic_edited.wc6
fc.exe /b .\synthetic.wc6 .\synthetic_edited.wc6
```

如只更改 `pokemon.level`，理想情况下差异只位于 `0xD0`；更改 WC6 日期 2015-03-17→2015-03-19，应出现 `0x4C: 2D→2F`。

空操作导出则源文件/目标文件 SHA-256 必须完全一致。Full 当前只支持空操作原样导出，尚未开启修改后保存。

## 4. Windows CI 当前自动化

- `scripts/windows_native_launch_smoke.ps1`：校验 Tauri EXE 启动并运行至少六秒；**仅进程级**，非 Native Dialog 操作级。CI 标为非阻断，用于观察 Windows runner 会话环境差异。
- `scripts/windows_browser_io_smoke.mjs`：使用 Windows Edge 打开同一 React 界面，导入合成 WC、修改 Level、导出二进制与 JSON v2、重新导入 JSON、切换四语言、检查 Full 只读。**浏览器文件处理链路，不代表 Tauri 插件已验证**。
- `scripts/generate_parity_vectors.py`：旧版 Python 生成 WC6/WC7/Full 字节与 SHA 向量，由 Vitest 新版核心作逐字节比对；仍只是合成样本。

所有步骤均未验证真实官方配信的真实性/游戏可接受性。用户提供获授权样本后再加入额外的本地私有 parity 计划，禁止直接提交私人存档到公开仓库。

## 5. 未封闭风险

- 当前 Tauri Save As 使用存在性检查+写文件，尚未实现完整的原子临时写入/崩溃回滚；不可宣称生产级安全保存。
- 全世代格式仍按 `docs/FORMAT_MATRIX.md` 的 L0-L5 独立门禁推进。
- “支持在编辑器中改动字段”与“官方来源/游戏内合法性已验证”是不同概念。

## 第三轮自动化补充

- `src-tauri/src/native_io.rs` 使用 Rust DialogExt 在已安装桌面端执行真正的系统 Open/Save 对话框；renderer 的通用 `fs:allow-write-file` 已撤回。
- Windows Rust release 测试已完成 8 项，运行日志可见 [#43359519944](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359519944)。
- 真实 NSIS 安装及启动检查已通过 [#43359645845](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359645845)。
- `scripts/windows_native_dialog_smoke.py` 使用 pywinauto 尝试操作安装版的 Open / Save As；CI 非阻断，若图形会话不可用则不应视为已通过，必须查看该步骤日志中的 `PASS:`。
- Windows 原子 Save As 用 `hard_link` 不覆盖式发布，失败时拒绝使用不安全的文件系统回退；不等于已验证突然断电和远程文件系统。
