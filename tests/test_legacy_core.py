"""Reproducible baseline tests for the existing WC6/WC7 Python code.

No event card binaries are downloaded or bundled.
"""
import struct
import unittest
from wondercard.core import to_document, from_document, binary_diff

def sample(full=False, gen7=False):
    raw=bytearray(0x310 if full else 0x108)
    base=0x208 if full else 0
    struct.pack_into("<H",raw,base,25)
    struct.pack_into("<I",raw,base+0x4c,150317 if gen7 else 20150317)
    raw[base+0x51]=0
    raw[base+0xd0]=10
    raw[base+0x105]=0xa5
    return bytes(raw)

class LegacyParity(unittest.TestCase):
    def test_unmodified_will_not_touch_unknown_bytes(self):
        for ext in ("wc6","wc7","wc6full","wc7full"):
            src=sample(full="full" in ext,gen7=ext.startswith("wc7"))
            doc=to_document(src,fmt=ext)
            self.assertEqual(from_document(doc),src,ext)

    def test_level_patch_affects_only_one_offset(self):
        src=sample()
        doc=to_document(src,fmt="wc6")
        doc["fields"]["pokemon"]["level"]=50
        out=from_document(doc)
        self.assertEqual(binary_diff(src,out),[{"offset":"0x0D0","old":"0A","new":"32"}])
        self.assertEqual(out[0x105],0xa5)

    def test_date_golden_byte(self):
        src=sample()
        doc=to_document(src,fmt="wc6")
        doc["fields"]["date"]="2015-03-19"
        out=from_document(doc)
        self.assertEqual(binary_diff(src,out),[{"offset":"0x04C","old":"2D","new":"2F"}])

if __name__=="__main__": unittest.main()
