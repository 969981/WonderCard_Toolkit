"""WC9 structural CRC and narrow write whitelist tests; no official files bundled."""
import struct
import unittest
from wondercard.core import to_document, from_document, binary_diff
from wondercard.integrity import crc16_ccitt_false, verify_wc9_checksum, update_wc9_checksum
from wondercard.typed import draft_typed_document


def synthetic_wc9(pokemon=False):
    raw=bytearray(0x2c8)
    struct.pack_into('<H',raw,8,101)
    raw[0x11]=1 if pokemon else 2
    if pokemon:
        struct.pack_into('<H',raw,0x238,25)
        raw[0x23c]=50
        raw[0x268:0x26e]=bytes((31,)*6)
    else:
        struct.pack_into('<HH',raw,0x18,4,4)
    update_wc9_checksum(raw)
    return bytes(raw)


class WC9ChecksumTests(unittest.TestCase):
    def test_ccitt_reference(self):
        self.assertEqual(crc16_ccitt_false(b'123456789'),0x29B1)

    def test_zero_edit_byte_exact(self):
        raw=synthetic_wc9(pokemon=True)
        doc=to_document(raw,fmt='wc9')
        self.assertTrue(doc['fields']['integrity']['checksum_valid'])
        self.assertEqual(from_document(doc),raw)

    def test_item_patch_and_crc(self):
        raw=synthetic_wc9()
        doc=to_document(raw,fmt='wc9')
        doc['fields']['item']['quantity_1']=7
        changed=from_document(doc)
        self.assertTrue(verify_wc9_checksum(changed).matches)
        self.assertEqual(struct.unpack_from('<H',changed,0x1a)[0],7)
        diff={int(x['offset'],16) for x in binary_diff(raw,changed)}
        self.assertTrue(diff.issubset({0x1a,0x1b,0x2c4,0x2c5}))
        self.assertIn(0x1a,diff)
        self.assertTrue(diff.intersection({0x2c4,0x2c5}))

    def test_pokemon_level_and_card_id_locked(self):
        raw=synthetic_wc9(pokemon=True)
        doc=to_document(raw,fmt='wc9')
        doc['fields']['pokemon']['level']=42
        changed=from_document(doc)
        self.assertTrue(verify_wc9_checksum(changed).matches)
        self.assertEqual(changed[0x23c],42)
        doc['fields']['card']['card_id']=102
        with self.assertRaisesRegex(ValueError,'LOCKED'):
            from_document(doc)

    def test_invalid_original_crc_locked(self):
        raw=bytearray(synthetic_wc9(pokemon=True))
        raw[0x2c4]^=1
        doc=to_document(bytes(raw),fmt='wc9')
        self.assertFalse(doc['fields']['integrity']['checksum_valid'])
        doc['fields']['pokemon']['level']=40
        proposed,patches=draft_typed_document(doc,preview_only=True)
        self.assertEqual(proposed[0x23c],40)
        self.assertEqual(len(patches),1)
        with self.assertRaisesRegex(ValueError,'LOCKED'):
            from_document(doc)

    def test_invalid_level_and_iv_locked(self):
        doc=to_document(synthetic_wc9(pokemon=True),fmt='wc9')
        doc['fields']['pokemon']['level']=101
        with self.assertRaisesRegex(ValueError,'Level'):
            from_document(doc)
        doc=to_document(synthetic_wc9(pokemon=True),fmt='wc9')
        doc['fields']['pokemon']['iv_hp']=150
        with self.assertRaisesRegex(ValueError,'IV'):
            from_document(doc)


if __name__=='__main__':
    unittest.main()
