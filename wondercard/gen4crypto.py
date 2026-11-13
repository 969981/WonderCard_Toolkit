"""Read-only inspection of Gen4 PK4 gift payloads inside PGT and PCD.

This module deliberately never writes the surrounding Wonder Card. The PK4
party payload is 236 bytes beginning at offset 0x08 in PGT/PCD, and carries
its own 16-bit checksum over the decrypted 128-byte shuffled core.

Algorithm independently implemented from the Gen4 PKM structure description:
https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_data_structure_(Generation_IV)
https://github.com/kwsch/PKHeX/blob/master/PKHeX.Core/PKM/Util/PokeCrypto.cs
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from itertools import permutations
from struct import unpack_from

PK4_STORED_SIZE = 136
PK4_PARTY_SIZE = 236
PGT_GIFT_OFFSET = 0x08
# The Gen4 order is fixed by its permutation index; do not substitute a
# normal lexicographic ordering here.  Index 24..31 repeats the first 8.
BLOCK_ORDERS = (
    (0,1,2,3),(0,1,3,2),(0,2,1,3),(0,3,1,2),
    (0,2,3,1),(0,3,2,1),(1,0,2,3),(1,0,3,2),
    (2,0,1,3),(3,0,1,2),(2,0,3,1),(3,0,2,1),
    (1,2,0,3),(1,3,0,2),(2,1,0,3),(3,1,0,2),
    (2,3,0,1),(3,2,0,1),(1,2,3,0),(1,3,2,0),
    (2,1,3,0),(3,1,2,0),(2,3,1,0),(3,2,1,0),
)
assert len(set(BLOCK_ORDERS)) == 24


def pk4_checksum(decrypted: bytes) -> int:
    """Checksum over 0x08..0x87 of the decrypted PK4, little-endian u16."""
    if len(decrypted) not in (PK4_STORED_SIZE, PK4_PARTY_SIZE):
        raise ValueError('PK4 size must be 136 or 236 bytes')
    return sum(unpack_from('<H', decrypted, i)[0]
               for i in range(8, PK4_STORED_SIZE, 2)) & 0xFFFF


def _crypt_words(payload: bytes, seed: int) -> bytes:
    if len(payload) % 2:
        raise ValueError('PK4 encrypted payload must be u16-aligned')
    target = bytearray(payload)
    for idx in range(0,len(payload),2):
        seed = (0x41C64E6D * seed + 0x6073) & 0xFFFFFFFF
        word = unpack_from('<H',target,idx)[0] ^ (seed >> 16)
        target[idx:idx+2] = word.to_bytes(2,'little')
    return bytes(target)


def decrypt_pk4(blob: bytes) -> bytes:
    if len(blob) not in (PK4_STORED_SIZE, PK4_PARTY_SIZE):
        raise ValueError('PK4 payload must be 136 or 236 bytes')
    personality = unpack_from('<I',blob)[0]
    stored_sum = unpack_from('<H',blob,6)[0]
    index = ((personality >> 13) & 31) % 24
    perm = BLOCK_ORDERS[index]
    unmasked = _crypt_words(blob[8:136],stored_sum)
    blocks = [unmasked[32*i:32*(i+1)] for i in range(4)]
    ordered = [bytes(32)]*4
    for position, original_index in enumerate(perm):
        ordered[original_index] = blocks[position]
    party = _crypt_words(blob[136:], personality) if len(blob) > 136 else b''
    return blob[:8] + b''.join(ordered) + party


def encrypt_pk4(decrypted: bytes) -> bytes:
    if len(decrypted) not in (PK4_STORED_SIZE, PK4_PARTY_SIZE):
        raise ValueError('PK4 payload must be 136 or 236 bytes')
    personality = unpack_from('<I',decrypted)[0]
    expected = unpack_from('<H',decrypted,6)[0]
    if pk4_checksum(decrypted) != expected:
        raise ValueError('PK4 checksum invalid; refusing to re-encrypt')
    index = ((personality >> 13) & 31) % 24
    blocks = [decrypted[8+32*i:8+32*(i+1)] for i in range(4)]
    reordered = b''.join(blocks[idx] for idx in BLOCK_ORDERS[index])
    return (decrypted[:8] + _crypt_words(reordered,expected)
            + (_crypt_words(decrypted[136:],personality) if len(decrypted)>136 else b''))


@dataclass(frozen=True)
class PK4Inspection:
    state: str
    checksum_stored: int | None
    checksum_calculated: int | None
    species: int | None
    personality: int | None
    reason: str


def inspect_pk4_gift(data: bytes, *, offset: int = PGT_GIFT_OFFSET) -> PK4Inspection:
    """Never modifies *data*; returns no false-success for zeroed PGT slots."""
    if not 0 <= offset <= len(data)-PK4_PARTY_SIZE:
        raise ValueError('No complete PK4 party payload at the requested offset')
    payload = bytes(data[offset:offset+PK4_PARTY_SIZE])
    if not any(payload):
        return PK4Inspection('empty',None,None,None,None,'Empty embedded PK4 slot')
    pid = unpack_from('<I',payload)[0]
    stored = unpack_from('<H',payload,6)[0]
    for mode, candidate in (('decrypted',payload),('encrypted',decrypt_pk4(payload))):
        computed = pk4_checksum(candidate)
        species = unpack_from('<H',candidate,8)[0]
        # A checksum match is a necessary condition, not conclusive proof that
        # this is an official event nor that all fields are valid.
        if stored == computed and 1 <= species <= 493:
            return PK4Inspection(mode,stored,computed,species,pid,
                                 'PK4 payload checksum and Gen4 species range match; provenance unverified')
    return PK4Inspection('unknown',stored,None,None,pid,
                         'No checksum-valid decrypted PK4 found; may be an item or special gift')
