# 私有真实 WonderCard 样本交叉验证

本仓库不内置或自动下载真实配信卡。此测试仅扫描用户本机明确提供的文件夹，
使用 Python 旧版解析器与 TypeScript 新核心交叉比较，不上传或复制文件。

Windows PowerShell（仓库根目录）：
```powershell
$env:WONDERCARD_REAL_FIXTURES_DIR = "C:\Private\WonderCards"
npm install
npm run test:real --workspace=@wondercard/studio
Remove-Item Env:WONDERCARD_REAL_FIXTURES_DIR
```

支持当前目录下不超过 300 个 .wc6/.wc7/.wc6full/.wc7full 文件，每个不超过 2 MiB。
测试包括不修改原始数据回写一致、字段解释一致、非 Full 卡 Card ID 修改后逐字节和 SHA-256 一致。
Full 始终只读。错误日志仅显示 SHA 前缀、字段名和偏移，不输出原始数据。

通过仅表示 Python 与 TypeScript 在这些输入上达成一致：
不等于配信来自官方，不等于 CRC 已正确重封装，也不等于 PKHeX 或游戏端已接受。
需要独立的 PKHeX 交叉核对及游戏端证据后，才能单独关闭对应验收门槛。
