"""Conservative Gen4/5 and Gen8/9 semantic Wonder Card parsing.

Fields and offsets reviewed against kwsch/PKHeX PKHeX.Core/MysteryGifts
(2026-11-13). Typed files preserve the entire original byte buffer and permit
non-writing draft patches. Binary exports of changed cards are locked until
format-specific checksums/BCAT reconstruction can be proven against fixtures.
"""
from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
from pathlib import Path
import struct
from typing import Any

# Field entries are: name, little-endian kind, raw offset. Species for Gen9
# means *internal* species ID, not a national dex number. CardType is structural
# and deliberately not writable in the draft.
def fields(pairs: str) -> dict[str, tuple[str, int]]:
    out = {}
    for term in pairs.split():
        name, kind, offset = term.split(':')
        out[name] = (kind, int(offset, 16))
    return out

STATS = 'hp atk def spe spa spd'.split()


def stat_fields(prefix: str, start: int) -> dict[str, tuple[str, int]]:
    return {f'{prefix}_{name}': ('u8', start + index) for index, name in enumerate(STATS)}


def pokemon_fields(base: int, tail: int, *, special: str = '') -> dict[str, tuple[str, int]]:
    out = fields(f'''tid:u16:{base:03x} sid:u16:{base+2:03x}
       origin_game:u32:{base+4:03x} encryption_constant:u32:{base+8:03x}
       pid:u32:{base+12:03x} egg_location:u16:{tail:03x}
       met_location:u16:{tail+2:03x} ball:u16:{tail+4:03x}
       held_item:u16:{tail+6:03x}''')
    out.update({f'move_{n+1}': ('u16', tail+8+2*n) for n in range(4)})
    out.update({f'relearn_move_{n+1}': ('u16', tail+16+2*n) for n in range(4)})
    out.update(fields(f'''species:u16:{tail+24:03x} form:u8:{tail+26:03x}
       gender:u8:{tail+27:03x} level:u8:{tail+28:03x}
       is_egg:u8:{tail+29:03x} nature:u8:{tail+30:03x}
       ability_mode:u8:{tail+31:03x} pid_type:u8:{tail+32:03x}
       met_level:u8:{tail+33:03x}'''))
    if special == 'wa8':
        out.update(fields(f'dynamax_level:u8:{tail+34:03x} gmax_flag:u8:{tail+35:03x}'))
    elif special == 'wc8':
        out.update(fields(f'dynamax_level:u8:{tail+34:03x} gmax_flag:u8:{tail+35:03x}'))
    elif special == 'wc9':
        out['tera_type'] = ('u8', tail+34)
    return out


def extend_stats(out: dict, iv: int, ev: int | None = None):
    out.update(stat_fields('iv', iv))
    if ev is not None:
        out.update(stat_fields('ev', ev))
    return out


# Separate layouts: offsets not shared across game families.
P8 = pokemon_fields(0x20, 0x228, special='wc8')
extend_stats(P8, 0x26C, 0x273)
PB8 = pokemon_fields(0x20, 0x270)
extend_stats(PB8, 0x2B2)
PA8 = pokemon_fields(0x18, 0x220, special='wa8')
extend_stats(PA8, 0x264, 0x26B)
PA8.update(stat_fields('ganbaru', 0x276))
P9 = pokemon_fields(0x18, 0x220, special='wc9')
extend_stats(P9, 0x268, 0x26F)
P9['species_internal'] = P9.pop('species')
PZA = pokemon_fields(0x18, 0x258)
extend_stats(PZA, 0x29A, 0x2A1)
PZA['species_internal'] = PZA.pop('species')
PZA['scale'] = ('u16', 0x2AC)
PZA['is_alpha'] = ('u8', 0x2AE)

