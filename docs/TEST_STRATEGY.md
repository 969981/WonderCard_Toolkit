# 数据保真、格式校验与 UI 验收

## 最重要的硬性断言
1. 对支持 L3+ 的每个样本：`encode(decode(raw), patches=[]).bytes == raw`，哈希完全相同。
2. 对每个受支持字段：写入后重新解析，期望值精确匹配；diff 仅涉及声明字段字节区及**明确声明**的 checksum/container 修补区。
3. 对编辑撤销：undo 到起点，导出必须等于原件；redo 后应与前次编辑结果一致。
4. 对文件头无效、大小不符、识别歧义、非法日期、越界 ID、损坏字符串、奇数 UTF-16 单元、校验失败：不写出潜在损坏的文件。
5. 从浏览器/GUI 导出并用 CLI 再次导入，解析字段与 SHA 交叉一致。

## Fixtures
tests/fixtures/metadata.json 字段：fixture_id、format_id、source_type（synthetic/permissioned）、file_sha256、length、origin、license_note、reference_commit、expected_fields、expected_capabilities。公开仓库存合成样本与 Hash 清单；其他真实样本放本地私有路径，通过环境变量指定，不进 git。

## 格式级测试表
| 测试 | L0/L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| 类型/大小/识别冲突 | 必须 | 必须 | 必须 | 必须 | 必须 |
| 字段偏移与参考实现一致 |  | 必须 | 必须 | 必须 | 必须 |
| 原样往返、字节不变 |  |  | 必须 | 必须 | 必须 |
| 字段编辑/撤销、差异范围 |  |  |  | 必须 | 必须 |
| CRC、容器重封装、游戏实测 |  |  |  | 视具体条件 | 必须 |
| fuzz/异常文件 | 必须 | 必须 | 必须 | 必须 | 必须 |

## 正式黄金用例
- Gen 6 日版阿尔宙斯 WC6：日期从 2015-03-17 改为 2015-03-19，修改的核心字节只能是 offset 0x4C：2D -> 2F；先保持原始文件 hash，改后重解析日期为 2015-03-19；该测试**不是合法性验证**。
- Gen 6/7 Full：检查独立外层头、内部核心偏移，未编辑原样输出；没有真正交叉验证之前修改后导出必须阻断。
- Gen 7 日期：对比 Gen 6 编码相同日历日期的不同 raw 编码，不允许混淆。
- 同长度的 Gen 8/9 格式：构造多候选，若证据不够必须输出 ambiguous，禁止编辑。
- Gen 4 Gallery WC4/PCD：验证档案格式转换语义，不宣称不同文件绝对 byte identical。
- 资源目录混合输入：忽略无效文件、可继续审计其他文件，CSV 保留每条异常说明。

## CI / Release Gate
Python 单元测试、静态检查、schema 生成一致性检查、网页 lint/type-check、浏览器 GUI tests、Windows 构建 smoke test。PR 必须附 fixture 清单、通过测试数量、变更前后偏移与截图。全格式覆盖通过率以单个格式的 L0–L5 能力显示，不报一个误导性的总体“100% 支持”。

## 安全规则
- 输入大小限制（包含 BCAT 目录/归档防止解压炸弹与路径穿越）；任何外部路径规范化，不读写工作区外不受控位置。
- JSON 防止篡改 baseline/raw SHA；字段类型/范围验证，拒绝二进制不一致的“旧字节”。
- 写出采用临时文件 + 原子 rename（在可行的平台上），不可悄悄覆盖。
- 不联网、不上传用户数据、不捆绑未经授权的配信原件。
