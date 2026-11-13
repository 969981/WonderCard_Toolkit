"""Conservative named-format registry, backed by PKHeX MysteryGifts size constants.

These entries are ONLY L1 extension+length recognition, L3 byte-preserving
read-only JSON passthrough, not validated semantic parsers or writable cards.
"""
from __future__ import annotations
from dataclasses import dataclass
import hashlib
from pathlib import Path

@dataclass(frozen=True)
class FormatInfo:
    name: str
    size: int
    generation: str
    origin: str
    canonical: str | None = None

# PKHeX.Core/MysteryGifts/{NAME}.cs Size checked against master 2026-11-13.
READ_ONLY: dict[str, FormatInfo] = {
    'pgt': FormatInfo('pgt', 0x104, '4', 'DPPt / HGSS'),
    'pcd': FormatInfo('pcd', 0x358, '4', 'DPPt / HGSS'),
    'wc4': FormatInfo('wc4', 0x358, '4', 'EventsGallery PCD-compatible archive', 'pcd'),
    'pgf': FormatInfo('pgf', 0xCC, '5', 'BW / B2W2'),
    'wc5full': FormatInfo('wc5full', 0x2D0, '5', 'BW / B2W2'),
    'pl6': FormatInfo('pl6', 0xA47, '6', 'XY / ORAS Link Gift'),
    'wb7': FormatInfo('wb7', 0x310, '7 (Switch)', 'LGPE'),
    'wb7full': FormatInfo('wb7full', 0x310, '7 (Switch)', 'LGPE', 'wb7'),
    'wr7': FormatInfo('wr7', 0x140, '7 (Switch)', 'LGPE special'),
    'wc8': FormatInfo('wc8', 0x2D0, '8', 'SWSH'),
    'wc8full': FormatInfo('wc8full', 0x2D0, '8', 'SWSH', 'wc8'),
    'wb8': FormatInfo('wb8', 0x2DC, '8', 'BDSP'),
    'wa8': FormatInfo('wa8', 0x2C8, '8', 'Legends Arceus'),
    'wc9': FormatInfo('wc9', 0x2C8, '9', 'Scarlet / Violet'),
    'wa9': FormatInfo('wa9', 0x2C8, '9', 'Legends Z-A'),
}


def resolve_named_format(filename: str | None, raw: bytes, fmt: str | None = None) -> FormatInfo:
    ext = fmt.lower().lstrip('.') if fmt else Path(filename or '').suffix.lower().lstrip('.')
    if ext not in READ_ONLY:
        raise ValueError('Unknown or ambiguous format. Specify a supported extension or --format; never infer from size alone.')
    info = READ_ONLY[ext]
    if len(raw) != info.size:
        raise ValueError(f'{ext} needs {info.size} bytes (got {len(raw)})')
    return info


def to_raw_document(blob: bytes, *, filename: str | None = None, fmt: str | None = None) -> dict:
    info = resolve_named_format(filename, blob, fmt)
    digest = hashlib.sha256(blob).hexdigest()
    return {
        'schema': 'wondercard-toolkit-raw-v1',
        'format': info.name,
        'canonical_format': info.canonical or info.name,
        'generation': info.generation,
        'origin': info.origin,
        'capability': 'read-only (named extension + size, bytes preserved)',
        'source_filename': Path(filename).name if filename else None,
        'byte_length': len(blob),
        'source_sha256': digest,
        'raw_hex': blob.hex(),
        'fields': {},
        'baseline_fields': {},
        'warnings': ['Structure/checksum not validated; no field edits or game compatibility claims.'],
    }


def from_raw_document(doc: dict) -> bytes:
    if doc.get('schema') != 'wondercard-toolkit-raw-v1':
        raise ValueError('Unsupported raw document schema')
    if doc.get('fields') != {} or doc.get('baseline_fields') != {}:
        raise ValueError('Read-only card: editing fields is not supported')
    value = doc.get('raw_hex')
    if not isinstance(value, str):
        raise ValueError('Missing raw_hex')
    raw = bytes.fromhex(value)
    info = resolve_named_format(None, raw, doc.get('format'))
    expected = hashlib.sha256(raw).hexdigest()
    if expected != doc.get('source_sha256') or len(raw) != doc.get('byte_length'):
        raise ValueError('Raw data or source hash changed: unsafe to write')
    if doc.get('canonical_format') != (info.canonical or info.name):
        raise ValueError('Canonical format changed')
    return raw
