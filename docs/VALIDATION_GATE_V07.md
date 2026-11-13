# Gen 4–9 格式验证门槛 / v0.7

## 本次实际代码
- wondercard/gen4crypto.py：PGT/PCD 内嵌 236-byte PK4 party 只读加解密、checksum、32 种 PID shuffle 索引；不向 Wonder Card 写修改。
- wondercard/integrity.py：WC8 offset 0x2CC 和 WA9 offset 0x2C0 的候选 CRC16；WC5Full offset 0x2CE 的 CRC16 仅计算 0x00..0x2CD。
- WB8/WA8：按 PKHeX 对应类，没有确认独立 Checksum 属性，不凭空引入 CRC。
- scripts/validate_gallery_samples.py：选定 EventsGallery 的 Pokémon 与道具卡，在线读取到内存，验证原样往返、字段大小与 CRC，输出文件 SHA 和诊断报告，**不提交原始配信二进制**。
- .github/workflows/real-gallery-validation.yml：通过 push / workflow_dispatch 调用脚本并保存 JSON 报告。在线样本失败不代表格式无效，需区分网络错误与 checksum 失败。

## 晋升权限前的验证关口
1. L2 字段解析：对照 PKHeX 对应类和不同游戏的真实道具、宝可梦卡；检查偏移、字段含义、内部图鉴 ID。
2. L3 无损：每一真实样本原样 JSON -> 二进制往返与 SHA 一致，未知字节完整保留。
3. L4 可写：含 checksum 时验证多个真实样本及字段修改后的校验；没有独立 CRC 时用独立参考实现和实卡验证写回，未知类型仍禁止。
4. L5 游戏验证：Windows Tauri 原生文件打开、另存/安全原子保存及模拟器/游戏重新导入。CRC 正确不能替代实机证明。

## 当前可写状态
- WC6/WC7：原有有限写入；Full 的修改后输出仍限制。
- WC9：沿用已有受限 **实验性 L4**，要求原始 CRC 正确，限制编辑字段；未验证游戏实际导入。
- WC8/WB8/WA8/WA9/PGT/PCD/WC4/PGF/WC5Full：仍然不允许导出被修改的二进制。

## 参考与许可
- [PKHeX PokeCrypto](https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/PKM/Util/PokeCrypto.cs)
- [PKHeX MysteryGifts](https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/MysteryGifts)
- [Project Pokémon Gen5 Full Map](https://projectpokemon.org/home/docs/gen-5/5th-generation-wonder-card-full-map-r148/)
- [EventsGallery](https://github.com/projectpokemon/EventsGallery)

仅参考公开数据格式和算法行为；不复制 PKHeX 源码、不将未经授权的配信卡直接加入仓库。没有真实跨实现验证时一律标注 *unverified*。

## 2026-11-13 真实配信卡复核和实验性扩展

GitHub Actions [#43379643616](https://github.com/969981/WonderCard_Toolkit/actions/runs/43379643616) 对 EventsGallery 中 11 个原始文件完成只读取和无损往返：WC8 2 张、WB8 2 张、WA8 2 张、WC9 3 张、WA9 2 张。WC8 在 0x2CC、WC9 在 0x2C4、WA9 在 0x2C0 的全文件 CRC16-CCITT-FALSE（校验字段清零）分别在所有真实样本中匹配。

后续 [真实样本修改回归](https://github.com/969981/WonderCard_Toolkit/actions/runs/43380615181) 在 **7 张** WC8/WC9/WA9 样本中实际进行了白名单字段修改（宝可梦等级 / 道具数量）及 CRC 回写，仅在内存中处理，差异限定为字段本身与 CRC，重新解析与校验通过。

**因此 WC8 和 WA9 与原有 WC9 一样，新增受限实验性 L4 写回；不等于官方配信一致或游戏可用性 L5。** 卡片 ID、原训练家 ID、物种内部索引、未知字段仍不能作为正式可写字段；源 CRC 错误继续锁写。WB8、WA8、Gen4/5 仍只读。专业 React/Tauri 安装版 Windows 原生文件打开/保存测试尚未完成。


## 第二轮真实样本验证：16 张（2026-11-13）

严格模式 GitHub Actions [#43381271032](https://github.com/969981/WonderCard_Toolkit/actions/runs/43381271032) 成功：来自 EventsGallery 的 16 张不同类型配信文件全部原样 JSON 往返、SHA 相同，详见上传的 gallery-validation-report JSON。

| 格式 | 真实样本 | CRC / PK4 证据 | 修改后写入权限 |
|---|---:|---|---|
| WC8 | 2 | 2/2 CRC 校验匹配，真实卡片字段+CRC 内存修改通过 | 受限实验性 L4 |
| WB8 | 2 | 原样往返；未确认独立卡片 CRC | 只读 |
| WA8 | 2 | 原样往返；未确认独立卡片 CRC | 只读 |
| WC9 | 3 | 3/3 CRC 校验匹配，真实卡片字段+CRC 内存修改通过 | 受限实验性 L4 |
| WA9 | 2 | 2/2 CRC 校验匹配，真实卡片字段+CRC 内存修改通过 | 受限实验性 L4 |
| WC5Full | 2 | 2/2 CRC 校验匹配，检验范围 0x000–0x2CD，偏移 0x2CE | 只读 |
| PGF | 1 | 原样往返通过 | 只读 |
| WC4（Gallery 转换形式） | 2 | 内嵌 PK4 当前以解密态保存，分别为 Species 441、491；校验有效 | 只读 |

其中 WC8/WC9/WA9 的 7 张真实宝可梦卡、道具卡在测试内存中执行了“白名单字段变动 → 重新计算 CRC → 差异范围断言 → 重新解析”，没有改动或重新发布原始配信文件。结果不表示 BCAT、签名或游戏客户端一定接受新文件。WC4 样本的 PK4 解密态也**不**证明原始 PGT/PCD 的内嵌加密写回兼容性。

本次没有将专业桌面编辑器 PR #19 的 React/Tauri Windows 原生打开、另存与安全原子写入标记为完成；需要独立 Windows 安装包实机验收。
