import { lazy, Suspense, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Braces, FileDown, FilePlus2, FolderOpen, Lock, Moon, Redo2, RotateCcw, Save, Search, ShieldCheck, Sun, Undo2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {LANGUAGES,labelForField,reasonFor,t,type Locale} from "@/i18n";
import {applyDocumentJson} from "@/lib/json";
import { HexPane } from "@/components/HexPane";
import {
  CORE_SIZE, createDocument, currentBytes, descriptors, diff, edit, editByte, hasChanges, readField,
  redo, undo, type FieldSpec, type FieldValue, type RawDocument
} from "@/lib/wondercard";
import { chooseLocalFiles, fromBrowserFiles, saveAs, type ImportedFile } from "@/lib/storage";

const JsonPane=lazy(()=>import("@/components/JsonPane"));
type Tab="hex"|"diff"|"json";

function createSyntheticCard(): ImportedFile {
  const raw=new Uint8Array(CORE_SIZE);
  const v=new DataView(raw.buffer);
  v.setUint16(0,25,true);
  v.setUint32(0x4c,20150317,true);
  v.setUint16(0x82,25,true);
  raw[0xd0]=10;
  raw[0x105]=0xa5;
  return {filename:"synthetic-demo.wc6",bytes:raw};
}

function FieldRow({doc,field,selected,onSelect,onEdit,locale}:{
  doc:RawDocument;field:FieldSpec;selected:boolean;locale:Locale;
  onSelect:()=>void;onEdit:(value:FieldValue)=>void
}) {
  const format=doc.detection.format!;
  const value=readField(currentBytes(doc),format,field);
  const [draft,setDraft]=useState(value===null?"":String(value));
  useEffect(()=>setDraft(value===null?"":String(value)),[doc.id,field.key,value]);
  const commit=()=>{
    const target=field.kind==="date" ? (draft===""?null:draft) :
      field.kind==="string" ? draft : draft.trim()===""?NaN:Number(draft);
    if (String(value??"")!==draft) onEdit(target);
  };
  const translated=labelForField(locale,field.key,field.label);
  const fieldLabel=translated + (field.editable?"":" ("+t(locale,"editor.readonly")+")");
  return <div className={"fieldRow"+(selected?" selected":"")} onClick={onSelect}>
    <div className="min-w-0">
      <div className="text-sm font-medium truncate">{translated}</div>
      <div className="fieldOffset">{field.key}</div>
    </div>
    <input type={field.kind==="date"?"date":field.kind==="string"?"text":"number"}
      aria-label={fieldLabel} title={t(locale,field.editable?"editor.editable":"editor.readonly")}
      value={draft} onChange={e=>setDraft(e.target.value)}
      onBlur={commit} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}
      disabled={!field.editable}
    />
    <span className="fieldOffset" title={"长度："+field.length+" bytes"}>{"0x"+field.offset.toString(16).toUpperCase()}</span>
  </div>;
}
const codeHex=(n:number)=>"0x"+n.toString(16).toUpperCase().padStart(3,"0");
function DiffPane({doc,locale}:{doc:RawDocument;locale:Locale}) {
  const changes=diff(doc.original,currentBytes(doc));
  return <div className="p-4">
    <p className="muted text-xs mb-3">{t(locale,"diff.help")}</p>
    {changes.length===0?<p className="text-sm">{t(locale,"diff.none")}</p>:
      <table className="diffTable"><thead><tr><th>{t(locale,"diff.offset")}</th><th>{t(locale,"diff.old")}</th><th>{t(locale,"diff.new")}</th></tr></thead>
      <tbody>{changes.map(c=><tr key={c.offset}><td>{codeHex(c.offset)}</td>
      <td>{c.before.toString(16).padStart(2,"0").toUpperCase()}</td>
      <td>{c.after.toString(16).padStart(2,"0").toUpperCase()}</td></tr>)}</tbody></table>}
  </div>;
}

