/**
 * Private opt-in samples: compare legacy Python and TS in memory.
 * Do not log filenames, raw bytes, or sensitive fields to public CI.
 */
import {spawnSync} from "node:child_process";
import {readdirSync,readFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {describe,it,expect} from "vitest";
import {createDocument,currentBytes,descriptors,edit,readField,verifyExport} from "./wondercard";
import {sha256} from "./json";

const dir=process.env.WONDERCARD_REAL_FIXTURES_DIR;
const valid=new Set(["wc6","wc7","wc6full","wc7full"]);
interface Probe {
  source_sha:string;modified_hex:string;modified_sha:string;
  fields:Record<string,number|string|null>;
}
describe("private user-owned real card parity",()=>{
  it.skipIf(!dir)("checks Python versus TS for every supplied byte and field",async()=>{
    const cards=readdirSync(resolve(dir!),{withFileTypes:true})
      .filter(x=>x.isFile() && valid.has(x.name.split(".").at(-1)?.toLowerCase()??""))
      .slice(0,300);
    expect(cards.length).toBeGreaterThan(0);
    const script=resolve(process.cwd(),"../../scripts/private_real_card_probe.py");
    const python=process.env.PYTHON_BINARY||"python";
    for(const file of cards){
      const raw=new Uint8Array(readFileSync(join(resolve(dir!),file.name)));
      if(raw.length>2*1024*1024)throw Error("Private fixture size limit exceeded");
      const format=file.name.split(".").at(-1)!.toLowerCase();
      const hash=await sha256(raw);
      const id=hash.slice(0,12); // only a digest prefix may appear in failures
      const child=spawnSync(python,[script,format],{
        input:Buffer.from(raw),encoding:"utf8",maxBuffer:5*1024*1024
      });
      if(child.status!==0)throw Error("Legacy Python probe error on SHA "+id);
      const legacy:Probe=JSON.parse(child.stdout);
      if(legacy.source_sha!==hash)throw Error("Source SHA mismatch "+id);
      const doc=createDocument(file.name,raw);
      if(doc.detection.format!==format)throw Error("Format detection mismatch "+id);
      const roundtrip=verifyExport(doc);
      if(roundtrip.length!==raw.length||roundtrip.some((byte,i)=>byte!==raw[i]))
        throw Error("No-edit raw mismatch "+id);
      const specs=descriptors(doc);
      for(const field of specs){
        if(!(field.key in legacy.fields)) continue;
        const ts=readField(currentBytes(doc),doc.detection.format!,field);
        if(ts!==legacy.fields[field.key]) throw Error("Field mismatch "+id+" "+field.key);
      }
      let updated=doc;
      if(!format.endsWith("full")){
        const idSpec=specs.find(x=>x.key==="card_id")!;
        const cardId=readField(raw,doc.detection.format!,idSpec);
        if(typeof cardId!=="number")throw Error("Unexpected card ID "+id);
        updated=edit(doc,"card_id",cardId^1);
      }
      const after=verifyExport(updated);
      if(legacy.modified_hex.length!==after.length*2)
        throw Error("Modified size mismatch "+id);
      for(let i=0;i<after.length;i++) {
        const expected=Number.parseInt(legacy.modified_hex.slice(i*2,i*2+2),16);
        if(after[i]!==expected)throw Error("Byte parity mismatch "+id+" offset 0x"+i.toString(16));
      }
      if(await sha256(after)!==legacy.modified_sha) throw Error("Edited SHA mismatch "+id);
    }
    console.info("PASS private real-card Python/TS cross-check: "+cards.length+" (no uploaded payloads)");
  });
});
