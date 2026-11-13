/**
 * Pro Editor experimental WC6/WC7 raw-byte core.
 * Legacy reference: web/manifest.js, wondercard/core.py.
 * No authenticity or target-game validation is implied.
 */
export type Format = "wc6" | "wc7" | "wc6full" | "wc7full";
export type FieldValue = number | string | null;
export type FieldKind = "u8" | "u16" | "u32" | "date" | "string";
export interface FieldSpec {
  key: string;
  label: string;
  offset: number;
  length: number;
  kind: FieldKind;
  editable: boolean;
}
export interface Detection {
  format: Format | null;
  candidates: Format[];
  reason: string;
  editable: boolean;
}
export interface RawDocument {
  readonly id: string;
  readonly filename: string;
  readonly sourcePath?: string;
  readonly original: Uint8Array;
  readonly history: readonly Uint8Array[];
  readonly cursor: number;
  readonly detection: Detection;
}

export const CORE_SIZE = 0x108;
export const FULL_SIZE = 0x310;
export const FULL_START = 0x208;

const HEAD: readonly FieldSpec[] = [
  { key: "card_id", label: "配信卡 ID", offset: 0x00, length: 2, kind: "u16", editable: true },
  { key: "title", label: "配信标题", offset: 0x02, length: 74, kind: "string", editable: false },
  { key: "date", label: "接收日期", offset: 0x4c, length: 4, kind: "date", editable: true },
  { key: "card_location", label: "卡片来源", offset: 0x50, length: 1, kind: "u8", editable: false },
  { key: "card_type", label: "礼物类型", offset: 0x51, length: 1, kind: "u8", editable: false },
  { key: "status_flags", label: "状态标志", offset: 0x52, length: 1, kind: "u8", editable: false }
];
const PK: readonly FieldSpec[] = [
  { key: "pokemon.species", label: "宝可梦图鉴编号", offset: 0x82, length: 2, kind: "u16", editable: true },
  { key: "pokemon.nature", label: "性格模式", offset: 0xa0, length: 1, kind: "u8", editable: false },
  { key: "pokemon.pid_type", label: "PID/闪光模式", offset: 0xa3, length: 1, kind: "u8", editable: false },
  { key: "pokemon.level", label: "等级", offset: 0xd0, length: 1, kind: "u8", editable: true }
];

export const isFormat = (value: string): value is Format =>
  ["wc6", "wc7", "wc6full", "wc7full"].includes(value);

export function detect(filename: string, bytes: Uint8Array): Detection {
  const ext = filename.toLowerCase().split(".").at(-1) ?? "";
  if (isFormat(ext)) {
    const expected = ext.endsWith("full") ? FULL_SIZE : CORE_SIZE;
    if (bytes.length !== expected) {
      return { format: null, candidates: [], editable: false, reason: "扩展名与预期文件长度不符" };
    }
    return {
      format: ext,
      candidates: [ext],
      editable: !ext.endsWith("full"),
      reason: ext.endsWith("full") ? "Full 校验/重封装未验证，仅允许原样导出" : "依据文件扩展名与长度识别；不代表官方来源验证"
    };
  }
  const candidates: Format[] = bytes.length === CORE_SIZE ? ["wc6", "wc7"] :
    bytes.length === FULL_SIZE ? ["wc6full", "wc7full"] : [];
  return {
    format: null,
    candidates,
    editable: false,
    reason: candidates.length ? "同长度存在多个候选格式，禁止猜测并写入" : "未知格式或文件长度"
  };
}

