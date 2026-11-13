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
