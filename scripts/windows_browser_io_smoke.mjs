/**
 * Windows browser E2E of the same React UI, using installed Microsoft Edge.
 * Does NOT exercise Tauri's native filesystem plugin dialogs.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdtemp,readFile,rm,writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const root=fileURLToPath(new URL("../",import.meta.url));
const viteCli=join(root,"node_modules","vite","bin","vite.js");
const work=await mkdtemp(join(tmpdir(),"wondercard-smoke-"));
const server=spawn(process.execPath,[viteCli,"--host","127.0.0.1","--port","1420"],{
 cwd:join(root,"apps","studio"),env:process.env,stdio:["ignore","pipe","pipe"]
});
let viteOutput="";
server.stdout?.on("data",chunk=>{viteOutput+=String(chunk);});
server.stderr?.on("data",chunk=>{viteOutput+=String(chunk);});
let browser;
async function ready() {
 for(let n=0;n<60;n++){
   try {const response=await fetch("http://127.0.0.1:1420");if(response.ok)return;}
   catch{}
   await sleep(500);
 }
 throw new Error("Vite preview did not start in time (exit="+server.exitCode+"): "+viteOutput.slice(-4000));
}
try {
 await ready();
 browser=await chromium.launch({channel:"msedge",headless:true});
 const page=await browser.newPage({acceptDownloads:true});
 const errors=[];
 page.on("pageerror",error=>errors.push(String(error)));
 await page.goto("http://127.0.0.1:1420");
 await page.getByRole("button",{name:"合成示例"}).click();
 await page.getByRole("spinbutton",{name:"等级"}).fill("50");
 await page.getByRole("spinbutton",{name:"等级"}).press("Enter");
 const downloadPromise=page.waitForEvent("download");
 await page.getByRole("button",{name:"另存为 WC"}).click();
 const binaryDownload=await downloadPromise;
 const binaryPath=join(work,"edited.wc6");
 await binaryDownload.saveAs(binaryPath);
 const saved=await readFile(binaryPath);
 if(saved.length!==0x108 || saved[0xd0]!==50 || saved[0x105]!==0xa5)
   throw new Error("WC download mismatch; changed field or unknown sentinel corrupted");
 const jsonPromise=page.waitForEvent("download");
 await page.getByRole("button",{name:"导出 JSON v2"}).click();
 const jsonDownload=await jsonPromise;
 const jsonPath=join(work,"edited.wc6.json");
 await jsonDownload.saveAs(jsonPath);
 const document=JSON.parse(await readFile(jsonPath,"utf8"));
 if(document.fields["pokemon.level"]!==50 || document.patches.length<1)
   throw new Error("JSON v2 did not preserve edited level");
 await page.locator('input[type="file"]').setInputFiles(jsonPath);
 await page.getByRole("spinbutton",{name:"等级"}).waitFor();
 const after=await page.getByRole("spinbutton",{name:"等级"}).inputValue();
 if(after!=="50")throw new Error("JSON v2 re-import lost edited level");
 const combo=page.getByRole("combobox",{name:"界面语言"});
 await combo.selectOption("en");
 await page.getByRole("button",{name:"Save WC as…"}).waitFor();
 await page.getByRole("spinbutton",{name:"Level"}).waitFor();
 await page.getByRole("combobox",{name:"Interface language"}).selectOption("ja");
 await page.getByRole("spinbutton",{name:"レベル"}).waitFor();
 await page.getByRole("combobox",{name:"表示言語"}).selectOption("zh-TW");
 await page.getByRole("spinbutton",{name:"等級"}).waitFor();
 const full=new Uint8Array(0x310);
 full[0x208+0x51]=0;
 full[0x208+0xd0]=10;
 const fullPath=join(work,"readonly.wc6full");
 await writeFile(fullPath,full);
 await page.locator('input[type="file"]').setInputFiles(fullPath);
 await page.getByRole("spinbutton",{name:"等級 (唯讀)"}).waitFor();
 if(await page.getByRole("spinbutton",{name:"等級 (唯讀)"}).isEnabled())
   throw new Error("Full field unexpectedly editable");
 if(errors.length)throw new Error("Page errors: "+errors.join("; "));
 console.log("PASS Windows/Edge React UI: import, edit, binary save, JSON v2 export/reimport, four locales, Full read-only");
 console.log("LIMIT: Browser Playwright test is not Tauri native dialog I/O");
}finally{
 await browser?.close();
 server.kill();
 await rm(work,{recursive:true,force:true});
}
