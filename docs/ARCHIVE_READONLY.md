# Archive format adapter v0.4 — L1 / read-only, not semantic support

The original editor implements WC6/WC7 field decoding and editing, with modified Full binary export blocked pending CRC validation. This incremental release adds the following **named extension + PKHeX size** registry. It does not yet decode the individual formats' fields, checksum, event restrictions, or container layout.

| Named formats | Bytes | Games |
|---|---:|---|
| PGT | 0x104 | Gen4 DPPt/HGSS |
| PCD, WC4 (gallery alias) | 0x358 | Gen4 |
| PGF | 0xCC | Gen5 BW/B2W2 |
| WC5Full | 0x2D0 | Gen5 |
| PL6 | 0xA47 | Gen6 XY/ORAS Link Gift |
| WB7, WB7Full (alias) | 0x310 | Gen7 LGPE |
| WR7 | 0x140 | Gen7 LGPE special |
| WC8, WC8Full (alias) | 0x2D0 | Gen8 SWSH |
| WB8 | 0x2DC | Gen8 BDSP |
| WA8 | 0x2C8 | Gen8 PLA |
| WC9 | 0x2C8 | Gen9 SV |
| WA9 | 0x2C8 | Gen9 Z-A |

### Actual abilities

- Import multiple correctly named binary files; reject incorrect lengths; archive names with the same size are not distinguished by bytes alone.
- Show raw HEX and SHA-256; export an **unchanged** binary copy; export JSON with raw bytes, a SHA-256 baseline, no semantic fields.
- Python `to_document` / `from_document` roundtrip for read-only formats, refusing any changed SHA or injected fields.
- Batch CSV includes format and raw integrity but no guessed species/OT/PID or legality claims.
- Files with missing/ambiguous extensions or inconsistent sizes must fail closed, not guess from size.

**Not supported yet**: true semantic field inspection/editing for Gen4/5/8/9, checksum repair, BCAT payload reinsertion, archived Gen1–3 event scripts, or proof a card is official. The registry only certifies a recognizable filename+size pair. These tasks remain tracked in Issues #7–#12.

Reference: [PKHeX Core MysteryGifts](https://github.com/kwsch/PKHeX/tree/master/PKHeX.Core/MysteryGifts) and [EventsGallery](https://github.com/projectpokemon/EventsGallery). On direct copying of upstream GPLv3 code, legal compatibility must be reviewed.
