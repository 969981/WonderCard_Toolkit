import {useMemo, useState, type KeyboardEvent} from "react";
import {canEditByte,currentBytes,descriptors,diff,type RawDocument} from "@/lib/wondercard";
import {t,type Locale} from "@/i18n";
interface Props {
 doc:RawDocument; selectedField:string|null; onSelectField:(key:string|null)=>void;
 onEditByte:(offset:number,value:number)=>void;locale:Locale;
}
/** HEX editing is deliberately restricted to L4-writable field bytes. Unknown areas remain locked. */
export function HexPane({doc,selectedField,onSelectField,onEditByte,locale}:Props) {
 const bytes=currentBytes(doc),specs=descriptors(doc);
 const changes=useMemo(()=>new Set(diff(doc.original,bytes).map(x=>x.offset)),[doc]);
 const [editing,setEditing]=useState<number|null>(null),[draft,setDraft]=useState("");
 const selected=specs.find(f=>f.key===selectedField);
 function select(address:number) {
   onSelectField(specs.find(f=>address>=f.offset&&address<f.offset+f.length)?.key??null);
 }
 function begin(address:number) {
   select(address);
   if(!canEditByte(doc,address))return;
   setEditing(address);setDraft(bytes[address].toString(16).padStart(2,"0").toUpperCase());
 }
 function commit() {
   if(editing===null)return;
   if(!/^[0-9a-fA-F]{2}$/.test(draft))return;
   onEditByte(editing,Number.parseInt(draft,16));
   setEditing(null);
 }
 const rows=[];
 for(let pos=0;pos<bytes.length;pos+=16){
   const line=bytes.slice(pos,pos+16);
   rows.push(<div className="hexRow" key={pos}>
     <span className="hexOffset">{pos.toString(16).padStart(4,"0").toUpperCase()}</span>
     <div className="hexBytes">
       {Array.from(line,(value,index)=>{
         const address=pos+index;
         const inField=selected&&address>=selected.offset&&address<selected.offset+selected.length;
         const editable=canEditByte(doc,address);
         if(editing===address)
           return <input key={address} className="hexInput" aria-label={t(locale,"hex.byteInput")}
             autoFocus value={draft} maxLength={2} onChange={e=>setDraft(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,""))}
             onKeyDown={(e:KeyboardEvent<HTMLInputElement>)=>{
               if(e.key==="Enter"){e.preventDefault();commit();}
               else if(e.key==="Escape"){setEditing(null);}
             }}
             onBlur={()=>setEditing(null)}/>;
         return <button key={address} type="button" title={t(locale,editable?"hex.editHint":"hex.lockedHint")}
           aria-label={"0x"+address.toString(16)+": "+value.toString(16).padStart(2,"0")}
           className={"hexByte"+(changes.has(address)?" changed":"")+(inField?" inField":"")+(editable?" writable":"")}
           onClick={()=>select(address)} onDoubleClick={()=>begin(address)}>
           {value.toString(16).padStart(2,"0").toUpperCase()}</button>;
       })}
     </div>
     <span className="hexAscii">{Array.from(line,x=>x>=32&&x<=126?String.fromCharCode(x):".").join("")}</span>
   </div>);
 }
 return <div className="hexScroll" aria-label={t(locale,"hex.title")}>
   <p className="text-xs muted mb-2">{t(locale,"hex.help")}</p>{rows}
 </div>;
}
