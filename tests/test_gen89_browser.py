"""WC8 and WA9 browser byte parity, run locally with Playwright + Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from wondercard.integrity import update_full_card_checksum
from wondercard.core import to_document,from_document
from wondercard.typed import FORMATS

ROOT=Path(__file__).resolve().parents[1]

def run():
    html=(ROOT/'web/standalone.html').read_text(encoding='utf8')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_function('window.WonderCardStudio.getFiles().length===1')
        for fmt in ('wc8','wa9'):
            b=bytearray(FORMATS[fmt]['size'])
            b[FORMATS[fmt]['kind']]=1
            b[FORMATS[fmt]['pokemon']['level'][1]]=31
            update_full_card_checksum(b,fmt)
            doc=to_document(b,fmt=fmt)
            doc['fields']['pokemon']['level']=46
            correct=from_document(doc)
            page.evaluate('(args)=>window.WonderCardStudio.importBytes(args.name,new Uint8Array(args.data))',{'name':'test.'+fmt,'data':list(b)})
            field=page.locator('#typed-pokemon-level')
            field.fill('46');field.dispatch_event('change')
            assert page.locator('#export-bin').is_enabled(),fmt
            actual=bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))
            assert actual==correct,fmt+' Python-browser byte parity mismatch'
            field=page.locator('#typed-card-card_id')
            field.fill('50');field.dispatch_event('change')
            assert page.locator('#export-bin').is_disabled(),fmt
        assert not errors,errors
        browser.close()
    print('PASS: WC8 WA9 browser CRC parity & unsafe-change export locks')

if __name__=='__main__':run()
