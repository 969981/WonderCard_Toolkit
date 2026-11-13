import * as monaco from "monaco-editor";
import Editor, { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import { safeJson, type RawDocument } from "@/lib/wondercard";

const scope = self as typeof self & {
  MonacoEnvironment?: {getWorker: (_moduleId: string, label: string)=>Worker}
};
scope.MonacoEnvironment = {
  getWorker(_id,label){ return label==="json" ? new JsonWorker() : new EditorWorker(); }
};
loader.config({monaco});

export default function JsonPane({doc, theme}:{doc:RawDocument;theme:"dark"|"light"}) {
  return <div style={{height:"100%",minHeight:300}} aria-label="JSON 原始快照与修改记录">
    <Editor
      height="100%" language="json" theme={theme==="dark"?"vs-dark":"light"}
      value={safeJson(doc)} options={{readOnly:true,minimap:{enabled:false},wordWrap:"on",fontSize:12,scrollBeyondLastLine:false}}
    />
  </div>;
}
