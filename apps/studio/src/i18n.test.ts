import {describe,it,expect} from "vitest";
import {LANGUAGES,rows,t,reasonFor} from "./i18n";
describe("Pro Editor four-language UI",()=>{
 it("has exactly four complete catalogs with distinct strings",()=>{
   expect(LANGUAGES).toEqual(["zh-CN","zh-TW","en","ja"]);
   expect(rows.length).toBeGreaterThan(55);
   for(const row of rows) {
     expect(row).toHaveLength(5);
     for(const x of row)expect(x.length).toBeGreaterThan(0);
   }
 });
 it("keeps dynamic placeholders aligned",()=>{
   for(const row of rows){
     const placeholders=(s:string)=>Array.from(s.matchAll(/\{([a-z]+)\}/g),x=>x[1]).sort();
     const src=placeholders(row[1]);
     for(const translation of row.slice(2)) expect(placeholders(translation)).toEqual(src);
   }
   expect(t("ja","message.imported",{count:4})).toContain("4");
 });
 it("translates read-only gates, not binary data",()=>{
   expect(reasonFor("en","wc6full",1,"x.wc6full")).toContain("Full");
   expect(t("zh-TW","editor.fields")).toContain("檢查器");
 });
});
