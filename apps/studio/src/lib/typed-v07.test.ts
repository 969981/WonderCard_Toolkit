import {describe,expect,it} from "vitest";
import {TYPED_FORMATS,type TypedFormat} from "./typed-v07";
import {canEditByte,createDocument,currentBytes,descriptors,detect,edit,editByte,readField,verifyExport} from "./wondercard";
import {exportDocumentJson,importDocumentJson} from "./json";

function synthetic(format:TypedFormat,giftKind:number=1):Uint8Array {
  const layout=TYPED_FORMATS[format];
  const raw=new Uint8Array(layout.size);
  raw[layout.kind]=giftKind;
  // Unmapped bytes must survive every no-op save and JSON roundtrip.
  raw[layout.size-1]=0xa5;
  return raw;
}
const formats=Object.keys(TYPED_FORMATS) as TypedFormat[];

describe("Gen4/5/8/9 v0.7 snapshot integration (strict read-only)",()=>{
  it("recognizes each exact extension/size without permitting edits",()=>{
    for(const format of formats) {
      const raw=synthetic(format);
      const doc=createDocument("fixture."+format,raw);
      expect(doc.detection.format).toBe(format);
      expect(doc.detection.editable).toBe(false);
      expect(verifyExport(doc)).toEqual(raw);
      expect(descriptors(doc).length).toBeGreaterThan(0);
      expect(()=>edit(doc,descriptors(doc)[0].key,1)).toThrow();
      expect(canEditByte(doc,descriptors(doc)[0].offset)).toBe(false);
      expect(()=>editByte(doc,descriptors(doc)[0].offset,42)).toThrow();
    }
  });
  it("parses typed fields from v0.7 offsets only as numeric read-only values",()=>{
    for(const format of ["wc8","wb8","wa8","wc9","wa9","pgf","wc5full"] as const){
      const raw=synthetic(format);
      const layout=TYPED_FORMATS[format];
      const level=layout.pokemon.level;
      raw[level.offset]=42;
      const doc=createDocument("demo."+format,raw);
      const field=descriptors(doc).find(x=>x.key==="pokemon.level");
      expect(field).toBeDefined();
      expect(field?.offset).toBe(level.offset);
      expect(field?.editable).toBe(false);
      expect(readField(currentBytes(doc),format,field!)).toBe(42);
    }
  });
  it("uses Pokémon/item discriminator and does not misread item payload as Pokémon",()=>{
    for(const format of ["wc8","wb8","wa8","wc9","wa9"] as const){
      const item=createDocument("gift."+format,synthetic(format,2));
      expect(descriptors(item).some(x=>x.key==="item.item_1")).toBe(true);
      expect(descriptors(item).some(x=>x.key==="pokemon.level")).toBe(false);
      const unknown=createDocument("unknown."+format,synthetic(format,99));
      expect(descriptors(unknown).every(x=>x.key.startsWith("card."))).toBe(true);
    }
  });
  it("refuses length mismatch and ambiguous same-size unknown extension",()=>{
    for(const format of formats) {
      const data=synthetic(format);
      expect(detect("wrong."+format,data.slice(1)).format).toBeNull();
      expect(detect("wrong."+format,data.slice(1)).editable).toBe(false);
    }
    const candidates=detect("unknown.bin",synthetic("wc9"));
    expect(candidates.format).toBeNull();
    expect(candidates.candidates).toContain("wc9");
    expect(candidates.candidates).toContain("wa9");
    expect(candidates.candidates).toContain("wa8");
    expect(candidates.editable).toBe(false);
  });
  it("does not permit forged modified exports even when a document history is corrupted",()=>{
    const initial=createDocument("a.wc9",synthetic("wc9"));
    const altered=currentBytes(initial);altered[0x23]=99;
    const forged={...initial,history:[initial.original,altered],cursor:1};
    expect(()=>verifyExport(forged)).toThrow();
  });
  it("roundtrips 10 synthetic formats via JSON v2 byte-exactly, without granting edits",async()=>{
    for(const format of formats) {
      const raw=synthetic(format);
      const json=await exportDocumentJson(createDocument("card."+format,raw));
      const loaded=await importDocumentJson(json);
      expect(loaded.detection.editable).toBe(false);
      expect(verifyExport(loaded)).toEqual(raw);
      const tampered=JSON.parse(json);
      const key=Object.keys(tampered.fields)[0];
      tampered.fields[key]=42;
      await expect(importDocumentJson(JSON.stringify(tampered))).rejects.toThrow();
    }
  });
});
