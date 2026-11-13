import { useMemo } from "react";
import { currentBytes, descriptors, diff, type RawDocument } from "@/lib/wondercard";

interface Props {
  doc: RawDocument;
  selectedField: string | null;
  onSelectField: (fieldId: string | null) => void;
}

export function HexPane({doc,selectedField,onSelectField}:Props) {
  const bytes=currentBytes(doc);
  const specs=descriptors(doc);
  const changed=useMemo(()=>new Set(diff(doc.original,bytes).map(x=>x.offset)),[doc]);
  const selected=specs.find(x=>x.key===selectedField);
  const offsetFor=(n:number)=>{
    const field=specs.find(f=>n>=f.offset && n<f.offset+f.length);
    onSelectField(field?.key ?? null);
  };
  const rows=[];
  for(let pos=0;pos<bytes.length;pos+=16){
    const line=bytes.slice(pos,pos+16);
    rows.push(
      <div className="hexRow" key={pos}>
        <span className="hexOffset">{pos.toString(16).padStart(4,"0").toUpperCase()}</span>
        <div className="hexBytes">
          {Array.from(line, (b,i)=>{
            const address=pos+i;
            const inField=selected && address>=selected.offset && address<selected.offset+selected.length;
            return <button key={address} type="button" title={"offset 0x"+address.toString(16).toUpperCase()}
              className={"hexByte"+(changed.has(address)?" changed":"")+(inField?" inField":"")}
              onClick={()=>offsetFor(address)}>{b.toString(16).padStart(2,"0").toUpperCase()}</button>;
          })}
        </div>
        <span className="hexAscii">{Array.from(line,b=>b>=32&&b<=126?String.fromCharCode(b):".").join("")}</span>
      </div>
    );
  }
  return <div className="hexScroll" aria-label="十六进制预览">
    {rows}
  </div>;
}
