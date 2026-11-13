import struct
import unittest
from wondercard.integrity import crc16_ccitt_false, inspect_card_checksum
from wondercard.core import to_document, from_document


class ResearchChecksumTests(unittest.TestCase):
    def test_wc8_wa9_and_wc5full_candidate(self):
        for fmt,size,off in [('wc8',0x2d0,0x2cc),('wa9',0x2c8,0x2c0),('wc5full',0x2d0,0x2ce)]:
            with self.subTest(fmt=fmt):
                raw=bytearray(size)
                raw[0x08:0x0a]=b'\x2a\x00'
                expected=crc16_ccitt_false(raw[:off] if fmt=='wc5full' else raw,zero_at=None if fmt=='wc5full' else off)
                struct.pack_into('<H',raw,off,expected)
                check=inspect_card_checksum(raw,fmt)
                self.assertTrue(check.matches)
                self.assertEqual(check.computed,expected)
                doc=to_document(raw,fmt=fmt)
                self.assertEqual(from_document(doc),bytes(raw))
                self.assertIn('card_checksum',str(doc['diagnostics']))

    def test_no_invented_check_for_wb8_wa8(self):
        for fmt in ('wb8','wa8'):
            self.assertIsNone(inspect_card_checksum(bytes(0x2dc if fmt=='wb8' else 0x2c8),fmt))
            doc=to_document(bytes(0x2dc if fmt=='wb8' else 0x2c8),fmt=fmt)
            self.assertNotIn('integrity',doc['fields'])

    def test_corrupt_crc_never_allows_new_writes(self):
        raw=bytearray(0x2d0)
        raw[0x11]=1;raw[0x244]=50
        self.assertFalse(inspect_card_checksum(raw,'wc8').matches)
        doc=to_document(raw,fmt='wc8')
        doc['fields']['pokemon']['level']=70
        with self.assertRaisesRegex(ValueError,'LOCKED'):
            from_document(doc)

if __name__=='__main__': unittest.main()
