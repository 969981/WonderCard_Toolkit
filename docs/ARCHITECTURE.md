# 架构设计：原始字节层 / 格式插件 / 工作台 / 资料索引

## 目标与非目标
目标：可扩展到 Gen 1–9 的事件文件研究工具，Windows 离线优先，同时提供 CLI 与 JSON 互操作。第一阶段沿用既有 Python 核心 + HTML 原型，后续以单一 schema 生成前端字段定义。不是 PKHeX 存档编辑器替代品，也不负责所有游戏存档加密/签名。

## 建议模块
```text
WonderCard_Toolkit/
  AGENTS.md
  README.md
  docs/                # 规格、格式矩阵、UI、测试和上游映射
  packages/
    core/               # 二进制快照、Patch、JSON v2、diff、SHA
    formats/             # registry + gen4/pgt, gen5/pgf, gen6/wc6 等
    catalog/             # EventsGallery 只读索引、SQLite FTS
    cli/                 # inspect/export/import/diff/audit/verify
  apps/
    studio/              # 离线工作台、字段编辑、HEX、文件库
  scripts/               # schema 生成、索引构建、样本校验
  tests/
    fixtures/            # 合成样本、来源记录，真实卡片按授权放置
    golden/              # 解析与回写快照
    fuzz/                # 突变/异常测试
  .github/workflows/     # CI, build, release
```

## 核心运行数据流
```text
Input files/folder/BCAT
  -> Detector (extension + size + structural signature)
  -> Candidate formats (confidence + reasons; ambiguity -> read-only)
  -> Container adapter (optional: extract member and metadata)
  -> Format adapter (parse raw spans without modifying source)
  -> Immutable RawSnapshot + ParsedFieldTree + Warnings
  -> UI patch edit / HEX diff / history
  -> Serialize patches onto a COPY of raw bytes
  -> Format-specific validator/checksum and optional container rebuild
  -> Reparse + verify untouched regions + hash
  -> Save As / JSON / CSV / report
```

## Adapter contract（建议）
```python
class FormatAdapter(Protocol):
    format_id: str
    def probe(self, data: bytes, name: str | None) -> ProbeResult: ...
    def parse(self, data: bytes) -> ParsedCard: ...
    def fields(self, parsed: ParsedCard) -> list[FieldDescriptor]: ...
    def validate_patches(self, raw: bytes, patches: list[Patch]) -> list[Diagnostic]: ...
    def serialize(self, raw: bytes, patches: list[Patch]) -> bytes: ...
    def verify(self, original: bytes, result: bytes) -> Verification: ...
```
probe 返回证据与候选，不返回“猜测成功”。supports 由 can_read/can_roundtrip/can_edit/can_repack/can_game_verify 独立声明。

## JSON v2 结构（示意；二进制为权威）
```json
{
  "schema_version": 2,
  "format_id": "gen6.wc6",
  "source": {"name": "card.wc6", "sha256": "...", "size": 264},
  "raw_base64": "<original complete bytes>",
  "fields": {
    "card.date": {"value": "2015-03-17", "offset": 76, "size": 4, "editable": true}
  },
  "patches": [
    {"field": "card.date", "old": "2015-03-17", "new": "2015-03-19"}
  ],
  "diagnostics": [],
  "provenance": {"catalog": null, "source_path": null}
}
```
JSON 文件格式保留向后兼容导入 v0.1 的 raw_hex + baseline_fields；v2 的导出稳定排序，写回严格验证 SHA/旧字节。容器成员可另有 container_path 和 raw_parent_snapshot；原生单文件 JSON 不带容器处理。

## 关键格式处理
- Full 格式：核心段与附加头均保留，CRC/校验范围必须通过真实样本确认；未知算法仅可原样导出。
- Gen 8/9：格式长度有重叠，探测需结合关键字段和校验；BCAT 属于外层资源而非单个 Wonder Card。
- Gen 3：事件卡/e-Reader/存档块分别定义 artifact_kind；PKM 实体只做关联预览，不误认成 Wonder Card。
- 可读字符串只做视图；未改动的字符串不重新编码。明确编辑时按世代字库编码，并检查容量/终止符。

## 技术选型
- P0：移入 v0.2 Python CLI/浏览器版作为 **实验性 baseline**，建立回归和格式注册表；不预设已在此仓库存在。
- P1：将 FieldDescriptor/schema 作为单一数据源，生成前端类型及映射；浏览器版保持纯本地运行。
- P2：Windows 单文件/安装包可用 pywebview + PyInstaller，评估其安全、体积及离线行为；不要求用户自行配置服务器。
- 许可证：独立实现与参考源码独立分离；任何直接复用 GPLv3 代码需先决定项目许可证。
