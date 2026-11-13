"""Conservative checksum helpers for Wonder Card 9.
Verified against two independent Project Pokemon EventsGallery WC9 cards.
This does not establish official provenance, game re-import or legality.
"""
from __future__ import annotations
from dataclasses import dataclass
from struct import pack_into, unpack_from

WC9_CRC_OFFSET = 0x2C4
WC9_LENGTH = 0x2C8


def crc16_ccitt_false(data: bytes, *, zero_at: int | None = None) -> int:
    """CRC16-CCITT-FALSE: poly=0x1021, init=0xffff, xorout=0, no reflection."""
    if zero_at is not None and not 0 <= zero_at <= len(data) - 2:
        raise ValueError("Invalid checksum offset")
    crc = 0xFFFF
    for i, value in enumerate(data):
        if zero_at is not None and zero_at <= i < zero_at + 2:
            value = 0
        crc ^= value << 8
        for _ in range(8):
            crc = (((crc << 1) ^ 0x1021) if crc & 0x8000 else crc << 1) & 0xFFFF
    return crc


@dataclass(frozen=True)
class IntegrityCheck:
    stored: int
    computed: int
    matches: bool
    source: str


def verify_wc9_checksum(data: bytes) -> IntegrityCheck:
    if len(data) != WC9_LENGTH:
        raise ValueError("WC9 must contain exactly 712 bytes")
    stored = unpack_from("<H", data, WC9_CRC_OFFSET)[0]
    computed = crc16_ccitt_false(data, zero_at=WC9_CRC_OFFSET)
    return IntegrityCheck(stored, computed, stored == computed,
                          "CRC16-CCITT-FALSE, full 0x2C8, checksum at 0x2C4 zeroed")


def update_wc9_checksum(data: bytearray) -> int:
    if len(data) != WC9_LENGTH:
        raise ValueError("WC9 must contain exactly 712 bytes")
    checksum = crc16_ccitt_false(data, zero_at=WC9_CRC_OFFSET)
    pack_into("<H", data, WC9_CRC_OFFSET, checksum)
    return checksum


# Read-only checksum research layouts; this is NOT a permit to export edits.
# WB8 and WA8 have no exposed dedicated card checksum properties in PKHeX.
READONLY_CHECKSUM_LAYOUTS = {
    'wc8': (0x2D0, 0x2CC, 'candidate, awaiting real sample correlation'),
    'wa9': (0x2C8, 0x2C0, 'candidate, awaiting real sample correlation'),
    'wc5full': (0x2D0, 0x2CE, 'documented CRC over 0x000..0x2CD; await real sample correlation'),
}


def inspect_card_checksum(data: bytes, fmt: str) -> IntegrityCheck | None:
    """Read-only; no checksum field returns None, not invented validity.

    The WC8/WA9 calculation is a hypothesis, never permission to write.
    WC5Full uses the documented 0x000..0x2CD range, not the full buffer.
    """
    if fmt == 'wc9':
        return verify_wc9_checksum(data)
    if fmt not in READONLY_CHECKSUM_LAYOUTS:
        return None
    expected_length, offset, evidence = READONLY_CHECKSUM_LAYOUTS[fmt]
    if len(data) != expected_length:
        raise ValueError(f'{fmt} expects {expected_length} bytes')
    stored = unpack_from('<H', data, offset)[0]
    if fmt == 'wc5full':
        computed = crc16_ccitt_false(data[:offset])
        method = 'CRC16-CCITT-FALSE, 0..0x2CD included; ' + evidence
    else:
        computed = crc16_ccitt_false(data, zero_at=offset)
        method = f'CRC16-CCITT-FALSE candidate, full buffer with 0x{offset:X} zeroed; ' + evidence
    return IntegrityCheck(stored, computed, stored == computed, method)


# Experimental L4, restricted to formats cross-checked against independent real
# EventsGallery item and Pokemon samples. Never implies game compatibility.
EXPERIMENTAL_FULL_CRC_FORMATS = frozenset(('wc8','wc9','wa9'))


def update_full_card_checksum(buffer: bytearray, fmt: str) -> int:
    if fmt not in EXPERIMENTAL_FULL_CRC_FORMATS:
        raise ValueError(f'{fmt}: modified binary checksum repair is not enabled')
    offsets = {'wc8':(0x2D0,0x2CC),'wc9':(0x2C8,0x2C4),'wa9':(0x2C8,0x2C0)}
    size,offset=offsets[fmt]
    if len(buffer)!=size:
        raise ValueError(f'{fmt} must be exactly {size} bytes')
    checksum=crc16_ccitt_false(buffer,zero_at=offset)
    pack_into('<H',buffer,offset,checksum)
    return checksum
