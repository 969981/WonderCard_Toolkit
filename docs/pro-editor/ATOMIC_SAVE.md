# Rust 原生文件打开与安全另存为

范围：WonderCard Pro Editor v0.4 Alpha，Windows/Tauri 2。实现文件：`apps/studio/src-tauri/src/native_io.rs`、`atomic.rs`、`apps/studio/src/lib/storage.ts`。

## 数据路径与安全边界

1. React 仅负责验证字段补丁与 `verifyExport`，通过 Tauri `invoke('open_cards_native')`/`invoke('save_card_atomic')` 与 Rust 通信；浏览器端继续采用 HTML 文件 API。
2. `open_cards_native` 在 Rust 打开原生系统选择对话框，只读取用户选定的文件；二进制输入最多 2 MiB，JSON v2 最多 10 MiB。
3. `save_card_atomic` 也在 Rust 内调用系统另存为对话框。前端不能传入目标绝对路径，用户必须在对话框中选择位置。
4. Tauri capabilities 删除前端通用 `fs:allow-write-file`、`fs:allow-write-text-file`、`fs:allow-exists`，从而不能通过通用前端 FS API 绕过安全写入。

## 不覆盖原子保存算法

1. 在目标所在目录创建唯一 `.partial` 临时文件，采用 `create_new(true)`，不会踩已有文件。
2. 将经过前端验证的字节写入临时文件，调用 `sync_all()`。
3. 使用同卷 `hard_link(temp, target)` 作为原子不覆盖发布；目标已存在时操作失败，**不会替换、覆盖或截断已有文件**，也不存在先检查再写入的 TOCTOU 竞态。
4. 尽力同步父目录元数据，再清理临时名称；重新读取目标逐字节与原数据对照。

限制：硬链接需要目标卷支持，某些网络盘、FAT 等可能拒绝。此时直接返回错误，而非回退到不安全的替换写入。意外终止可能遗留临时 `.partial` 文件，但不会发布半成品目标。目录同步属于尽力执行，未承诺所有存储设备断电后仍具有完整事务级持久性。

## 已验证的 Windows 测试

- Windows cargo release 单元测试 8 项成功：同目录写入、原样读回、已存在文件不变、8 线程同时竞争仅一者成功、硬链接别名保护、失败不创建目录、原生读取、超大 JSON 拦截。查看 [GitHub Actions #43359519944](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359519944)。
- NSIS 安装包能被静默安装并启动已安装 EXE，查看 [GitHub Actions #43359645845](https://github.com/969981/WonderCard_Toolkit/actions/runs/43359645845)。
- Tauri 原生文件对话框自动点击/保存仍须查看 [最新 Pro Editor CI](https://github.com/969981/WonderCard_Toolkit/actions) 的 `Installed app native Open/Save dialog E2E` 单独结果。该检查是非阻断式，只有日志显示 `PASS:` 才可算成功。

真实样本与官方来源及游戏导入验证另需用户授权文件及独立交叉证据，不能从文件保存正确推导。
