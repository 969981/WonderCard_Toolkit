# 专业编辑器技术架构与数据契约

## 1. 逻辑层

`apps/studio`（React/TS, Vite, Tailwind/shadcn/ui, Monaco, 自研 HEX）  
→ `packages/core`（RawSnapshot, FormatRegistry, PatchSet, serde, SHA, diff, validation）  
→ `packages/formats`（按格式独立 adapter；schema / 字节布局 / 支持能力）  
→ `packages/catalog`（后续可选 EventsGallery 本地索引）  
→ `apps/studio/src-tauri`（原生窗口、受限文件 I/O、原子另存、打包）

`web/` 和 `wondercard/core.py` 保持为**独立兼容性基线**，原代码不迁移删除；经过 golden parity 才可标记废弃。

### 拟定目录（目标，不表示已经创建）

```text
apps/
  studio/
    src/
      app/                  # Shell, routing, error boundary
      features/library/     # FileImport, table, filters
      features/editor/      # DocumentSession, FieldInspector, preview
      features/hex/         # VirtualHexGrid, selection, offset mapping
      features/diff/        # FieldDiff, ByteDiff, MonacoJsonDiff
      features/audit/       # Audit batches and reports
      components/ui/        # shadcn/ui generated components
      locales/              # zh-CN, zh-TW, en, ja
      services/             # StoragePort, API, worker adapters
    src-tauri/
      src/                  # Rust commands, file access
      capabilities/         # Minimal permissions
      tauri.conf.json
    package.json
packages/
  core/src/                # binary, snapshot, patch, json, validation
  formats/src/             # registry, gen6/wc6, gen7/wc7, others
  shared/src/              # API DTO, schema, locales
tests/
  fixtures/                # synthetic/permissioned manifest
  parity/                  # v0.3 vs new implementation
  e2e/                     # UI/Tauri smoke
web/                       # v0.3 legacy; retained
wondercard/                # Python baseline; retained
```

pnpm workspace 可在项目第二阶段引入；不要为了目录完整提前生成空包。前端与核心分离，核心不依赖 React/Tauri/DOM，确保未来 CLI 或 Web 复用。

## 2. 单一权威状态

1. 文件读入后创建**不可变 RawSnapshot**：bytes、sha256、size、来源、format probes、warnings。
2. 格式探测返回多候选及证据；名称/扩展名不能直接确认格式。
3. FormatAdapter 将 snapshot 解码为字段描述树（field_id, offset, size, codec, writable, validated, provenance）。
4. 编辑动作产生 PatchOp，而不是直接修改 parsed object 或原始 bytes。
5. derivedBytes = applyValidatedPatches(snapshot.bytes, patchSet)，字段预览、HEX、JSON、Diff 与 Save As 都依赖同一个结果。
6. 保存时校验预期旧字节（optimistic check）、格式策略、重解析、差异范围；先生成输出再另存。写盘后的文件是新基线，历史版本需显式处理。

```typescript
type Capability = "indexed" | "recognized" | "decoded" | "lossless" | "editable" | "verified";

interface RawSnapshot {
  readonly bytes: Uint8Array; // treat immutable; return defensive copies at trust boundaries
  readonly sha256: string;
  readonly filename: string;
  readonly formatCandidates: readonly string[];
}
interface FieldDescriptor {
  id: string;             // stable id, e.g. card.receivedDate
  offset: number;
  length: number;
  codec: string;
  writable: boolean;
  evidence: string;
}
interface PatchOp {
  fieldId: string;
  offset: number;
  expectedOldBytes: Uint8Array;
  newBytes: Uint8Array;
}
interface FormatAdapter {
  formatId: string;
  probe(raw: Uint8Array, filename?: string): ProbeResult;
  parse(raw: Uint8Array): ParsedDocument;
  planPatch(doc: ParsedDocument, fieldId: string, value: unknown): PatchOp[];
  validate(raw: Uint8Array, patches: readonly PatchOp[]): Diagnostic[];
  serialize(raw: Uint8Array, patches: readonly PatchOp[]): Uint8Array;
}
```

以上是接口草案而非已提交 TS 实现。实际增加 container adapter、错误类型、capability gate 与 schema 版本后再冻结公共 API。

## 3. 原子文件保存、离线与安全边界

- Browser 和 Tauri 通过 `StoragePort` 抽象：`open`, `read`, `saveAs`, `list`。浏览器可使用 File API；桌面只通过 Tauri 受限插件/命令。
- 所有本地文件读取须是用户显式选择或授权的工作区；不启用无范围的 `fs` 全盘读写。
- Windows 另存为使用临时写入、flush 和尽可能原子的重命名；跨盘/杀进程失败要可恢复；禁止默认覆盖原始路径。
- 原始 WC/Pokemon 数据、扫描索引不上传，默认无遥测、无自动网络请求。外部 Gallery 检索必须选择来源且手动确认。
- Rust 主要负责 Tauri 壳与文件边界。性能不足时才考虑迁移 parsing/serialization 到 Rust；不得维护两个可能发生格式分歧的生产写入核心。
- 用户导入的 JSON 校验 source hash 与原始基线，阻止手工篡改 baseline 绕过 patch 审计；RAW 专家模式后续独立实现、默认禁用。

## 4. 关键工程决策

- **唯一 UI 系统**：Tailwind + shadcn/ui（明确选定底层，如 Base UI，并统一版本）；不引入 Tabler CSS，与现有 `web` 原型隔离。图标可以选择 Tabler Icons，不等于混用 Tabler UI。
- **Monaco**：仅 JSON / schema / 文本 Diff，按需懒加载并确保 Vite Worker 可以在 Tauri WebView 下工作；编辑器 model 要随标签销毁。
- **HEX**：自研虚拟滚动网格，16 bytes/行可配置，offset 列 + hex 列 + ASCII 列，区间映射和双视图同步；避免将 Monaco 文本当作唯一字节编辑来源。
- **状态层**：先用 React 组件状态与小型 store；跨面板编辑数据必须集中于 `DocumentSession`。需要时再引入 Zustand，不必一开始上 Redux。
- **格式来源**：参考 PKHeX 的字段语义但不直接复制受 GPLv3 约束的实现；不捆绑 EventsGallery 全量文件；依照 `AGENTS.md` 进行许可证审查。