function assertRange(bytes: Uint8Array, pos: number, size: number): void {
  if (!Number.isInteger(pos) || pos < 0 || pos + size > bytes.byteLength) {
    throw new Error("Invalid field offset/length");
  }
}
function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m-1 && dt.getUTCDate() === d;
}
export function descriptors(doc: RawDocument): FieldSpec[] {
  if (!doc.detection.format) return [];
  const base = doc.detection.format.endsWith("full") ? FULL_START : 0;
  const view = new DataView(currentBytes(doc).buffer);
  const kind = view.getUint8(base + 0x51);
  const fields = kind === 0 ? [...HEAD, ...PK] : [...HEAD];
  return fields.map(field => ({
    ...field,
    offset: field.offset + base,
    editable: field.editable && doc.detection.editable
  }));
}
export function readField(bytes: Uint8Array, format: Format, spec: FieldSpec): FieldValue {
  assertRange(bytes, spec.offset, spec.length);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (spec.kind === "string") {
    return new TextDecoder("utf-16le").decode(bytes.slice(spec.offset,spec.offset+spec.length)).split("\0")[0];
  }
  if (spec.kind === "date") {
    const n = view.getUint32(spec.offset, true);
    if (n === 0) return null;
    const year = Math.floor(n/10000) + (format.startsWith("wc7") ? 2000 : 0);
    const iso = [String(year).padStart(4,"0"), String(Math.floor(n/100)%100).padStart(2,"0"), String(n%100).padStart(2,"0")].join("-");
    return validDate(iso) ? iso : null;
  }
  return spec.kind === "u8" ? view.getUint8(spec.offset) :
    spec.kind === "u16" ? view.getUint16(spec.offset,true) : view.getUint32(spec.offset,true);
}
export function writeField(bytes: Uint8Array, format: Format, spec: FieldSpec, input: FieldValue): Uint8Array {
  if (!spec.editable) throw new Error("字段只读或格式不允许写入");
  assertRange(bytes, spec.offset, spec.length);
  const output = bytes.slice();
  const view = new DataView(output.buffer);
  if (spec.kind === "string") throw new Error("字符串写入尚未通过校验");
  if (spec.kind === "date") {
    if (input !== null && (typeof input !== "string" || !validDate(input))) throw new Error("需要有效 ISO 日期");
    let n = 0;
    if (typeof input === "string") {
      const [year, month, day] = input.split("-").map(Number);
      if (format.startsWith("wc7") && (year < 2000 || year > 2099)) throw new Error("WC7 年份范围为 2000–2099");
      n = (year-(format.startsWith("wc7") ? 2000 : 0))*10000 + month*100 + day;
    }
    view.setUint32(spec.offset,n,true);
    return output;
  }
  if (typeof input !== "number" || !Number.isSafeInteger(input)) throw new Error("整数必填");
  const max = spec.kind === "u8" ? 0xff : spec.kind === "u16" ? 0xffff : 0xffffffff;
  if (input < 0 || input > max) throw new Error("超出字段范围");
  if (spec.kind === "u8") view.setUint8(spec.offset,input);
  else if (spec.kind === "u16") view.setUint16(spec.offset,input,true);
  else view.setUint32(spec.offset,input,true);
  return output;
}
let nextDocumentId = 1;
export function createDocument(filename: string, bytes: Uint8Array, sourcePath?: string): RawDocument {
  // Copy twice: external Uint8Array and current patch history must not alias.
  const original = bytes.slice();
  return {
    id: "doc-"+nextDocumentId++,
    filename,
    sourcePath,
    original,
    history: [original.slice()],
    cursor: 0,
    detection: detect(filename, original)
  };
}
export function currentBytes(doc: RawDocument): Uint8Array {
  return doc.history[doc.cursor].slice();
}
export function hasChanges(doc: RawDocument): boolean {
  return diff(doc.original, doc.history[doc.cursor]).length !== 0;
}
export interface ByteDiff { offset: number; before: number; after: number }
export function diff(a: Uint8Array, b: Uint8Array): ByteDiff[] {
  if (a.length !== b.length) throw new Error("Cannot diff byte arrays of different sizes");
  const out: ByteDiff[] = [];
  for (let i=0;i<a.length;i++) if (a[i]!==b[i]) out.push({offset:i,before:a[i],after:b[i]});
  return out;
}
export function edit(doc: RawDocument, fieldKey: string, input: FieldValue): RawDocument {
  const fmt=doc.detection.format;
  if (!fmt || !doc.detection.editable) throw new Error(doc.detection.reason);
  const spec=descriptors(doc).find(f=>f.key===fieldKey);
  if (!spec || !spec.editable) throw new Error("不可编辑字段: "+fieldKey);
  const old = currentBytes(doc);
  const updated=writeField(old,fmt,spec,input);
  if (diff(old,updated).length===0) return doc;
  return { ...doc, history: [...doc.history.slice(0,doc.cursor+1),updated], cursor: doc.cursor+1 };
}
export function undo(doc: RawDocument): RawDocument {
  return doc.cursor ? {...doc,cursor:doc.cursor-1}:doc;
}
export function redo(doc: RawDocument): RawDocument {
  return doc.cursor < doc.history.length-1 ? {...doc,cursor:doc.cursor+1}:doc;
}
export function verifyExport(doc: RawDocument): Uint8Array {
  const bytes = currentBytes(doc);
  if (bytes.length !== doc.original.length) throw new Error("长度意外变化");
  if (hasChanges(doc)) {
    if (!doc.detection.format || !doc.detection.editable) throw new Error("该格式禁止修改后导出");
    // Verify every changed byte lies in a declared editable field.
    const allow = new Set<number>();
    for (const f of descriptors(doc)) if(f.editable) for(let i=f.offset;i<f.offset+f.length;i++) allow.add(i);
    for (const change of diff(doc.original,bytes)) {
      if (!allow.has(change.offset)) throw new Error("修改越过白名单字段范围");
    }
    // Reparse all displayed fields and refuse unexpected structural transitions.
    if (bytes[(doc.detection.format.endsWith("full")?FULL_START:0)+0x51] !==
        doc.original[(doc.detection.format.endsWith("full")?FULL_START:0)+0x51]) {
      throw new Error("卡片类型变化无效");
    }
    for (const spec of descriptors(doc)) readField(bytes,doc.detection.format,spec);
  }
  return bytes;
}
export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b=>b.toString(16).padStart(2,"0").toUpperCase()).join("");
}
export function safeJson(doc: RawDocument): string {
  const fmt = doc.detection.format;
  const raw = currentBytes(doc);
  const values: Record<string,FieldValue> = {};
  if (fmt) for(const field of descriptors(doc)) values[field.key]=readField(raw,fmt,field);
  return JSON.stringify({
    schema:"wondercard-pro-editor-preview-v0", format:fmt, filename:doc.filename,
    editable:doc.detection.editable, raw_hex:toHex(doc.original),
    fields:values,
    diffs:diff(doc.original,raw).map(x=>({offset:x.offset,old:x.before,new:x.after})),
    warning:"Preview only; do not treat this as a validated import contract"
  },null,2);
}
