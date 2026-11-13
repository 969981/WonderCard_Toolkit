"""Browser checks use synthetic bytes and don't claim semantic parsing."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

def run():
    html=(ROOT/'web/index.html').read_text(encoding='utf8')
    html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'web/style.css').read_text(encoding='utf8')+'</style>')
    for name in ('manifest','typed_manifest','i18n','app'):
        html=html.replace(f'<script src="{name}.js"></script>','<script>'+(ROOT/f'web/{name}.js').read_text(encoding='utf8')+'</script>')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1400,'height':920},accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_function('window.WonderCardStudio.getFiles().length===1')
        for fmt,size in [('pgt',0x104),('pcd',0x358),('wc5full',0x2d0),('pl6',0xa47),('wr7',0x140),('wa9',0x2c8)]:
            data=bytes(((i*31+9)&255) for i in range(size))
            page.evaluate('''async ({fmt,bytes})=>await window.WonderCardStudio.importBytes('sample.'+fmt,new Uint8Array(bytes))''',{'fmt':fmt,'bytes':list(data)})
            assert page.locator('.archive-note').is_visible(),fmt
            assert page.locator('#fields-header input').count()==0,fmt
            assert bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))==data,fmt
            assert page.evaluate('window.WonderCardStudio.currentState().diff.length')==0
            with page.expect_download() as pending:
                page.locator('#export-bin').click()
            path=ROOT/'tests'/'_tmp_archive'
            pending.value.save_as(path)
            assert path.read_bytes()==data,fmt
            path.unlink()
        for loc in ['zh-CN','zh-TW','en','ja','fr','de','it','es','ko']:
            page.locator('#locale-switch').select_option(loc)
            assert page.locator('.archive-note').is_visible()
            assert page.locator('html').get_attribute('lang')==loc
            assert page.locator('#fields-header input').count()==0
        assert not errors, errors
        browser.close()
    print('PASS: ten archive formats, unchanged binary export, 9-language readonly UI')

if __name__=='__main__':run()