export default function App() {
  const [documents,setDocuments]=useState<RawDocument[]>([]);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [tab,setTab]=useState<Tab>("hex");
  const [selectedField,setSelectedField]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const [search,setSearch]=useState("");
  const [theme,setTheme]=useState<"dark"|"light">("dark");
  const [locale,setLocale]=useState<Locale>("zh-CN");
  const fileInput=useRef<HTMLInputElement>(null);
  const doc=documents.find(x=>x.id===activeId)??null;
  const raw=doc?currentBytes(doc):null;
  const changed=doc&&raw ? diff(doc.original,raw):[];
  const fields=doc?descriptors(doc):[];
  const filtered=useMemo(()=>documents.filter(d=>d.filename.toLowerCase().includes(search.toLowerCase())),[documents,search]);

  useEffect(()=>{
    document.documentElement.classList.toggle("dark",theme==="dark");
    document.documentElement.lang=locale;
  },[theme,locale]);

  function importItems(items: ImportedFile[]) {
    if (!items.length) return;
    const incoming=items.map(item=>{
      if(item.document)return item.document;
      if(!item.bytes)throw new Error("Empty imported file");
      return createDocument(item.filename,item.bytes,item.sourcePath);
    });
    setDocuments(list=>[...list,...incoming]);
    setActiveId(incoming[incoming.length-1].id);
    setSelectedField(null);
    setMessage(t(locale,"message.imported",{count:incoming.length}));
  }
  async function openFiles() {
    try {
      const chosen=await chooseLocalFiles();
      if(chosen!==null) {importItems(chosen);return;}
      fileInput.current?.click();
    }catch(error) {setMessage(String(error));}
  }
  async function browserFiles(files:File[]) {
    try{importItems(await fromBrowserFiles(files));}catch(error){setMessage(String(error));}
  }
  function editActive(key:string,value:FieldValue) {
    if(!doc)return;
    try {
      const changedDoc=edit(doc,key,value);
      setDocuments(list=>list.map(x=>x.id===doc.id?changedDoc:x));
      setMessage(changedDoc===doc?"":t(locale,"message.edited",{field:key}));
    }catch(error){setMessage(String(error));}
  }
  function updateByte(offset:number,value:number) {
    if(!doc)return;
    try {
      const updated=editByte(doc,offset,value);
      setDocuments(list=>list.map(x=>x.id===doc.id?updated:x));
      setMessage(t(locale,"message.byteEdited",{offset:"0x"+offset.toString(16).toUpperCase()}));
    } catch(error) {setMessage(String(error));}
  }
  async function applyJson(text:string) {
    if(!doc)return;
    try {
      const updated=await applyDocumentJson(doc,text);
      setDocuments(list=>list.map(x=>x.id===doc.id?updated:x));
      setMessage(t(locale,"message.applied"));
    } catch(error) {setMessage(String(error));}
  }
  function changeHistory(direction:"undo"|"redo") {
    if(!doc)return;
    const result=direction==="undo"?undo(doc):redo(doc);
    setDocuments(list=>list.map(x=>x.id===doc.id?result:x));
    setMessage("");
  }
  async function performSave(kind:"wc"|"json") {
    if(!doc)return;
    try{if(await saveAs(doc,kind))setMessage(t(locale,"message.saved"));}
    catch(error){setMessage(String(error));}
  }
  function onDrop(event:DragEvent<HTMLElement>) {
    event.preventDefault();
    void browserFiles(Array.from(event.dataTransfer.files));
  }
  useEffect(()=>{
    function keyHandler(event:KeyboardEvent) {
      if(!(event.ctrlKey||event.metaKey))return;
      const focus=event.target as HTMLElement;
      const typing=["INPUT","TEXTAREA"].includes(focus.tagName) || focus.isContentEditable;
      if(event.key.toLowerCase()==="o") {event.preventDefault();void openFiles();}
      else if(doc && event.key.toLowerCase()==="s") {event.preventDefault();void performSave("wc");}
      else if(doc && !typing && event.key.toLowerCase()==="z") {event.preventDefault();changeHistory("undo");}
      else if(doc && !typing && event.key.toLowerCase()==="y") {event.preventDefault();changeHistory("redo");}
    }
    window.addEventListener("keydown",keyHandler);
    return ()=>window.removeEventListener("keydown",keyHandler);
  });

  return <main className="shell" onDragOver={e=>e.preventDefault()} onDrop={onDrop}>
    <header className="topbar">
      <div className="brand"><WandSparkles size={22}/><span>WonderCard Pro Editor</span>
        <span className="badge muted">v0.4 Alpha · 实验性</span></div>
      <div className="flex items-center gap-2">
        <span className="muted text-xs hidden md:inline">Windows · 本地离线 · 不联网</span>
        <Button size="icon" variant="ghost" title="切换主题" onClick={()=>setTheme(x=>x==="dark"?"light":"dark")}>
          {theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}
        </Button>
      </div>
    </header>

    <aside className="sidebar">
      <div className="flex gap-2">
        <Button size="sm" className="flex-1" onClick={()=>void openFiles()}><FolderOpen size={15}/>打开文件</Button>
        <Button size="icon" variant="outline" title="打开合成演示文件" onClick={()=>importItems([createSyntheticCard()])}><FilePlus2 size={16}/></Button>
      </div>
      <input ref={fileInput} type="file" accept=".wc6,.wc7,.wc6full,.wc7full,.bin"
        multiple hidden onChange={event=>{void browserFiles(Array.from(event.target.files??[]));event.currentTarget.value="";}}/>
      <div className="groupTitle">文件库 · {documents.length}</div>
      <div className="flex items-center rounded-md border border-border px-2 mb-2">
        <Search size={14} className="muted"/>
        <input className="bg-transparent p-2 text-sm outline-none min-w-0 w-full" placeholder="搜索文件名" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>
      {filtered.map(item=><button type="button" className={"fileItem"+(item.id===activeId?" active":"")}
        key={item.id} onClick={()=>{setActiveId(item.id);setSelectedField(null);}}>
        {item.detection.editable?<Braces size={16} className="shrink-0 mt-1"/>:<Lock size={16} className="shrink-0 mt-1"/>}
        <span className="min-w-0"><span className="block truncate text-sm font-medium">{item.filename}{hasChanges(item)?" *":""}</span>
          <span className="block text-xs muted">{item.detection.format??"未识别"} · {item.original.length} bytes</span></span>
      </button>)}
      <div className="mt-4 px-2 text-xs muted leading-6">
        WC6/WC7：基础字段实验性编辑<br/>Full / 未识别：保持只读<br/>所有文件均默认另存为
      </div>
    </aside>

    <section className="workspace">
      {!doc || !raw ?
        <div className="empty">
          <FolderOpen size={56} className="muted mb-4"/>
          <h1 className="text-xl font-semibold mb-3">打开 WonderCard 文件</h1>
          <p className="muted text-sm max-w-md mb-5">选择或拖入 WC6、WC7、Full 文件；仅在本地内存中读取。尚未验证的格式将保持只读。</p>
          <div className="flex gap-3">
            <Button onClick={()=>void openFiles()}><FolderOpen size={16}/>选择文件</Button>
            <Button variant="outline" onClick={()=>importItems([createSyntheticCard()])}><FilePlus2 size={16}/>合成示例</Button>
          </div>
        </div>
      :
        <>
          <div className="toolbar">
            <div className="min-w-0 mr-auto">
              <div className="font-semibold text-sm truncate">{doc.filename} {hasChanges(doc)?"●":""}</div>
              <div className="muted text-xs">{doc.detection.format??"未知格式"} · {doc.original.length} bytes · {changed.length} 字节修改</div>
            </div>
            <Button size="sm" variant="outline" disabled={doc.cursor===0} onClick={()=>changeHistory("undo")}><Undo2 size={15}/>撤销</Button>
            <Button size="sm" variant="outline" disabled={doc.cursor===doc.history.length-1} onClick={()=>changeHistory("redo")}><Redo2 size={15}/>重做</Button>
            <Button size="sm" variant="outline" onClick={()=>void performSave("json")}><FileDown size={15}/>导出 JSON</Button>
            <Button size="sm" onClick={()=>void performSave("wc")}><Save size={15}/>另存为 WC</Button>
          </div>
          <div className="editorGrid">
            <div className="panel">
              <div className="panelTitle flex items-center justify-between">
                <span>字段检查器</span>
                <span className="badge">{doc.detection.editable?"部分可编辑":"只读"}</span>
              </div>
              <div className="panelBody">
                <div className="alert flex gap-2"><ShieldCheck className="shrink-0 mt-1" size={16}/>
                  <span>{doc.detection.reason}。本阶段不做官方配信来源及游戏合法性保证。</span>
                </div>
                {fields.length?
                  fields.map(field=><FieldRow key={doc.id+"-"+field.key} doc={doc} field={field}
                    selected={selectedField===field.key} onSelect={()=>setSelectedField(field.key)}
                    onEdit={value=>editActive(field.key,value)}/>) :
                  <div className="text-sm muted">无法可靠判断格式。请使用 HEX 只读视图检查源文件。</div>}
              </div>
            </div>
            <div className="panel flex flex-col">
              <div className="panelTitle flex items-center gap-2 justify-between">
                <span>字节检查工作台</span>
                <span className="text-xs muted">原始字节为权威</span>
              </div>
              <div className="flex border-b border-border px-3">
                {(["hex","diff","json"] as const).map(view=><button type="button" key={view}
                  className={"tabButton"+(tab===view?" active":"")} onClick={()=>setTab(view)}>
                  {view==="hex"?"HEX":view==="diff"?"差异 Diff":"JSON"}
                </button>)}
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                {tab==="hex"?<HexPane doc={doc} selectedField={selectedField} onSelectField={setSelectedField}/>:
                  tab==="diff"?<div className="h-full overflow-auto"><DiffPane doc={doc}/></div>:
                  <Suspense fallback={<div className="p-4 muted text-sm">正在加载本地 Monaco 编辑器…</div>}>
                    <JsonPane doc={doc} theme={theme}/>
                  </Suspense>}
              </div>
            </div>
          </div>
        </>
      }
      {message?<div role="status" className="border-t border-border bg-surface px-4 py-2 text-xs flex gap-2 items-center">
        <RotateCcw size={12}/><span className="truncate">{message}</span>
        <button type="button" className="ml-auto muted" onClick={()=>setMessage("")}>关闭</button></div>:null}
    </section>
    <footer className="statusbar"><span>WonderCard Toolkit · Pro Editor</span><span>{doc?.detection.format??"无打开文件"}</span>
      <span>{doc?"修改字节："+changed.length:"本地模式"}</span>
      <span className="ml-auto">实验版 · 未经真实卡全面校验</span>
    </footer>
  </main>;
}
