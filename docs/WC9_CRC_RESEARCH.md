# WC9 checksum evidence and export gate (2026-11-13)

## Binary evidence

PKHeX `WC9.cs` exposes a 16-bit stored checksum at `0x2C4` and WC9 length `0x2C8` (712 bytes). Independently verifying two Project Pokémon EventsGallery items produced:

| Original EventsGallery filename | Stored CRC | Recomputed CRC |
|---|---|---|
| `0002 SV - Item Poké Ball x4.wc9` | `0xA9CC` | `0xA9CC` |
| `0007 SV - Item Potion x100 (Rev. 2).wc9` | `0x782D` | `0x782D` |

Algorithm: **CRC16-CCITT-FALSE**, poly `0x1021`, init `0xFFFF`, xorout `0`, no reflection. Compute over **all 712 bytes** after temporarily zeroing `[0x2C4, 0x2C6)`. Write the resulting 16-bit checksum little-endian to `0x2C4`. Standard vector `123456789` => `0x29B1`.

Sources:
- https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/MysteryGifts/WC9.cs
- https://github.com/projectpokemon/EventsGallery/tree/master/Released/Gen%209/SV/Wondercards

No original distribution binary assets are copied into this repo.

## Constrained edited binary export

WC9 can be edited and re-checksummed **only when the original CRC is already valid**, and changes fall within a whitelist of level/met-level, ball, held item, move/relearn move 1–4, IV/EV stats, and item/quantity 1–4. All other edits may be inspected as draft patches but must not export as modified binary. Invalid source CRC cannot be silently repaired. The original file is not overwritten.

WC8/WB8/WA8/WA9 remain draft-only until individually tested with multiple **actual binary** cards. Their layout or checksum rules must not be assumed to equal WC9. PGT/PCD/PGF/WC5Full remain read-only. This is a structural CRC and byte-level test only. **Game import, Nintendo server acceptance, and authentic official-event legality are not verified.**

## Test commands

```bash
python -m unittest discover -s tests -q
PYTHONPATH=. python tests/test_wc9_browser.py
python tests/test_typed_web.py
node scripts/check_locales.js
```
