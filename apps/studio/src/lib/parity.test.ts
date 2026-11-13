import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {createDocument,currentBytes,descriptors,diff,edit,readField,toHex,verifyExport} from "./wondercard";
import {fromHex,sha256} from "./json";

type Vector={
 format:"wc6"|"wc7"|"wc6full"|"wc7full";filename:string;
 raw_hex:string;modified_hex:string;raw_sha256:string;modified_sha256:string;
 baseline_fields:Record<string,number|string|null>;
 edited:boolean;
 byte_diffs:{offset:string;old:string;new:string}[];
};
const data: {schema:string;vectors:Vector[]} =
  JSON.parse(readFileSync(new URL("../../../../tests/fixtures/generated-parity.json",import.meta.url),"utf8"));

describe("Python -> TypeScript byte-for-byte vectors",()=>{
 it("uses all four synthetic format classes",()=>{
   expect(data.vectors.map(v=>v.format)).toEqual(["wc6","wc7","wc6full","wc7full"]);
 });
 for(const vector of data.vectors){
   it(vector.format+" parses exact fields and reproduces Python byte output",async()=>{
     const raw=fromHex(vector.raw_hex),doc=createDocument(vector.filename,raw);
     expect(doc.detection.format).toBe(vector.format);
     expect(await sha256(raw)).toBe(vector.raw_sha256);
     const specs=descriptors(doc),current=currentBytes(doc);
     for(const [key,value] of Object.entries(vector.baseline_fields)){
       const field=specs.find(f=>f.key===key);
       expect(field,"missing field "+key).toBeDefined();
       expect(readField(current,vector.format,field!)).toBe(value);
     }
     let changed=doc;
     if(vector.edited){
       changed=edit(changed,"date","2015-03-19");
       changed=edit(changed,"pokemon.level",50);
     }
     const result=verifyExport(changed);
     expect(toHex(result).toLowerCase()).toBe(vector.modified_hex);
     expect(await sha256(result)).toBe(vector.modified_sha256);
     expect(diff(raw,result).map(c=>({
       offset:"0x"+c.offset.toString(16).toUpperCase().padStart(3,"0"),
       old:c.before.toString(16).toUpperCase().padStart(2,"0"),
       new:c.after.toString(16).toUpperCase().padStart(2,"0")
     }))).toEqual(vector.byte_diffs);
   });
 }
});
