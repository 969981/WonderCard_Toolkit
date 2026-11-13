"""Synthetic L1 archive recognition and byte-preserving JSON tests.

These bytes are NOT valid real cards: only extension+size/transport is tested.
"""
import hashlib
import json
import unittest

from wondercard.core import to_document, from_document, roundtrip_check, audit_blob
from wondercard.registry import READ_ONLY


class ReadOnlyFormatTests(unittest.TestCase):
    def test_all_named_archives_preserve_bytes(self):
        for name, info in READ_ONLY.items():
            with self.subTest(format=name):
                data = bytes(((i * 89 + 17) & 255) for i in range(info.size))
                doc = to_document(data, filename='sample.' + name)
                self.assertEqual(doc['format'], name)
                self.assertEqual(doc['capability'][:9], 'read-only')
                self.assertEqual(doc['source_sha256'], hashlib.sha256(data).hexdigest())
                self.assertEqual(from_document(json.loads(json.dumps(doc))), data)
                self.assertTrue(roundtrip_check(data, name))
                self.assertTrue(audit_blob(data, name)['roundtrip_ok'])

    def test_wrong_length_and_unknown_extension_rejected(self):
        for name, info in READ_ONLY.items():
            with self.subTest(format=name):
                with self.assertRaises(ValueError):
                    to_document(bytes(info.size - 1), filename='test.' + name)
        with self.assertRaises(ValueError):
            to_document(bytes(0x2C8), filename='unknown.bin')

    def test_raw_edit_and_baseline_tamper_rejected(self):
        data = bytes(range(256)) + bytes(0x104-256)
        doc = to_document(data, filename='card.pgt')
        doc['raw_hex'] = 'ff' + doc['raw_hex'][2:]
        with self.assertRaisesRegex(ValueError, 'hash'):
            from_document(doc)
        doc = to_document(data, filename='card.pgt')
        doc['fields'] = {'date': '2026-11-13'}
        with self.assertRaisesRegex(ValueError, 'Read-only'):
            from_document(doc)

    def test_cross_format_size_disambiguation_by_extension(self):
        blob = bytes(0x2C8)
        for name in ('wa8','wc9','wa9'):
            self.assertEqual(to_document(blob, filename='same.' + name)['format'], name)
        with self.assertRaises(ValueError):
            to_document(blob, filename='same.bin')

if __name__ == '__main__':
    unittest.main()
