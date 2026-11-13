# 上游资料与许可/出处

## 已检查的上游
1. [kwsch/PKHeX](https://github.com/kwsch/PKHeX)（当前 master 的 PKHeX.Core/MysteryGifts）。关键：MysteryGift.cs 的扩展名及大小分流；PCD/PGT/PGF/WC5Full/WC6/WC6Full/PL6/WC7/WC7Full/WB7/WR7/WC8/WB8/WA8/WC9/WA9。
2. [Project Pokémon EventsGallery](https://github.com/projectpokemon/EventsGallery)（当前 master，Released 与 Unreleased 各有 Gen 1–9）。README 对 Gen 3 原卡、Gen 4 .wc4 转换、Gen 8/9 BCAT/Raid/Outbreak 均有说明。
3. [PKHeX README](https://github.com/kwsch/PKHeX/blob/master/README.md)：公开标记 GPLv3。不能把参考项目的代码直接复制进独立许可仓库而忽略义务。
4. [EventsGallery README](https://github.com/projectpokemon/EventsGallery/blob/master/README.md)：档案库用于社区保存和合法性研究。入库时优先存路径/sha/卡片元数据，不自动镜像全部二进制配信内容。
5. [Project Pokémon Wonder Card 结构资料](https://projectpokemon.org/home/docs/gen-6/6th-and-7th-generation-wonder-card-map-r4/)：作为 Gen 6/7 的辅助公开映射；冲突时由真实样本 + 多套解析器核查，注明证据等级。

## 资料索引契约
- source_repo, source_commit, source_path, classification (Released/Unreleased), generation, game, language, original_name, sha256, license/permission, verified_at;
- 本地匹配：exact_sha256 > container_inner_sha256 > field_fingerprint > fuzzy_title；只把第一种称为“字节级一致”；
- 加入未证实条目时保存 warning，不把目录名当官方发放日期；报告需区分 “官方发行日期” 与 “个人接收日期”。

## 更新策略
- 同步由用户手动选择“只索引元数据 / 导入本地 EventsGallery 文件夹 / 下载选定资源”，默认离线；
- 不向远程服务发送用户打开的卡片、存档或用户名；
- 引用上游代码处给出路径和 commit SHA；对格式行为的修正应附实测字节证据；
- 未得到许可前不把第三方素材和 EventsGallery 大量二进制文件打包进 Release。
