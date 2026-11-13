# Roadmap / GitHub 任务规划

## 发布阶段与退出条件
| 阶段 | 交付目标 | 必须满足的质量门槛 |
|---|---|---|
| M0 — 基础工程 | 导入 v0.2 实验原型、AGENTS、CI、格式注册器、JSON v2 契约 | 原样往返 + 11 个既有核心用例持续通过；明确未经验证能力 |
| M1 — 可用编辑器 | WC6/WC7 (+Full) 可靠读写、无损 JSON、HEX/DIFF、撤销/重做、CSV 和 Windows 开包即用 | 原始阿尔宙斯日期单字节编辑验收；Full 校验实卡通过前继续锁写 |
| M2 — 全世代卡片格式 | PGT/PCD/WC4/PGF/WC5Full/PL6/WB7/WR7/WC8/WB8/WA8/WC9/WA9 | 每个格式以 L0–L5 按证据标记；至少实现可靠识别/只读；L4 仅在可验证后开启 |
| M3 — 档案与特殊容器 | EventsGallery 元数据索引、BCAT 只读与内容拆解、Gen 1–3 特殊事件研究 | 不混淆档案 PKM 与原始卡；来源/许可可追溯；不静默联网 |
| M4 — 稳定发行版 | Windows EXE、离线运行、多语言、可用性、安全测试、可复现 release | 自动化回归、真实样本交叉校验、用户可追溯 CHANGELOG |

## 实施优先顺序（每条应创建 GitHub Issue）
| ID | 优先级 | 任务 | 依赖 | 产出 |
|---|---|---|---|---|
| [T01](https://github.com/969981/WonderCard_Toolkit/issues/2) | P0 | 将 v0.2 Python/HTML 实验代码导入仓库，记录已知问题 | 无 | 可运行基线、11 核心测试和 GUI 测试 |
| [T02](https://github.com/969981/WonderCard_Toolkit/issues/3) | P0 | format registry + probe 证据 + 格式候选/冲突处理 | T01 | JSON 格式检测报告、未知类型只读 |
| [T03](https://github.com/969981/WonderCard_Toolkit/issues/4) | P0 | 统一 RawSnapshot / PatchSet / JSON v2 / diff | T01,T02 | CLI/GUI 统一输出、SHA 保真 |
| [T04](https://github.com/969981/WonderCard_Toolkit/issues/5) | P0 | WC6/7/Full 实卡字段与 CRC/编码交叉验证 | T03 | 偏移证据表、golden fixtures、写入能力 gate |
| [T05](https://github.com/969981/WonderCard_Toolkit/issues/6) | P0 | Studio UI 编辑器、HEX/DIFF 联动、撤销/重做 | T03 | 端到端 GUI 测试与设计截图 |
| [T06](https://github.com/969981/WonderCard_Toolkit/issues/7) | P1 | Gen 4/5 PGT、PCD/WC4、PGF、WC5Full | T02,T03 | 适配器、合成/真实样本、转换说明 |
| [T07](https://github.com/969981/WonderCard_Toolkit/issues/8) | P1 | PL6、WB7、WR7、Gen 7 Special | T02,T03 | 独立读写规则与互操作测试 |
| [T08](https://github.com/969981/WonderCard_Toolkit/issues/9) | P1 | Gen 8/9 WC8/WB8/WA8/WC9/WA9 | T02,T03 | 重叠格式检测、Checksum、差异矩阵 |
| [T09](https://github.com/969981/WonderCard_Toolkit/issues/10) | P1 | EventsGallery 本地 FTS 索引、文件来源对照 | T02 | Released/Unreleased Gen1–9 元数据、无隐式下载 |
| [T10](https://github.com/969981/WonderCard_Toolkit/issues/11) | P2 | BCAT、Raid、Outbreak 外层容器研究 | T08,T09 | 提取/索引、格式与 Wonder Card 分离 |
| [T11](https://github.com/969981/WonderCard_Toolkit/issues/12) | P2 | Gen 1–3 Mystery Gift/e-Reader/事件脚本研究 | T02,T09 | 独立事件资源模型、只读资料索引 |
| [T12](https://github.com/969981/WonderCard_Toolkit/issues/13) | P2 | 批量审计与批量编辑 Dry Run | T03,T05,T09 | CSV/JSON、错误隔离、差异预演 |
| [T13](https://github.com/969981/WonderCard_Toolkit/issues/14) | P2 | Windows 发行包、GUI/CLI CI、国际化/可访问性 | T04,T05,T12 | 离线 release、签名策略与用户文档 |

## 每张 Issue 模板
**目标**：解决什么用户问题；
**范围**：具体格式/字段/页面；
**参考**：PKHeX 文件/提交 SHA，EventsGallery 来源；
**实施任务**：输入识别、解析、写回、测试、文档；
**验收**：明确的测试样本、预期 hash/偏移、截图/日志、边界行为；
**限制**：未验证的 checksum、未知字段及依赖。
不要出现“全支持”但没有明确 L0–L5 能力表。

## 不在前期做
- 直接从 WC 生成“保证合法”的宝可梦实体或批量线上配信；
- 自动修改游戏存档、反作弊绕过、账号/联网领取；
- 未获授权的完整 EventsGallery 镜像与商用素材；
- 没有真实校验样本就自动修复所有 Full/BCAT checksum。
