import json
import struct
import unittest
from wondercard.core import to_document, from_document, binary_diff
from wondercard.typed import FORMATS, DRAFT_FORMATS, draft_typed_document

class TypedTests(unittest.TestCase):
    def synth(self, fmt, gift_type=1):
        info=FORMATS[fmt]
        buf=bytearray(info['size'])
        buf[info['kind']]=gift_type
        if 'card_id' in info['card']:
            struct.pack_into('<H',buf,info['card']['card_id'][1],551)
        if gift_type==1 and info['pokemon']:
            species=info['pokemon'].get('species',info['pokemon'].get('species_internal'))
            struct.pack_into('<H',buf,species[1],133)
        return bytes(buf)

    def test_all_formats_typed_noop(self):
        for fmt in FORMATS:
            with self.subTest(fmt=fmt):
                raw=self.synth(fmt)
                doc=to_document(raw,fmt=fmt)
                self.assertEqual(doc['schema'],'wondercard-typed-draft-v1')
                self.assertEqual(from_document(json.loads(json.dumps(doc))),raw)
                self.assertEqual(doc['fields']['card'].get('card_id',551),551)

    def test_gen8_gen9_draft_and_export_lock(self):
        for fmt in DRAFT_FORMATS:
            with self.subTest(fmt=fmt):
                raw=self.synth(fmt)
                doc=to_document(raw,fmt=fmt)
                self.assertEqual(doc['fields']['pokemon'].get('species', doc['fields']['pokemon'].get('species_internal')),133)
                doc['fields']['pokemon']['level']=51
                preview, patches=draft_typed_document(doc,preview_only=True)
                self.assertEqual(len(patches),1)
                self.assertEqual(len(binary_diff(raw,preview)),1)
                with self.assertRaisesRegex(ValueError,'LOCKED'):
                    from_document(doc)

    def test_item_layout_distinct(self):
        for fmt in DRAFT_FORMATS:
            with self.subTest(fmt=fmt):
                raw=self.synth(fmt,gift_type=2)
                doc=to_document(raw,fmt=fmt)
                self.assertIn('item_1',doc['fields']['item'])
                doc['fields']['item']['item_1']=420
                preview,patches=draft_typed_document(doc,preview_only=True)
                self.assertEqual(struct.unpack_from('<H',preview,FORMATS[fmt]['item'])[0],420)
                self.assertEqual(len(patches),1)

    def test_baseline_hash_and_structure_tamper_rejected(self):
        doc=to_document(self.synth('wc9'),fmt='wc9')
        doc['raw_hex']='ff'+doc['raw_hex'][2:]
        with self.assertRaisesRegex(ValueError,'hash mismatch'):
            from_document(doc)
        doc=to_document(self.synth('wc9'),fmt='wc9')
        doc['baseline_fields']['card']['card_id']=9000
        with self.assertRaisesRegex(ValueError,'Baseline fields'):
            from_document(doc)
        doc=to_document(self.synth('wc9'),fmt='wc9')
        doc['fields']['pokemon']['species_internal']=4
        with self.assertRaisesRegex(ValueError,'not editable'):
            draft_typed_document(doc,preview_only=True)

if __name__=='__main__':unittest.main()
