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
