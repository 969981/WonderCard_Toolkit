# v0.7 Gen4/5/8/9 → Pro Editor 只读集成（2026-11-13）

## 来源与门禁

- 上游：`feature/format-validation-gen4-9` / [PR #21](https://github.com/969981/WonderCard_Toolkit/pull/21)。
- Python 权威布局：`wondercard/typed.py`。当前 React 快照来自该分支生成的 `web/typed_manifest.js`，原始 GitHub blob SHA `329f8e607d91691420d987e24cff79987592ac06`。
- TypeScript 快照：`apps/studio/src/lib/typed-v07.ts`。**这是经版本固定的只读镜像，不是第二套允许独立修改偏移的源码。** 将来上游布局变化时需重新生成、核对 SHA 和跨语言 fixture。
- 格式：WC8、WB8、WA8、WC9、WA9、PGF、WC5Full、PGT、PCD、WC4（10 种）。

## 本次已接入（源代码实现，不等于已完成所有 CI 和 Windows 实机验收）

1. 按精确扩展名与长度执行格式候选识别；不可靠的 `.bin` 同尺寸候选不自动择一。识别仅用于查看，不宣称官方来源合法性。
2. 在 React Inspector 中查看 card 以及根据礼物类型选出的 Pokémon 或 item 字段；HEX 与源字节始终保留。遗留格式 WC6/WC7 逻辑不变。
3. 对全部这 10 种格式强制 `editable=false`。即使上游 v0.7 已在 WC8/WC9/WA9 有受限 L4 写回，**专业桌面版暂不开放**：缺少 Python/TS 的逐字节修改 parity 和 Windows 已安装版本读写验收。
4. 二进制文件无修改原样另存、JSON v2 无修改往返；JSON 修改、不授权的 HEX 修改、篡改历史内容全部拒绝。
5. 新增 `typed-v07.test.ts` 合成回归：字段偏移、类型分支、严格长度、歧义检测、只读门禁、JSON 往返与篡改拦截。

## 后续解锁条件（逐格式、逐字段）

- 验证真实获授权 WonderCard 样本与 PKHeX 输出结果，数据不提交公共 Git 仓库。
- WC8/WC9/WA9 首先跑 Python v0.7 L4 → TS 写回逐字节 parity 与错误原 CRC 检测，再考虑桌面实验性写入。
- WB8/WA8 仍然缺少确认的写回完整性/游戏导入证据；不能因为没有独立卡片 Checksum 属性就认为可以无保护写入。
- Gen 4 PGT/PCD 的完整加密封装与 Gen 5 PGF/WC5Full 的修改后再封装未通过 PKHeX 互操作，全部保持只读。
- Windows NSIS 安装版原生 Open/Save As、Unicode 路径、已存在目标拒绝、重新打开导出文件仍需查看 GUI 操作成功日志；不以构建成功代替实机交互。

验收命令：`npm run typecheck`、`npm test`、`npm run build`、`cargo test --manifest-path apps/studio/src-tauri/Cargo.toml --release --lib`。
