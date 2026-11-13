"""Dependency-free, lossless Wonder Card 6/7 (and Full) parser/editor.

All outputs are based on the original bytes. Unknown fields are never normalized.
Source references: PKHeX WC6.cs/WC7.cs, ProjectPokemon Gen6/7 Wonder Card map.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date as Date
import binascii
import hashlib
import json
from pathlib import Path
import struct
from typing import Any

CORE_SIZE = 0x108
FULL_SIZE = 0x310
FULL_CORE_START = 0x208
EDITABLE_FORMAT_SET = {"wc6", "wc7", "wc6full", "wc7full"}
from .registry import READ_ONLY, resolve_named_format, to_raw_document, from_raw_document
FORMAT_SET = EDITABLE_FORMAT_SET | set(READ_ONLY)
SHINY_MODES = {0: "fixed_pid", 1: "random", 2: "always_shiny", 3: "never_shiny"}
IV_ORDER = ("hp", "atk", "def", "spe", "spa", "spd")


@dataclass(frozen=True)
class FieldSpec:
    offset: int
    kind: str
    size: int = 0


HEADER = {
    "card_id": FieldSpec(0x00, "u16"),
    "title": FieldSpec(0x02, "string", 0x4A),
    "date": FieldSpec(0x4C, "date"),
    "card_location": FieldSpec(0x50, "u8"),
    "card_type": FieldSpec(0x51, "u8"),
    "status_flags": FieldSpec(0x52, "u8"),
    "card_color": FieldSpec(0x53, "u8"),
}
POKEMON = {
    "tid": FieldSpec(0x68, "u16"),
    "sid": FieldSpec(0x6A, "u16"),
    "origin_game": FieldSpec(0x6C, "u8"),
    "encryption_constant": FieldSpec(0x70, "u32"),
    "ball": FieldSpec(0x76, "u8"),
    "held_item": FieldSpec(0x78, "u16"),
    **{f"move_{i+1}": FieldSpec(0x7A + i * 2, "u16") for i in range(4)},
    "species": FieldSpec(0x82, "u16"),
    "form": FieldSpec(0x84, "u8"),
    "language": FieldSpec(0x85, "u8"),
    "nickname": FieldSpec(0x86, "string", 0x1A),
    "nature": FieldSpec(0xA0, "u8"),
    "gender": FieldSpec(0xA1, "u8"),
    "ability_mode": FieldSpec(0xA2, "u8"),
    "pid_type": FieldSpec(0xA3, "u8"),
    "egg_location": FieldSpec(0xA4, "u16"),
    "met_location": FieldSpec(0xA6, "u16"),
    "met_level": FieldSpec(0xA8, "u8"),
    **{f"iv_{stat}": FieldSpec(0xAF + i, "u8") for i, stat in enumerate(IV_ORDER)},
    "ot_gender": FieldSpec(0xB5, "u8"),
    "ot_name": FieldSpec(0xB6, "string", 0x1A),
    "level": FieldSpec(0xD0, "u8"),
    "is_egg": FieldSpec(0xD1, "u8"),
    "pid": FieldSpec(0xD4, "u32"),
    **{f"relearn_move_{i+1}": FieldSpec(0xD8 + i * 2, "u16") for i in range(4)},
    "memory_intensity": FieldSpec(0xE0, "u8"),
    "memory_id": FieldSpec(0xE1, "u8"),
    "memory_variable": FieldSpec(0xE2, "u16"),
    "memory_feeling": FieldSpec(0xE4, "u8"),
    **{f"ev_{stat}": FieldSpec(0xE5 + i, "u8") for i, stat in enumerate(IV_ORDER)},
}
# For item gifts, the first item/quantity is verified in both PKHeX classes.
# Additional slots are exposed as raw bytes, not interpreted as Pokémon data.
ITEM = {
    "item_id": FieldSpec(0x68, "u16"),
    "quantity": FieldSpec(0x6A, "u16"),
}
FULL_HEADER = {
    "allowed_games_mask": FieldSpec(0x00, "u32"),
    "distribution_effect": FieldSpec(0x1FE, "u8"),
    "allowed_language": FieldSpec(0x1FF, "u8"),
    "distribution_mode": FieldSpec(0x200, "u8"),
    "sub_id": FieldSpec(0x201, "u8"),
    "set_count": FieldSpec(0x204, "u8"),
    "rarity_or_marker": FieldSpec(0x205, "u8"),
}


def _get_format(name: str | None, blob: bytes, explicit: str | None = None) -> str:
    if explicit:
        fmt = explicit.lower().lstrip(".")
        if fmt not in FORMAT_SET:
            raise ValueError(f"Unsupported format: {explicit}")
    else:
        fmt = Path(name or "").suffix.lower().lstrip(".")
        if fmt not in FORMAT_SET:
            if len(blob) == FULL_SIZE:
                fmt = "wc7full" if blob[0x205] == 0 else "wc6full"
            elif len(blob) == CORE_SIZE:
                raw = struct.unpack_from("<I", blob, 0x4C)[0]
                fmt = "wc6" if 20000000 <= raw <= 21001231 else "wc7"
            else:
                raise ValueError("Unknown extension; use --format wc6/wc7/wc6full/wc7full")
    if fmt in READ_ONLY:
        return resolve_named_format(name, blob, fmt).name
    expected = FULL_SIZE if fmt.endswith("full") else CORE_SIZE
    if len(blob) != expected:
        raise ValueError(f"{fmt} needs {expected} bytes (got {len(blob)})")
    return fmt


def _decode_string(b: bytes) -> str:
    # Some special glyphs are Pokémon-specific PUA. Decode for preview only;
    # the full original byte array remains authoritative.
    out = b.decode("utf-16le", errors="replace")
    return out.split("\x00", 1)[0]


def _read(buf: bytes, pos: int, spec: FieldSpec, gen: int) -> Any:
    pos += spec.offset
    if spec.kind == "string":
        return _decode_string(buf[pos:pos + spec.size])
    if spec.kind == "date":
        n = struct.unpack_from("<I", buf, pos)[0]
        year = n // 10000 + (2000 if gen == 7 else 0)
        month, day = (n // 100) % 100, n % 100
        try:
            return Date(year, month, day).isoformat()
        except ValueError:
            return None
    return struct.unpack_from({"u8": "<B", "u16": "<H", "u32": "<I"}[spec.kind], buf, pos)[0]


def _write(buf: bytearray, pos: int, spec: FieldSpec, value: Any, gen: int) -> None:
    pos += spec.offset
    if spec.kind == "string":
        if not isinstance(value, str):
            raise ValueError("String field needs string value")
        # Replacement happens only if explicitly edited; untouched text keeps trash bytes.
        b = value.encode("utf-16le", errors="strict")
        if b.find(b"\x00\x00") != -1 or len(b) + 2 > spec.size:
            raise ValueError(f"String too long/contains null (max {(spec.size-2)//2} UTF-16 units)")
        buf[pos:pos + spec.size] = (b + b"\x00\x00").ljust(spec.size, b"\x00")
        return
    if spec.kind == "date":
        if value is None:
            n = 0
        else:
            if not isinstance(value, str):
                raise ValueError("Date must be ISO YYYY-MM-DD")
            parsed = Date.fromisoformat(value)
            if gen == 7 and not 2000 <= parsed.year <= 2099:
                raise ValueError("WC7 dates must be in 2000–2099")
            n = (parsed.year - (2000 if gen == 7 else 0)) * 10000 + parsed.month * 100 + parsed.day
        struct.pack_into("<I", buf, pos, n)
        return
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"Integer required for {spec.kind}")
    lim = {"u8": 255, "u16": 65535, "u32": 0xffffffff}[spec.kind]
    if not 0 <= value <= lim:
        raise ValueError(f"Value out of range (0..{lim})")
    struct.pack_into({"u8": "<B", "u16": "<H", "u32": "<I"}[spec.kind], buf, pos, value)


def _fields(blob: bytes, fmt: str) -> dict[str, Any]:
    is_full = fmt.endswith("full")
    gen = 6 if fmt.startswith("wc6") else 7
    pos = FULL_CORE_START if is_full else 0
    result: dict[str, Any] = {key: _read(blob, pos, spec, gen) for key, spec in HEADER.items()}
    kind = result["card_type"]
    if kind == 0:
        result["pokemon"] = {key: _read(blob, pos, spec, gen) for key, spec in POKEMON.items()}
    elif kind == 1:
        result["item"] = {key: _read(blob, pos, spec, gen) for key, spec in ITEM.items()}
    if is_full:
        result["full"] = {key: _read(blob, 0, spec, gen) for key, spec in FULL_HEADER.items()}
    return result


def _source_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def inspect_bytes(blob: bytes, fmt: str) -> dict[str, Any]:
    fields = _fields(blob, fmt)
    status = fields["status_flags"]
    preview: dict[str, Any] = {
        "generation": 6 if fmt.startswith("wc6") else 7,
        "gift_type": {0: "pokemon", 1: "item", 3: "battle_points"}.get(fields["card_type"], "unknown"),
        "once_only": bool(status & 1),
        "used": bool(status & 2),
        "status_flags_hex": f"0x{status:02X}",
        "raw_date_number": struct.unpack_from("<I", blob, (FULL_CORE_START if fmt.endswith('full') else 0) + 0x4C)[0],
    }
    if fmt.startswith("wc7"):
        preview["once_per_day"] = bool(status & 4)
    if "pokemon" in fields:
        pk = fields["pokemon"]
        preview["pid_rule"] = SHINY_MODES.get(pk["pid_type"], "unknown")
        preview["iv_generation"] = (
            "3 guaranteed 31" if pk["iv_hp"] == 0xFE else
            "2 guaranteed 31" if pk["iv_hp"] == 0xFD else
            "per-stat, 255 means random"
        )
    if fmt.endswith("full"):
        # CRC parameters of historical files can vary; report stored value only.
        preview["stored_crc16_hex"] = f"0x{struct.unpack_from('<H', blob, 0x202)[0]:04X}"
        preview["full_extra_raw_hex"] = blob[:FULL_CORE_START].hex()
    return preview


def to_document(blob: bytes, *, filename: str | None = None, fmt: str | None = None) -> dict[str, Any]:
    actual = _get_format(filename, blob, fmt)
    if actual in READ_ONLY:
        return to_raw_document(blob, filename=filename, fmt=actual)
    parsed = _fields(blob, actual)
    return {
        "schema": "wondercard-toolkit-v1",
        "format": actual,
        "byte_length": len(blob),
        "source_filename": Path(filename).name if filename else None,
        "source_sha256": _source_hash(blob),
        "raw_hex": blob.hex(),
        "fields": parsed,
        "baseline_fields": json.loads(json.dumps(parsed, ensure_ascii=False)),
        "preview": inspect_bytes(blob, actual),
        "notes": "Edit fields only. raw_hex is the authoritative original bytes; unchanged fields/unknown data are preserved.",
    }


def _flatten(p: dict[str, Any], prefix: str = "") -> dict[str, Any]:
    result = {}
    for k, v in p.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            result.update(_flatten(v, key))
        else:
            result[key] = v
    return result


def from_document(doc: dict[str, Any], *, crc_policy: str = "keep") -> bytes:
    if doc.get("schema") == "wondercard-toolkit-raw-v1":
        return from_raw_document(doc)
    if doc.get("schema") != "wondercard-toolkit-v1":
        raise ValueError("Unsupported JSON schema")
    fmt = doc.get("format")
    if fmt not in FORMAT_SET:
        raise ValueError("Unsupported format")
    raw = bytearray.fromhex(doc["raw_hex"])
    _get_format(None, raw, fmt)
    fields = doc["fields"]
    baseline = doc["baseline_fields"]
    a, b = _flatten(fields), _flatten(baseline)
    if a.keys() != b.keys():
        raise ValueError("Fields structure changed. Edit values only; do not add/delete keys")
    gen = 6 if fmt.startswith("wc6") else 7
    pos = FULL_CORE_START if fmt.endswith("full") else 0
    # Card type changed? Old nested section should not be rewritten unless its members changed.
    changes = [key for key in a if a[key] != b[key]]
    for key in changes:
        if "." not in key:
            spec, ofs = HEADER.get(key), pos
        else:
            parent, name = key.split(".", 1)
            specs, ofs = {"pokemon": (POKEMON, pos), "item": (ITEM, pos), "full": (FULL_HEADER, 0)}.get(parent, ({}, 0))
            spec = specs.get(name)
        if spec is None:
            raise ValueError(f"Non-editable/unknown field: {key}")
        _write(raw, ofs, spec, a[key], gen)
    if fmt.endswith("full") and changes and crc_policy == "fix":
        # CRC16-CCITT-FALSE (0x1021, init FFFF) candidate. No validated full
        # fixture available in this package; opt-in only, not automatic.
        raw[0x202:0x204] = b"\x00\x00"
        crc = binascii.crc_hqx(raw, 0xffff)
        struct.pack_into("<H", raw, 0x202, crc)
    elif crc_policy not in ("keep", "fix"):
        raise ValueError("crc_policy must be keep/fix")
    return bytes(raw)


def roundtrip_check(blob: bytes, fmt: str) -> bool:
    return from_document(to_document(blob, fmt=fmt)) == blob


def audit_blob(blob: bytes, fmt: str) -> dict[str, Any]:
    doc = to_document(blob, fmt=fmt)
    if fmt in READ_ONLY:
        return {"format": fmt, "sha256": doc["source_sha256"], "roundtrip_ok": roundtrip_check(blob, fmt), "warnings": doc["warnings"], "capability": doc["capability"]}
    fields, preview = doc["fields"], doc["preview"]
    warnings = []
    if fields["date"] is None:
        warnings.append("Invalid or empty date encoding")
    if fields["card_type"] not in ({0, 1} if fmt.startswith("wc6") else {0, 1, 3}):
        warnings.append("Unknown card type")
    if "pokemon" in fields:
        p = fields["pokemon"]
        if p["pid_type"] not in SHINY_MODES:
            warnings.append("Unknown PID generation type")
        if p["nature"] not in {*range(25), 255}:
            warnings.append("Unusual nature value")
        if p["level"] > 100:
            warnings.append("Level above 100")
        for stat in IV_ORDER:
            if p[f"iv_{stat}"] not in {*range(32), 0xFD, 0xFE, 0xFF}:
                warnings.append(f"Unexpected raw IV encoding: {stat}")
    return {
        "format": fmt,
        "sha256": doc["source_sha256"],
        "card_id": fields["card_id"],
        "title": fields["title"],
        "date": fields["date"],
        "card_type": fields["card_type"],
        "gift_used": preview["used"],
        "once_only": preview["once_only"],
        "species": fields.get("pokemon", {}).get("species"),
        "pid_type": fields.get("pokemon", {}).get("pid_type"),
        "pid_rule": preview.get("pid_rule"),
        "nature": fields.get("pokemon", {}).get("nature"),
        "ivs_raw": "/".join(str(fields["pokemon"]["iv_" + stat]) for stat in IV_ORDER) if "pokemon" in fields else "",
        "language": fields.get("pokemon", {}).get("language"),
        "origin_game": fields.get("pokemon", {}).get("origin_game"),
        "full_allowed_games_mask": fields.get("full", {}).get("allowed_games_mask"),
        "full_allowed_language": fields.get("full", {}).get("allowed_language"),
        "roundtrip_ok": roundtrip_check(blob, fmt),
        "warnings": warnings,
    }


def binary_diff(before: bytes, after: bytes) -> list[dict[str, Any]]:
    if len(before) != len(after):
        raise ValueError("Different file lengths")
    return [{"offset": f"0x{i:03X}", "old": f"{a:02X}", "new": f"{b:02X}"}
            for i, (a, b) in enumerate(zip(before, after)) if a != b]


def dumps(doc: dict[str, Any]) -> str:
    return json.dumps(doc, ensure_ascii=False, indent=2) + "\n"
