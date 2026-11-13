/**
 * Lossless, offline WonderCard JSON v2 interchange.
 * The raw snapshot + SHA-256 is the baseline; fields are a validated patch proposal.
 * SHA-256 detects accidental tampering, but does NOT prove event provenance.
 */
import { createDocument, currentBytes, descriptors, diff, edit, readField, toHex, verifyExport,
  type ByteDiff, type FieldValue, type RawDocument } from "./wondercard";

export const JSON_SCHEMA = "wondercard-toolkit-pro-v2";
const HEX_RE = /^(?:[0-9a-fA-F]{2})*$/;
const MAX_BYTES = 2 * 1024 * 1024;

export function fromHex(hex: string): Uint8Array {
  if (typeof hex !== "string" || hex.length > MAX_BYTES * 2 || !HEX_RE.test(hex))
    throw new Error("Invalid or oversized raw_hex");
  const raw = new Uint8Array(hex.length / 2);
  for (let i = 0; i < raw.length; i++) raw[i] = Number.parseInt(hex.slice(i*2,i*2+2),16);
  return raw;
}

export async function sha256(bytes: Uint8Array): Promise<string> {
  // Copy into an owned ArrayBuffer for WebCrypto BufferSource compatibility.
  const source = new Uint8Array(bytes.length);
  source.set(bytes);
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256",source.buffer));
  return toHex(hash).toLowerCase();
}
type JsonMap = Record<string,FieldValue>;
type JsonChange = {offset:number;old:number;new:number};
interface JsonV2 {
  schema: typeof JSON_SCHEMA;
  format: string;
  source_filename: string;
  source_sha256: string;
  raw_hex: string;
  baseline_fields: JsonMap;
  fields: JsonMap;
  patches: JsonChange[];
}

function values(doc: RawDocument, snapshot: Uint8Array): JsonMap {
  const format=doc.detection.format;
  if(!format) throw new Error("Cannot serialize ambiguous formats to editable JSON");
  const map: JsonMap={};
  for (const field of descriptors(doc)) map[field.key]=readField(snapshot,format,field);
  return map;
}
export async function exportDocumentJson(doc: RawDocument): Promise<string> {
  const current=verifyExport(doc);
  if (!doc.detection.format) throw new Error("Unknown format; editable JSON export unavailable");
  const patches=diff(doc.original,current).map(x=>({offset:x.offset,old:x.before,new:x.after}));
  const data: JsonV2={
    schema:JSON_SCHEMA,
    format:doc.detection.format,
    source_filename:doc.filename,
    source_sha256:await sha256(doc.original),
    raw_hex:toHex(doc.original),
    baseline_fields:values(doc,doc.original),
    fields:values(doc,current),
    patches
  };
  return JSON.stringify(data,null,2)+"\n";
}
function plainObject(x: unknown): x is Record<string,unknown> {
  return !!x && typeof x==="object" && !Array.isArray(x);
}
function validateMap(input: unknown, expected: JsonMap, kind: string): JsonMap {
  if (!plainObject(input)) throw new Error(kind+" must be an object");
  const keys=Object.keys(expected);
  if(Object.keys(input).length!==keys.length || keys.some(key=>!Object.hasOwn(input,key)))
    throw new Error(kind+" has unexpected/missing keys");
  const output: JsonMap={};
  for (const key of keys) {
    const v=input[key];
    if (v!==null && typeof v!=="number" && typeof v!=="string") throw new Error(kind+" invalid field: "+key);
    output[key]=v;
  }
  return output;
}
function equalsDiffs(received: unknown, actual: ByteDiff[]): boolean {
  if (!Array.isArray(received)||received.length!==actual.length) return false;
  return actual.every((change,i)=>{
    const p:unknown=received[i];
    return plainObject(p) && Object.keys(p).length===3 &&
      p.offset===change.offset && p.old===change.before && p.new===change.after;
  });
}
export async function importDocumentJson(text: string): Promise<RawDocument> {
  if(text.length > MAX_BYTES * 5) throw new Error("JSON file exceeds maximum size");
  let root: unknown;
  try { root=JSON.parse(text); } catch { throw new Error("Invalid JSON syntax"); }
  if (!plainObject(root) || root.schema!==JSON_SCHEMA) throw new Error("Unsupported JSON schema");
  if (typeof root.raw_hex!=="string" || typeof root.source_sha256!=="string" ||
      typeof root.source_filename!=="string" || typeof root.format!=="string") {
    throw new Error("Missing JSON source metadata");
  }
  const original=fromHex(root.raw_hex);
  const hash=await sha256(original);
  if (hash!==root.source_sha256.toLowerCase()) throw new Error("Raw snapshot SHA-256 mismatch");
  const name=root.source_filename.split(/[\\/]/).pop() ?? "";
  if (!name || name!==root.source_filename) throw new Error("Invalid source file name");
  const doc=createDocument(name,original);
  if(!doc.detection.format || doc.detection.format!==root.format)
    throw new Error("Source format does not match baseline bytes/filename");
  const baseline=values(doc,doc.original);
  const declaredBaseline=validateMap(root.baseline_fields,baseline,"baseline_fields");
  const edited=validateMap(root.fields,baseline,"fields");
  for (const key of Object.keys(baseline)) {
    if (declaredBaseline[key]!==baseline[key]) throw new Error("Baseline field tampering: "+key);
  }
  let updated=doc;
  for (const key of Object.keys(baseline)) {
    if (edited[key]!==baseline[key]) updated=edit(updated,key,edited[key]);
  }
  const changes=diff(original,verifyExport(updated));
  if (!equalsDiffs(root.patches,changes)) throw new Error("Patch byte manifest does not match fields");
  return updated;
}
/** Apply imported patches without discarding the current document identity or undo history. */
export async function applyDocumentJson(doc: RawDocument, text:string): Promise<RawDocument> {
  const imported=await importDocumentJson(text);
  if (imported.detection.format!==doc.detection.format ||
      toHex(imported.original)!==toHex(doc.original)) throw new Error("JSON baseline differs from active file");
  const bytes=verifyExport(imported);
  if (!diff(currentBytes(doc),bytes).length) return doc;
  return {...doc, history:[...doc.history.slice(0,doc.cursor+1),bytes], cursor:doc.cursor+1};
}
