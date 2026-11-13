"""Generate browser field map from the Python single source of truth."""
import json
from pathlib import Path
import sys
root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root))
from wondercard.typed import FORMATS
obj = {}
for name, layout in FORMATS.items():
    item = {k: layout[k] for k in ('size','gen','kind')}
    for section, key in [('card','card'),('pokemon','pokemon'),('item','item_fields')]:
        item[section] = {name: {'kind': v[0], 'offset': v[1], 'size': {'u8':1,'u16':2,'u32':4}[v[0]]}
                         for name,v in layout.get(key,{}).items()}
    item['checksum'] = layout.get('checksum')
    item['draft'] = name in {'wc8','wb8','wa8','wc9','wa9'}
    obj[name] = item
out = '/* GENERATED: edit wondercard/typed.py, then run scripts/build_typed_manifest.py */\nwindow.WC_TYPED_FORMATS = ' + json.dumps(obj, ensure_ascii=False, separators=(',',':')) + ';\n'
(root/'web/typed_manifest.js').write_text(out, encoding='utf-8')
print('Generated web/typed_manifest.js for',len(obj),'formats')
