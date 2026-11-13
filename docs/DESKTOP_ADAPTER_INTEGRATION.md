# React + Tauri 专业桌面编辑器集成关口

专业版正在独立 feature/pro-editor-shadcn-tauri / PR #19。本分支只提交 Python 核心与验证研究，绝不覆盖 React/Tauri 原有工作。

## 集成方式
1. 统一使用从 Python Schema 生成的 format_id / field_id / offset / writable，禁止在 React 里手写第二套字段偏移。
2. 打开文件返回 raw SHA-256、size、typed_document、诊断结果；所有只读格式都保留原始 HEX/JSON 查看功能。
3. 只有验证过的 PatchSet 能交给原生保存动作；不能把表单值 JSON.stringify() 直接写进 .wc*。
4. Tauri 原生后端负责有路径约束的打开、另存和同目录临时文件原子写；失败不改动原始文件，不默认覆盖。
5. Windows 实机验收：系统文件对话框、多个拖放、Unicode 中文路径、只读格式禁用写入、撤销/重做、重新打开、安装包的实磁盘写入。

## 尚未完成的验证
- Windows 安装版 Native Open/Save 与 atomic write，当前不可宣告完成。
- WC8/WB8/WA8/WA9 在真实卡片上写回及游戏导入；未经过验证的格式锁写。
- PGT/PCD/WC5Full 的包裹层完整加密/转换互操作；部分 PK4 算法自测不等于整张卡支持写入。
- WC9 虽已有受限实验性 CRC 写回，仍缺少所有礼物类型的目标游戏交叉测试。

建议后续基于 PR #19 单独建立 UI 集成 PR，避免不同开发分支覆盖。