FORMATS: dict[str, dict[str, Any]] = {
    'wc8': dict(size=0x2D0, gen=8, kind=0x11, card=fields('card_id:u16:008 restrict_version:u8:00e card_flags:u8:010 card_type:u8:011 title_index:u8:015'), pokemon=P8, item=0x20, item_stride=4, checksum=0x2CC),
    'wb8': dict(size=0x2DC, gen=8, kind=0x11, card=fields('card_id:u16:008 card_flags:u8:010 card_type:u8:011 title_index:u8:012'), pokemon=PB8, item=0x20, item_stride=16),
    'wa8': dict(size=0x2C8, gen=8, kind=0x0F, card=fields('card_id:u16:008 card_flags:u8:00e card_type:u8:00f title_index:u8:013'), pokemon=PA8, item=0x18, item_stride=4),
    'wc9': dict(size=0x2C8, gen=9, kind=0x11, card=fields('card_id:u16:008 scale:u16:00c restrict_version:u8:00e card_flags:u8:010 card_type:u8:011 title_index:u8:015'), pokemon=P9, item=0x18, item_stride=4, checksum=0x2C4),
    'wa9': dict(size=0x2C8, gen=9, kind=0x11, card=fields('card_id:u16:008 restrict_version:u8:00e card_flags:u8:010 card_type:u8:011 title_index:u8:015'), pokemon=PZA, item=0x18, item_stride=4, checksum=0x2C0),
    # Gen5: the 0xCC PGF section is the first part of wc5full, not an appended tail.
    'pgf': dict(size=0xCC, gen=5, kind=0xB3, card=fields('card_id:u16:0b0 card_type:u8:0b3 status_flags:u8:0b4 date_day:u8:0ac date_month:u8:0ad date_year:u16:0ae'), pokemon={**fields('tid:u16:000 sid:u16:002 origin_game:u8:004 pid:u32:008 ball:u8:00e held_item:u16:010 species:u16:01a form:u8:01c language:u8:01d nature:u8:034 gender:u8:035 ability_mode:u8:036 pid_type:u8:037 egg_location:u16:038 met_location:u16:03a met_level:u8:03c level:u8:05b is_egg:u8:05c'),**{f'move_{i+1}':('u16',0x12+i*2) for i in range(4)}, **stat_fields('iv',0x43)}, item=None),
    'wc5full': dict(size=0x2D0, gen=5, kind=0xB3, card=fields('card_id:u16:0b0 card_type:u8:0b3 status_flags:u8:0b4 date_day:u8:0ac date_month:u8:0ad date_year:u16:0ae restrict_version:u8:0ce'), pokemon={}, item=None, checksum=0x2CE),
    'pgt': dict(size=0x104, gen=4, kind=0, card=fields('gift_type:u16:000 slot:u8:002 detail:u8:003 item_id:u32:004 item_sub_id:u32:008'), pokemon={}, item=None),
    'pcd': dict(size=0x358, gen=4, kind=0, card=fields('gift_type:u16:000 card_id:u16:150 compatibility:u16:14c'), pokemon={}, item=None),
    'wc4': dict(size=0x358, gen=4, kind=0, card=fields('gift_type:u16:000 card_id:u16:150 compatibility:u16:14c'), pokemon={}, item=None),
}
FORMATS['wc5full']['pokemon'] = FORMATS['pgf']['pokemon']

# Only the first four gift-item entries are shown. Some formats have more slots;
# a separate format-specific inventory view can extend this safely.
for key in ('wc8','wb8','wa8','wc9','wa9'):
    fmt = FORMATS[key]
    fmt['item_fields'] = {k: v for i in range(4) for k,v in ((f'item_{i+1}',('u16',fmt['item'] + i*fmt['item_stride'])),(f'quantity_{i+1}',('u16',fmt['item'] + i*fmt['item_stride'] + 2)))}

KIND_READ_ONLY = {'pgt','pcd','wc4','pgf','wc5full'}
DRAFT_FORMATS = set(FORMATS) - KIND_READ_ONLY
KINDS = {'u8':('<B',1), 'u16':('<H',2), 'u32':('<I',4)}


def _decode(raw: bytes, specs: dict) -> dict:
    return {name: struct.unpack_from(KINDS[kind][0], raw, ofs)[0] for name,(kind,ofs) in specs.items()}


def _groups(raw: bytes, fmt: str) -> dict:
    spec = FORMATS[fmt]
    result = {'card':_decode(raw,spec['card'])}
    if fmt in DRAFT_FORMATS:
        gift_type = raw[spec['kind']]
        if gift_type == 1:
            result['pokemon'] = _decode(raw,spec['pokemon'])
        elif gift_type == 2:
            result['item'] = _decode(raw,spec['item_fields'])
    elif fmt in {'pgf','wc5full'} and raw[0xB3] == 1:
        result['pokemon'] = _decode(raw,spec['pokemon'])
    if spec.get('checksum') is not None:
        result['integrity'] = {'stored_checksum':struct.unpack_from('<H',raw,spec['checksum'])[0]}
    return result


