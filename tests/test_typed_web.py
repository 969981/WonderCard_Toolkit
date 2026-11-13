"""Cross-runtime typed viewer, draft editor and safe export checks with synthetic bytes."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

def run():
    html=(ROOT/'web/standalone.html').read_text(encoding='utf8')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_function('window.WonderCardStudio.getFiles().length===1')
        for fmt,size,kind,sp_off in [('wc8',0x2d0,0x11,0x240),('wb8',0x2dc,0x11,0x288),('wa8',0x2c8,0xf,0x238),('wc9',0x2c8,0x11,0x238),('wa9',0x2c8,0x11,0x270)]:
            raw=bytearray(size);raw[kind]=1;raw[8:10]=(99).to_bytes(2,'little');raw[sp_off:sp_off+2]=(133).to_bytes(2,'little')
            page.evaluate('async ({fmt,buf})=>window.WonderCardStudio.importBytes("sample."+fmt,new Uint8Array(buf))',{'fmt':fmt,'buf':list(raw)})
            assert page.locator('#fields-pokemon input').count()>25,fmt
            assert page.locator('#fields-header input').count()>3,fmt
            assert page.locator('#hero-gen').inner_text().endswith('8' if fmt[-1]=='8' else '9') or page.locator('#hero-gen').inner_text().endswith('VIII' if fmt[-1]=='8' else 'IX'),fmt
            assert bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))==raw,fmt
            fld=page.locator('#typed-pokemon-level')
            fld.fill('42');fld.dispatch_event('change')
            assert page.evaluate('window.WonderCardStudio.currentState().diff.length')==1,fmt
            assert page.locator('#export-bin').is_disabled(),fmt
            page.locator('#locale-switch').select_option('ko')
            assert page.evaluate('window.WonderCardStudio.currentState().diff.length')==1,fmt
            assert page.locator('#export-bin').is_disabled(),fmt
            page.locator('#locale-switch').select_option('zh-CN')
            assert not errors,(fmt,errors)
        for fmt,size in [('pgf',0xcc),('pcd',0x358),('pgt',0x104),('wc5full',0x2d0)]:
            raw=bytes(size)
            page.evaluate('async ({fmt,buf})=>window.WonderCardStudio.importBytes("sample."+fmt,new Uint8Array(buf))',{'fmt':fmt,'buf':list(raw)})
            assert page.locator('#fields-header input').count()>0
            assert page.locator('#fields-header input:not([disabled])').count()==0
            assert page.locator('#export-bin').is_enabled()
        assert not errors,errors
        browser.close()
    print('PASS: 5 Gen8/9 semantic forms + draft changes + export lock; Gen4/5 read-only')

if __name__=='__main__':run()
