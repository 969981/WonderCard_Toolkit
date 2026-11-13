import { invoke, isTauri } from "@tauri-apps/api/core";
import { exportDocumentJson, importDocumentJson } from "./json";
import type { RawDocument } from "./wondercard";
import { verifyExport } from "./wondercard";

export interface ImportedFile {
  filename: string;
  bytes?: Uint8Array;
  sourcePath?: string;
  document?: RawDocument;
}
const LIMIT = 2 * 1024 * 1024;
const JSON_LIMIT = LIMIT * 5;
function isJson(name:string) { return name.toLowerCase().endsWith(".json"); }

async function decodeImported(filename:string,bytes:Uint8Array,sourcePath?:string):Promise<ImportedFile> {
  if (isJson(filename)) {
    if (bytes.length > JSON_LIMIT) throw new Error(filename+": JSON too large");
    const doc=await importDocumentJson(new TextDecoder("utf-8",{fatal:true}).decode(bytes));
    return {filename:doc.filename,document:doc};
  }
  if (bytes.length>LIMIT) throw new Error(filename+": 文件过大（上限 2 MiB）");
  return {filename,bytes,sourcePath};
}
export async function fromBrowserFiles(files:readonly File[]):Promise<ImportedFile[]> {
  const output:ImportedFile[]=[];
  for(const file of files) {
    if(file.size > (isJson(file.name)?JSON_LIMIT:LIMIT)) throw new Error(file.name+": oversized file");
    output.push(await decodeImported(file.name,new Uint8Array(await file.arrayBuffer())));
  }
  return output;
}
type NativeCard = {
  filename: string;
  sourcePath: string;
  bytes: number[];
};
/** Native dialog selection AND file reading are handled by one Rust command. */
export async function chooseLocalFiles(): Promise<ImportedFile[] | null> {
  if(!isTauri()) return null;
  const selected=await invoke<NativeCard[]>("open_cards_native");
  const output: ImportedFile[]=[];
  for(const item of selected) {
    if(!Array.isArray(item.bytes)) throw new Error("Invalid native file response");
    const raw=Uint8Array.from(item.bytes);
    output.push(await decodeImported(item.filename,raw,item.sourcePath));
  }
  return output;
}

function browserDownload(name:string,value:Uint8Array|string,mime:string) {
  const payload=typeof value==="string"?value:
    value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength) as ArrayBuffer;
  const url=URL.createObjectURL(new Blob([payload],{type:mime}));
  const link=document.createElement("a");link.href=url;link.download=name;
  document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),10000);
}
/** Returns false on dialog cancellation; caller must not claim save success then. */
export async function saveAs(doc:RawDocument,kind:"wc"|"json"):Promise<boolean> {
  const bytes=verifyExport(doc);
  const desired=kind==="json"?doc.filename+".json":doc.filename.replace(/(\.[^.]*)?$/,"_edited$1");
  const value=kind==="json"?await exportDocumentJson(doc):bytes;
  const mime=kind==="json"?"application/json":"application/octet-stream";
  if(!isTauri()) { browserDownload(desired,value,mime);return true; }
  // Native Save dialog + atomic, no-clobber commit live in a single Rust command.
  // Renderer code never receives a write-capable path-based API.
  const data=kind==="json" ? new TextEncoder().encode(String(value)) : bytes;
  return invoke<boolean>("save_card_atomic",{
    suggestedName:desired,kind,data:Array.from(data)
  });
}
