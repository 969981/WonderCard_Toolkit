import { isTauri } from "@tauri-apps/api/core";
import type { RawDocument } from "./wondercard";
import { safeJson, verifyExport } from "./wondercard";

export interface ImportedFile { filename:string; bytes: Uint8Array; sourcePath?: string }
const LIMIT = 2 * 1024 * 1024;

export async function fromBrowserFiles(files: readonly File[]): Promise<ImportedFile[]> {
  const output: ImportedFile[] = [];
  for (const file of files) {
    if (file.size > LIMIT) throw new Error(file.name + ": 文件过大（上限 2 MiB）");
    output.push({ filename: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  }
  return output;
}

export async function chooseLocalFiles(): Promise<ImportedFile[] | null> {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readFile } = await import("@tauri-apps/plugin-fs");
  const selected = await open({
    multiple: true, directory: false,
    filters: [{name: "WonderCard", extensions: ["wc6","wc7","wc6full","wc7full","bin"]}]
  });
  if (!selected) return [];
  const paths = Array.isArray(selected) ? selected : [selected];
  const out: ImportedFile[]=[];
  for (const path of paths) {
    // The dialog grants access only to user-selected paths for this session.
    const bytes=await readFile(path);
    if (bytes.length > LIMIT) throw new Error(path + ": 文件过大（上限 2 MiB）");
    out.push({filename:path.split(/[\\/]/).pop() ?? path, bytes, sourcePath:path});
  }
  return out;
}

function browserDownload(name:string, value: Uint8Array | string, mime: string): void {
  const payload = typeof value === "string" ? value :
    value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength) as ArrayBuffer;
  const url=URL.createObjectURL(new Blob([payload],{type:mime}));
  const link=document.createElement("a"); link.href=url; link.download=name; document.body.appendChild(link); link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),10_000);
}
export async function saveAs(doc: RawDocument, kind: "wc"|"json"): Promise<void> {
  const bytes=verifyExport(doc);
  const desired=kind==="json" ? doc.filename+".json" :
    doc.filename.replace(/(\.[^.]*)?$/, "_edited$1");
  const value=kind==="json" ? safeJson(doc) : bytes;
  const mime=kind==="json" ? "application/json" : "application/octet-stream";
  if (!isTauri()) {
    browserDownload(desired,value,mime);
    return;
  }
  const {save}=await import("@tauri-apps/plugin-dialog");
  const {exists,writeFile,writeTextFile}=await import("@tauri-apps/plugin-fs");
  const path=await save({defaultPath:desired,filters:kind==="json"?
    [{name:"JSON",extensions:["json"]}]:[{name:"WonderCard",extensions:[doc.detection.format??"bin"]}]});
  if (!path) return;
  // Never overwrite the imported file, or any other existing file in this initial implementation.
  if (doc.sourcePath && path.toLowerCase()===doc.sourcePath.toLowerCase())
    throw new Error("禁止覆盖原始文件，请另存为新文件");
  if (await exists(path)) throw new Error("目标文件已存在，请选择新文件名");
  if (kind==="json") await writeTextFile(path,String(value));
  else await writeFile(path,value as Uint8Array);
}
