import { describe, expect, it } from "vitest";
import { CORE_SIZE, FULL_SIZE, createDocument, currentBytes, descriptors, detect, diff, edit, hasChanges, readField, redo, undo, verifyExport } from "./wondercard";

function sample(format: "wc6" | "wc7" | "wc6full" = "wc6"): Uint8Array {
  const full=format==="wc6full";
  const raw = new Uint8Array(full ? FULL_SIZE : CORE_SIZE);
  const offset=full ? 0x208 : 0;
  const v=new DataView(raw.buffer);
  v.setUint16(offset, 25, true);
  v.setUint32(offset+0x4c, format==="wc7" ? 150317 : 20150317, true);
  raw[offset+0x51]=0;
  raw[offset+0xd0]=10;
  raw[offset+0x105]=0xa5; // unknown byte must not be touched
  return raw;
}

describe("raw byte invariants",()=>{
  it("never shares imported input memory",()=>{
    const raw=sample("wc6");
    const doc=createDocument("test.wc6",raw);
    raw[0]=0xff;
    expect(verifyExport(doc)[0]).toBe(25);
    const leaked=currentBytes(doc); leaked[0]=0xff;
    expect(verifyExport(doc)[0]).toBe(25);
  });
  it("unmodified byte roundtrip returns exactly original",()=>{
    const raw=sample("wc6");
    const doc=createDocument("card.wc6",raw);
    expect(verifyExport(doc)).toEqual(raw);
    expect(hasChanges(doc)).toBe(false);
  });
  it("changes only declared level byte and preserves unknown byte",()=>{
    const doc=createDocument("card.wc6",sample("wc6"));
    const next=edit(doc,"pokemon.level",50);
    expect(diff(doc.original,verifyExport(next))).toEqual([{offset:0xd0,before:10,after:50}]);
    expect(verifyExport(next)[0x105]).toBe(0xa5);
    expect(verifyExport(doc)[0xd0]).toBe(10);
    expect(verifyExport(undo(next))).toEqual(doc.original);
    expect(verifyExport(redo(undo(next)))).toEqual(verifyExport(next));
  });
  it("edits WC6 date at documented offset 0x4C (2D → 2F)",()=>{
    const doc=createDocument("arceus.wc6",sample("wc6"));
    const changed=edit(doc,"date","2015-03-19");
    expect(diff(doc.original,verifyExport(changed))).toEqual([{offset:0x4c,before:0x2d,after:0x2f}]);
  });
  it("handles WC7 date with 2000 offset and blocks invalid dates",()=>{
    const doc=createDocument("test.wc7",sample("wc7"));
    const field=descriptors(doc).find(f=>f.key==="date")!;
    expect(readField(currentBytes(doc),"wc7",field)).toBe("2015-03-17");
    expect(()=>edit(doc,"date","1999-01-01")).toThrow();
    expect(()=>edit(doc,"date","2015-02-30")).toThrow();
  });
  it("rejects edits to Full but permits unchanged export",()=>{
    const raw=sample("wc6full");
    const doc=createDocument("x.wc6full",raw);
    expect(doc.detection.editable).toBe(false);
    expect(verifyExport(doc)).toEqual(raw);
    expect(()=>edit(doc,"date","2015-03-19")).toThrow();
  });
  it("does not guess ambiguous extension or accept size mismatch",()=>{
    const data=sample("wc6");
    expect(detect("unknown.bin",data).candidates).toEqual(["wc6","wc7"]);
    expect(detect("unknown.bin",data).editable).toBe(false);
    expect(detect("truncated.wc6",data.slice(1)).format).toBeNull();
    const doc=createDocument("unknown.bin",data);
    expect(()=>edit(doc,"card_id",12)).toThrow();
  });
  it("rejects out-of-range value and readonly fields",()=>{
    const doc=createDocument("test.wc6",sample("wc6"));
    expect(()=>edit(doc,"pokemon.level",256)).toThrow();
    expect(()=>edit(doc,"card_type",1)).toThrow();
    expect(()=>edit(doc,"title","Fake")).toThrow();
  });
});