def to_typed_document(raw: bytes, *, fmt: str, filename: str | None = None) -> dict:
    if fmt not in FORMATS:
        raise ValueError('Unsupported typed format')
    if len(raw) != FORMATS[fmt]['size']:
        raise ValueError(f'{fmt} expects {FORMATS[fmt]["size"]} bytes, got {len(raw)}')
    f = _groups(raw,fmt)
    draft = fmt in DRAFT_FORMATS
    return {'schema':'wondercard-typed-draft-v1','format':fmt,'generation':FORMATS[fmt]['gen'],
            'source_filename':Path(filename).name if filename else None,
            'source_sha256':sha256(raw).hexdigest(),'byte_length':len(raw),'raw_hex':raw.hex(),
            'fields':f,'baseline_fields':deepcopy(f),'preview':{'generation':FORMATS[fmt]['gen'],'gift_type':f['card'].get('card_type',f['card'].get('gift_type')),'card_id':f['card'].get('card_id'),'species':f.get('pokemon',{}).get('species',f.get('pokemon',{}).get('species_internal'))},
            'capability':'L2 semantic read + draft patches only; modified binary export LOCKED' if draft else 'L2 semantic read; L3 lossless no-op only',
            'warnings':['Stored checksum and game re-import have not been cross-validated. Changed binary output is blocked.' if draft else 'Legacy gift inner encryption / conversion not validated; read-only.']}


def draft_typed_document(doc: dict, *, preview_only: bool = False) -> tuple[bytes,list[dict]]:
    if doc.get('schema') != 'wondercard-typed-draft-v1':
        raise ValueError('Unsupported typed document schema')
    fmt = doc.get('format')
    if fmt not in FORMATS:
        raise ValueError('Unsupported format')
    raw = bytearray.fromhex(doc['raw_hex'])
    if len(raw) != doc.get('byte_length') or sha256(raw).hexdigest() != doc.get('source_sha256'):
        raise ValueError('Raw bytes/hash mismatch: refusing to process tampered baseline')
    baseline = _groups(bytes(raw),fmt)
    if baseline != doc.get('baseline_fields'):
        raise ValueError('Baseline fields do not match original bytes')
    proposed = doc.get('fields')
    if not isinstance(proposed,dict) or proposed.keys() != baseline.keys():
        raise ValueError('Group structure changed')
    patches = []
    for section, values in proposed.items():
        if not isinstance(values,dict) or values.keys()!=baseline[section].keys():
            raise ValueError('Field structure changed')
        mapping = FORMATS[fmt]['card'] if section=='card' else FORMATS[fmt]['pokemon'] if section=='pokemon' else FORMATS[fmt].get('item_fields',{})
        for name,val in values.items():
            old = baseline[section][name]
            if val == old:
                continue
            if fmt in KIND_READ_ONLY or section=='integrity' or name in {'card_type','gift_type','species_internal'}:
                raise ValueError(f'Field is not editable even as draft: {section}.{name}')
            kind,offset = mapping[name]
            limit = (1 << (8*KINDS[kind][1]))-1
            if type(val) is not int or not 0 <= val <= limit:
                raise ValueError(f'Value out of range for {section}.{name}')
            before = bytes(raw[offset:offset+KINDS[kind][1]])
            struct.pack_into(KINDS[kind][0],raw,offset,val)
            after = bytes(raw[offset:offset+KINDS[kind][1]])
            patches.append({'field':f'{section}.{name}','offset':f'0x{offset:03X}','before':before.hex(),'after':after.hex()})
    if patches and not preview_only:
        raise ValueError('Changed binary export LOCKED: checksum/game validation is not complete. Use draft preview only.')
    if _groups(bytes(raw),fmt) != proposed:
        raise ValueError('Roundtrip field validation failed')
    return bytes(raw), patches


def from_typed_document(doc: dict) -> bytes:
    return draft_typed_document(doc,preview_only=False)[0]
