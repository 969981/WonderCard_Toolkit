import {useEffect,useState} from "react";
import * as monaco from "monaco-editor";
import Editor,{loader} from "@monaco-editor/react";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import {exportDocumentJson} from "@/lib/json";
import {Button} from "@/components/ui/button";
import {t,type Locale} from "@/i18n";
import type {RawDocument} from "@/lib/wondercard";

const scope=self as typeof self & {MonacoEnvironment?:{getWorker:(_moduleId:string,label:string)=>Worker}};
scope.MonacoEnvironment={getWorker(_id,label){return label==="json"?new JsonWorker():new EditorWorker();}};
loader.config({monaco});

export default function JsonPane({doc,theme,locale,onApply}:{
 doc:RawDocument;theme:"dark"|"light";locale:Locale;onApply:(text:string)=>void
}) {
 const [value,setValue]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{
   let active=true;
   setLoading(true);
   exportDocumentJson(doc).then(json=>{if(active){setValue(json);setLoading(false);}})
     .catch(error=>{if(active){setValue(String(error));setLoading(false);}});
   return ()=>{active=false;};
 },[doc]);
 return <div className="flex flex-col h-full min-h-0">
   <div className="p-2 flex gap-2 items-center border-b border-border">
     <p className="text-xs muted flex-1">{t(locale,"editor.jsonHelp")}</p>
     <Button size="sm" disabled={loading||!doc.detection.editable} onClick={()=>onApply(value)}>
       {t(locale,"editor.jsonApply")}
     </Button>
   </div>
   <div className="min-h-0 flex-1" aria-label={t(locale,"editor.json")}>
     <Editor height="100%" language="json" theme={theme==="dark"?"vs-dark":"light"}
       value={value} onChange={next=>setValue(next??"")}
       options={{readOnly:!doc.detection.editable,minimap:{enabled:false},wordWrap:"on",
         fontSize:12,scrollBeyondLastLine:false,automaticLayout:true}}
     />
   </div>
 </div>;
}
