import { isTauri } from "@tauri-apps/api/core";
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
export async function chooseLocalFiles():Promise<ImportedFile[] | null> {
  if(!isTauri())return null;
  const {open}=await import("@tauri-apps/plugin-dialog");
  const {readFile}=await import("@tauri-apps/plugin-fs");
  const selected=await open({multiple:true,directory:false,
    filters:[{name:"WonderCard/JSON",extensions:["wc6","wc7","wc6full","wc7full","bin","json"]}]});
  if(!selected)return [];
  const paths=Array.isArray(selected)?selected:[selected], result:ImportedFile[]=[];
  for(const path of paths) {
    const bytes=await readFile(path);
    const filename=path.split(/[\\/]/).pop()??path;
    result.push(await decodeImported(filename,bytes,path));
  }
  return result;
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
  const {save}=await import("@tauri-apps/plugin-dialog");
  const {exists,writeFile,writeTextFile}=await import("@tauri-apps/plugin-fs");
  const path=await save({defaultPath:desired,
    filters:kind==="json"?[{name:"JSON",extensions:["json"]}]:
      [{name:"WonderCard",extensions:[doc.detection.format??"bin"]}]});
  if(!path)return false;
  if(doc.sourcePath && path.toLowerCase()===doc.sourcePath.toLowerCase())
    throw new Error("禁止覆盖原始文件，请另存为新文件");
  if(await exists(path))throw new Error("目标已存在，请选择新的文件名");
  if(kind==="json") await writeTextFile(path,value as string);
  else await writeFile(path,bytes);
  return true;
}
