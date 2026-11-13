"""Verify CRC-gated WC9 browser export matches Python byte-for-byte.

Run: PYTHONPATH=. python tests/test_wc9_browser.py (Playwright + Chromium).
"""
from pathlib import Path
import struct
from playwright.sync_api import sync_playwright
from wondercard.core import to_document, from_document
from wondercard.integrity import update_wc9_checksum, verify_wc9_checksum

ROOT=Path(__file__).resolve().parents[1]


def run():
    source=bytearray(0x2c8)
    source[0x11]=1
    struct.pack_into('<H',source,8,44)
    source[0x23c]=35
    source[0x268:0x26e]=bytes((31,)*6)
    update_wc9_checksum(source)
    document=to_document(bytes(source),fmt='wc9')
    document['fields']['pokemon']['level']=40
    expected=from_document(document)
    assert verify_wc9_checksum(expected).matches

    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        page=browser.new_page(accept_downloads=True)
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content((ROOT/'web/standalone.html').read_text(encoding='utf8'),wait_until='domcontentloaded')
        page.wait_for_function('window.WonderCardStudio.getFiles().length===1')
        page.evaluate('async raw=>window.WonderCardStudio.importBytes("source.wc9",new Uint8Array(raw))',list(source))
        input=page.locator('#typed-pokemon-level')
        input.fill('40');input.dispatch_event('change')
        assert page.locator('#export-bin').is_enabled(), 'Valid-source WC9 should be exportable'
        result=bytes(page.evaluate('Array.from(window.WonderCardStudio.currentState().raw)'))
        assert result==expected, 'Browser and Python CRC bytes must match'
        assert verify_wc9_checksum(result).matches

        field=page.locator('#typed-card-card_id')
        field.fill('45');field.dispatch_event('change')
        assert page.locator('#export-bin').is_disabled(), 'Card ID editing is not allowed for binary output'
        source[0x2c4]^=1
        page.evaluate('async raw=>window.WonderCardStudio.importBytes("invalid.wc9",new Uint8Array(raw))',list(source))
        input=page.locator('#typed-pokemon-level')
        input.fill('40');input.dispatch_event('change')
        assert page.locator('#export-bin').is_disabled(), 'Invalid source CRC is not repaired silently'
        assert not errors,errors
        browser.close()
    print('PASS: WC9 Python/JS parity, CRC repair and unsafe-export locks')


if __name__=='__main__':
    run()
