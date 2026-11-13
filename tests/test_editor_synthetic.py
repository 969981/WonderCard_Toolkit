"""Portable Gen6/7 tests with purely synthetic sample bytes."""
from pathlib import Path
import base64
import re
import json
import struct
import unittest

from wondercard.core import to_document, from_document, roundtrip_check, binary_diff

MANIFEST=Path(__file__).resolve().parents[1]/'web/manifest.js'
DATA=MANIFEST.read_text(encoding='utf8')
SAMPLE=base64.b64decode(re.search(r'WC_SAMPLE_B64 = "([^"]+)"', DATA).group(1))


class SyntheticEditorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.raw=SAMPLE

    def test_sample_is_marked_synthetic(self):
        self.assertEqual(to_document(self.raw,filename='demo.wc6')['fields']['title'],'SYNTHETIC DEMO')

    def test_wc6_noop_byte_exact(self):
        self.assertTrue(roundtrip_check(self.raw,'wc6'))

    def test_wc6_json_noop(self):
        doc=to_document(self.raw,filename='demo.wc6')
        self.assertEqual(from_document(json.loads(json.dumps(doc))), self.raw)

    def test_date_edits_only_one_byte(self):
        doc=to_document(self.raw,filename='demo.wc6')
        doc['fields']['date']='2015-03-19'
        result=from_document(doc)
        self.assertEqual(result[0x4c],self.raw[0x4c]+2)
        self.assertEqual(len(binary_diff(self.raw,result)),1)

    def test_edit_preserves_unknown_data(self):
        doc=to_document(self.raw,filename='demo.wc6')
        doc['fields']['pokemon']['level']=11
        after=from_document(doc)
        self.assertEqual(after[0xd0],11)
        self.assertEqual(len(binary_diff(self.raw,after)),1)

    def test_wc7_date_relative_year(self):
        raw=bytearray(self.raw)
        struct.pack_into('<I',raw,0x4c,170712)
        doc=to_document(raw,filename='demo.wc7')
        self.assertEqual(doc['fields']['date'],'2017-07-12')
        self.assertEqual(from_document(doc),raw)

    def test_wc7_reject_out_of_range_year(self):
        raw=bytearray(self.raw)
        struct.pack_into('<I',raw,0x4c,170712)
        doc=to_document(raw,filename='demo.wc7')
        doc['fields']['date']='1999-12-31'
        with self.assertRaises(ValueError):from_document(doc)

    def test_full_noop_preserved(self):
        full=bytearray(0x310)
        full[0x205:0x208]=b'FFF'
        full[0x208:]=self.raw
        doc=to_document(full,filename='demo.wc6full')
        self.assertEqual(from_document(doc),full)

    def test_invalid_length_rejected(self):
        with self.assertRaises(ValueError):to_document(self.raw[:-1],filename='bad.wc6')

if __name__=='__main__':unittest.main()
