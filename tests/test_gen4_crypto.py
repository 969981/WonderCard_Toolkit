import struct
import unittest
from wondercard.gen4crypto import (decrypt_pk4, encrypt_pk4,
                                    inspect_pk4_gift, pk4_checksum)


def build_decrypted(pid, species=25):
    raw=bytearray(236)
    struct.pack_into('<I',raw,0,pid)
    raw[4:6]=b'\x00\x00'
    raw[8:136]=bytes(((i*7+3)%256 for i in range(128)))
    struct.pack_into('<H',raw,8,species)
    raw[136:]=bytes(((i*3+7)%256 for i in range(100)))
    struct.pack_into('<H',raw,6,pk4_checksum(raw))
    return bytes(raw)


class Gen4Cryptography(unittest.TestCase):
    def test_shuffle_all_32_and_party_roundtrip(self):
        for idx in range(32):
            with self.subTest(idx=idx):
                source=build_decrypted((idx<<13)|0x1234567)
                cipher=encrypt_pk4(source)
                self.assertEqual(len(cipher),236)
                self.assertEqual(decrypt_pk4(cipher),source)
                self.assertEqual(encrypt_pk4(decrypt_pk4(cipher)),cipher)

    def test_detects_encrypted_decrypted_and_empty_without_editing(self):
        source=build_decrypted(0x12345678)
        pgt=bytearray(0x104)
        struct.pack_into('<H',pgt,0,1)
        pgt[8:8+236]=encrypt_pk4(source)
        original=bytes(pgt)
        info=inspect_pk4_gift(original)
        self.assertEqual(info.state,'encrypted')
        self.assertEqual(info.species,25)
        self.assertEqual(original,bytes(pgt))
        pgt[8:8+236]=source
        self.assertEqual(inspect_pk4_gift(pgt).state,'decrypted')
        self.assertEqual(inspect_pk4_gift(bytes(0x104)).state,'empty')

    def test_rejects_corrupt_checksum_and_bad_length(self):
        invalid=bytearray(build_decrypted(0x00000005))
        invalid[6]^=0x04
        with self.assertRaisesRegex(ValueError,'checksum'):
            encrypt_pk4(invalid)
        with self.assertRaises(ValueError):
            decrypt_pk4(b'1234')
        pgt=bytes(0x104)
        with self.assertRaises(ValueError):
            inspect_pk4_gift(pgt,offset=0x30)

if __name__=='__main__': unittest.main()
