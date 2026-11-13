"""Experimental *structural* writing, never a claim of game compatibility."""
import struct
import unittest
from wondercard.core import to_document, from_document
from wondercard.typed import FORMATS
from wondercard.integrity import update_full_card_checksum,inspect_card_checksum

class Gen89LimitedWriting(unittest.TestCase):
    def synth(self,fmt,pokemon):
        f=FORMATS[fmt]
        b=bytearray(f['size'])
        b[f['kind']]=1 if pokemon else 2
        if pokemon:
            b[f['pokemon']['level'][1]]=55
        else:
            struct.pack_into('<H',b,f['item_fields']['quantity_1'][1],8)
        update_full_card_checksum(b,fmt)
        return bytes(b)

    def test_edit_only_allowed_byte_and_explicit_crc(self):
        for fmt in ('wc8','wa9','wc9'):
            for pokemon in (True,False):
                with self.subTest(fmt=fmt,pokemon=pokemon):
                    base=self.synth(fmt,pokemon)
                    self.assertTrue(inspect_card_checksum(base,fmt).matches)
                    doc=to_document(base,fmt=fmt)
                    section='pokemon' if pokemon else 'item'
                    key='level' if pokemon else 'quantity_1'
                    offset=FORMATS[fmt][section if pokemon else 'item_fields'][key][1]
                    doc['fields'][section][key]+=1
                    out=from_document(doc)
                    diffs={i for i,(a,b) in enumerate(zip(base,out)) if a!=b}
                    crc=FORMATS[fmt]['checksum']
                    self.assertTrue(diffs.issubset({offset,offset+1,crc,crc+1}))
                    self.assertIn(offset,diffs)
                    self.assertTrue(inspect_card_checksum(out,fmt).matches)
                    self.assertEqual(to_document(out,fmt=fmt)['fields'][section][key],doc['fields'][section][key])

    def test_invalid_crc_and_unsafe_identity_always_blocked(self):
        for fmt in ('wc8','wa9','wc9'):
            with self.subTest(fmt=fmt):
                raw=bytearray(self.synth(fmt,True))
                doc=to_document(raw,fmt=fmt)
                doc['fields']['card']['card_id']+=1
                with self.assertRaisesRegex(ValueError,'LOCKED'):
                    from_document(doc)
                raw[FORMATS[fmt]['checksum']]^=1
                doc=to_document(raw,fmt=fmt)
                doc['fields']['pokemon']['level']=44
                with self.assertRaisesRegex(ValueError,'LOCKED'):
                    from_document(doc)

if __name__=='__main__':unittest.main()
