"""Opt-in EventsGallery regression. Samples never saved/re-published, only hashes."""
from __future__ import annotations

import argparse
from hashlib import sha256
import json
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from wondercard.integrity import inspect_card_checksum
from wondercard.core import to_document, from_document

BASE='https://raw.githubusercontent.com/projectpokemon/EventsGallery/master/'
SAMPLES={
 'wc8':[
  'Released/Gen 8/SwSh/Wondercards/0101 SWSH - ポケセン Eevee (Ver 1. Dynamic PID).wc8',
  'Released/Gen 8/SwSh/Wondercards/0103 SWSH - Item Gigantimix.wc8'],
 'wb8':[
  'Released/Gen 8/BDSP/Wondercards/0138 BDSP - Poké Center Happiny.wb8',
  'Released/Gen 8/BDSP/Wondercards/0201 BDSP - Color Statues (Turtwig, Chimchar, Piplup).wb8'],
 'wa8':[
  'Released/Gen 8/PLA/Wondercards/0138 PLA - Poké Center Happiny.wa8',
  'Released/Gen 8/PLA/Wondercards/0303 PLA - Item Nuggets x50.wa8'],
 'wc9':[
  'Released/Gen 9/SV/Wondercards/0002 SV - Item Poké Ball x4.wc9',
  'Released/Gen 9/SV/Wondercards/0007 SV - Item Potion x100 (Rev. 2).wc9',
  'Released/Gen 9/SV/Wondercards/0006 SV - (Trainer) Gyarados (Ground Tera Type).wc9'],
 'wa9':[
  'Released/Gen 9/ZA/Wondercards/0101 ZA - PokéCenter Audino.wa9',
  'Released/Gen 9/ZA/Wondercards/0103 ZA - Item Max Revive x5 & Full Restore x10 & Ultra Ball x10.wa9'],
 'wc5full':[
  'Released/Gen 5/Wondercard Fulls/0002 BW - SMR2011 Karrablast (ENG).wc5full',
  'Released/Gen 5/Wondercard Fulls/0028 BW - 2011WIN Darkrai (ENG).wc5full'],
 'pgf':['Released/Gen 5/Wondercards/JPN/0001 BW - ポケスマ Cubchoo (JPN).pgf'],
 'wc4':[
  'Released/Gen 4/Wondercards/JPN/001 DP - Concert Chatot (JPN).wc4',
  'Released/Gen 4/Wondercards/JPN/007 DP - Movie 2007 Darkrai (JPN).wc4']
}

def run(*,timeout=20):
    results=[]
    for fmt,paths in SAMPLES.items():
        for path in paths:
            info={'format':fmt,'path':path}
            try:
                url=BASE+quote(path,safe='/')
                req=Request(url,headers={'User-Agent':'WonderCardToolkit-validation/0.7'})
                with urlopen(req,timeout=timeout) as resp:
                    data=resp.read(10*1024*1024+1)
                if len(data)>10*1024*1024:
                    raise ValueError('oversized sample')
                doc=to_document(data,fmt=fmt,filename=Path(path).name)
                if from_document(doc)!=data:
                    raise AssertionError('modified original during no-op export')
                check=inspect_card_checksum(data,fmt)
                if fmt in ('wc8','wc9','wa9') and check and check.matches:
                    # Actual downloaded sample: modify one whitelisted field in
                    # memory and prove CRC, exact diffs, and reparse, never save.
                    import copy
                    from wondercard.typed import FORMATS
                    edit=copy.deepcopy(doc)
                    if 'pokemon' in edit['fields']:
                        section,fld='pokemon','level'
                        old=edit['fields'][section][fld]
                        edit['fields'][section][fld]=min(100,old+1) if old<100 else 99
                    elif 'item' in edit['fields']:
                        section,fld='item','quantity_1'
                        old=edit['fields'][section][fld]
                        edit['fields'][section][fld]=old+1 if old<65535 else 65534
                    else:
                        section=None
                    if section:
                        modified=from_document(edit)
                        fixed=inspect_card_checksum(modified,fmt)
                        assert fixed and fixed.matches
                        assert modified!=data
                        diffs=[k for k in range(len(data)) if data[k]!=modified[k]]
                        card_offset=FORMATS[fmt]['checksum']
                        field_offset=FORMATS[fmt][section if section=='pokemon' else 'item_fields'][fld][1]
                        assert set(diffs).issubset({field_offset,field_offset+1,card_offset,card_offset+1}),diffs
                        assert to_document(modified,fmt=fmt)['fields'][section][fld]==edit['fields'][section][fld]
                        info['edited_crc_matches']=True
                        info['edit_field']=section+'.'+fld
                        info['edited_diff_offsets']=['0x%03X'%x for x in diffs]
                info.update(status='ok',size=len(data),sha256=sha256(data).hexdigest(),
                    gift_type=doc['preview']['gift_type'],card_id=doc['preview']['card_id'],
                    crc={'available':bool(check),'stored':check.stored,'computed':check.computed,
                         'matches':check.matches,'method':check.source} if check else {'available':False})
            except Exception as exc:
                info.update(status='error',error=type(exc).__name__+': '+str(exc))
            results.append(info)
    return results


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--out',default='gallery-validation-report.json')
    ap.add_argument('--strict',action='store_true',help='fail on network errors and CRC mismatch')
    args=ap.parse_args()
    report=run()
    print(json.dumps(report,ensure_ascii=False,indent=2))
    Path(args.out).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    failed=[r for r in report if r['status']!='ok' or r['crc'].get('available') and r['crc']['matches'] is False]
    if failed:
        print(f'Live validation found {len(failed)}/{len(report)} unresolved samples',file=sys.stderr)
        if args.strict:return 1
    return 0

if __name__=='__main__':raise SystemExit(main())
