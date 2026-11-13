"""Synthetic browser regression: 9 UI locales cannot alter raw Gen6 data."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]

def run():
    page_html=(ROOT/'web/index.html').read_text(encoding='utf8')
    page_html=page_html.replace('<link rel="stylesheet" href="style.css">','<style>'+(ROOT/'web/style.css').read_text(encoding='utf8')+'</style>')
    for name in ('manifest','typed_manifest','i18n','app'):
        page_html=page_html.replace(f'<script src="{name}.js"></script>','<script>'+(ROOT/f'web/{name}.js').read_text(encoding='utf8')+'</script>')
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1400,'height':900},accept_downloads=True)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(page_html,wait_until='domcontentloaded')
        page.wait_for_function('window.WonderCardStudio.getFiles().length===1')
        before=bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))
        for loc in ['zh-CN','zh-TW','en','ja','fr','de','it','es','ko']:
            page.locator('#locale-switch').select_option(loc)
            expected=page.evaluate("window.WC_I18N.field('date')")
            assert expected in page.locator('label[for="f-header-date"]').inner_text(),loc
            assert bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))==before,loc
            assert page.evaluate('window.WonderCardStudio.currentState().diff.length')==0,loc
        page.locator('#f-header-date').fill('2015-03-19')
        page.locator('#f-header-date').dispatch_event('change')
        after=bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))
        delta=[i for i,(a,b) in enumerate(zip(before,after)) if a!=b]
        assert delta==[0x4C],delta
        assert after[0x4c]==before[0x4c]+2
        page.locator('#locale-switch').select_option('fr')
        assert bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))==after
        assert not errors,errors
        browser.close()
    print('PASS: 9 locales preserve WC6, one-byte date edit survives switching locale')

if __name__=='__main__':run()
