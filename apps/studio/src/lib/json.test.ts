import {describe,it,expect} from "vitest";
import {createDocument,currentBytes,diff,edit,undo,verifyExport} from "./wondercard";
import {applyDocumentJson,exportDocumentJson,importDocumentJson,JSON_SCHEMA,sha256} from "./json";

function sample(format:"wc6"|"wc7"|"wc6full"="wc6"):Uint8Array {
 const full=format.endsWith("full"), raw=new Uint8Array(full?0x310:0x108);
 const base=full?0x208:0,view=new DataView(raw.buffer);
 view.setUint16(base+0x00,25,true);
 view.setUint32(base+0x4c,format==="wc7"?150317:20150317,true);
 raw[base+0x51]=0;raw[base+0xd0]=10;raw[base+0x107]=0xaa;
 return raw;
}
describe("JSON v2 lossless interchange",()=>{
 it("preserves all bytes with no edit on WC6 and Full",async()=>{
   for(const format of ["wc6","wc7","wc6full"] as const){
     const original=sample(format),doc=createDocument("example."+format,original);
     const json=await exportDocumentJson(doc);
     expect(JSON.parse(json).schema).toBe(JSON_SCHEMA);
     const reloaded=await importDocumentJson(json);
     expect(verifyExport(reloaded)).toEqual(original);
     expect(await sha256(verifyExport(reloaded))).toBe(await sha256(original));
   }
 });
 it("retains byte-exact patched fields, unknown bytes, and undo",async()=>{
   const base=createDocument("pokemon.wc6",sample());
   const edited=edit(edit(base,"pokemon.level",50),"date","2015-03-19");
   const json=await exportDocumentJson(edited);
   const reloaded=await importDocumentJson(json);
   expect(verifyExport(reloaded)).toEqual(verifyExport(edited));
   expect(verifyExport(reloaded)[0x107]).toBe(0xaa);
   const applied=await applyDocumentJson(base,json);
   expect(diff(base.original,currentBytes(applied))).toEqual(diff(base.original,verifyExport(edited)));
   expect(verifyExport(undo(applied))).toEqual(base.original);
 });
 it("rejects raw snapshot tampering and false baseline",async()=>{
   const base=createDocument("x.wc6",sample());
   const json=JSON.parse(await exportDocumentJson(base));
   json.raw_hex="FF"+json.raw_hex.slice(2);
   await expect(importDocumentJson(JSON.stringify(json))).rejects.toThrow("SHA-256");
   json.raw_hex=JSON.parse(await exportDocumentJson(base)).raw_hex;
   json.baseline_fields["pokemon.level"]=99;
   await expect(importDocumentJson(JSON.stringify(json))).rejects.toThrow("Baseline");
 });
 it("rejects unexplained patches, readonly edits and malformed structures",async()=>{
   const base=createDocument("x.wc6",sample());
   const json=JSON.parse(await exportDocumentJson(base));
   json.fields["pokemon.level"]=20;
   await expect(importDocumentJson(JSON.stringify(json))).rejects.toThrow("Patch");
   json.fields["pokemon.level"]=10;
   json.fields.title="another";
   await expect(importDocumentJson(JSON.stringify(json))).rejects.toThrow();
   delete json.fields.title;
   await expect(importDocumentJson(JSON.stringify(json))).rejects.toThrow("missing");
 });
 it("Full write stays locked even if JSON field edited",async()=>{
   const doc=createDocument("x.wc6full",sample("wc6full"));
   const json=JSON.parse(await exportDocumentJson(doc));
   json.fields.card_id=999;
   await expect(importDocumentJson(JSON.stringify(json))).rejects.toThrow();
 });
});
