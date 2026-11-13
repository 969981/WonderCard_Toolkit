"""Run with: python -m wondercard.cli --help"""
from __future__ import annotations
import argparse
import csv
import json
from pathlib import Path
import sys
from .core import (
    FORMAT_SET, to_document, from_document, audit_blob,
    binary_diff, dumps, roundtrip_check, _get_format,
)


def _parse(p: Path, fmt: str | None = None):
    raw = p.read_bytes()
    return raw, _get_format(p.name, raw, fmt)


def _write(path: Path, data: bytes | str, force: bool):
    if path.exists() and not force:
        raise FileExistsError(f"Refusing to overwrite: {path} (use --force)")
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        path.write_text(data, encoding="utf-8")
    else:
        path.write_bytes(data)
    print(f"Wrote {path}")


def run(argv=None) -> int:
    p = argparse.ArgumentParser(prog="wc-tool", description="WonderCard editor (Gen6/7) and conservative read-only archive inspector")
    sub = p.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("inspect", help="Show decoded fields of one Wonder Card")
    a.add_argument("file", type=Path)
    a.add_argument("--format", choices=sorted(FORMAT_SET))
    a = sub.add_parser("export", help="Binary -> editable lossless JSON")
    a.add_argument("file", type=Path)
    a.add_argument("--output", "-o", type=Path)
    a.add_argument("--format", choices=sorted(FORMAT_SET))
    a.add_argument("--force", action="store_true")
    a = sub.add_parser("import", help="JSON -> binary; apply changed fields to original byte array")
    a.add_argument("file", type=Path)
    a.add_argument("--output", "-o", type=Path)
    a.add_argument("--force", action="store_true")
    a.add_argument("--full-crc", choices=["error", "keep", "fix"], default="error",
                   help="For edited *full only: error (safe default), keep original CRC, or experimental CCITT-FALSE fix")
    a = sub.add_parser("edit-date", help="Write ISO date, preserving every other byte")
    a.add_argument("file", type=Path)
    a.add_argument("date", help="YYYY-MM-DD")
    a.add_argument("--output", "-o", type=Path)
    a.add_argument("--force", action="store_true")
    a.add_argument("--full-crc", choices=["error", "keep", "fix"], default="error")
    a = sub.add_parser("audit", help="Recursively audit WC6/WC7 cards into CSV/JSON")
    a.add_argument("directory", type=Path)
    a.add_argument("--output", "-o", type=Path)
    a.add_argument("--json", action="store_true", help="Write JSON instead of CSV")
    a.add_argument("--force", action="store_true")
    a = sub.add_parser("verify", help="Check binary -> JSON -> binary roundtrip")
    a.add_argument("file", type=Path)
    a.add_argument("--format", choices=sorted(FORMAT_SET))
    a = sub.add_parser("diff", help="Show byte-level differences")
    a.add_argument("original", type=Path)
    a.add_argument("changed", type=Path)
    a = sub.add_parser("gui", help="Launch desktop JSON editor (Tkinter)")
    args = p.parse_args(argv)
    try:
        if args.cmd == "gui":
            from .gui import start
            start()
        elif args.cmd == "inspect":
            raw, fmt = _parse(args.file, args.format)
            doc = to_document(raw, filename=str(args.file), fmt=fmt)
            print(dumps({"format": fmt, "fields": doc["fields"], "preview": doc["preview"],
                         "sha256": doc["source_sha256"]}))
        elif args.cmd == "export":
            raw, fmt = _parse(args.file, args.format)
            out = args.output or args.file.with_name(args.file.name + ".json")
            _write(out, dumps(to_document(raw, filename=str(args.file), fmt=fmt)), args.force)
        elif args.cmd in ("import", "edit-date"):
            if args.cmd == "import":
                doc = json.loads(args.file.read_text(encoding="utf-8"))
                output = args.output or args.file.with_name(args.file.name.removesuffix(".json").removesuffix("." + doc["format"]) + "_from_json." + doc["format"])
            else:
                raw, fmt = _parse(args.file)
                doc = to_document(raw, filename=str(args.file), fmt=fmt)
                if doc["format"] not in {"wc6","wc7","wc6full","wc7full"}:
                    raise ValueError("This format is read-only: date edit is unsupported")
                doc["fields"]["date"] = args.date
                output = args.output or args.file.with_name(args.file.stem + "_edited." + fmt)
            has_changes = doc["fields"] != doc["baseline_fields"]
            is_full = doc["format"] in {"wc6full", "wc7full"}
            if is_full and has_changes and args.full_crc == "error":
                raise ValueError("Edited *full requires CRC handling; specify --full-crc fix (experimental) or keep (invalid CRC)")
            after = from_document(doc, crc_policy="keep" if args.full_crc == "error" else args.full_crc)
            before = bytes.fromhex(doc["raw_hex"])
            _write(output, after, args.force)
            print(f"Changed {len(binary_diff(before, after))} byte(s); roundtrip template intact")
            if is_full and has_changes:
                print("WARNING: *full CRC behavior is not validated against an external fixture")
        elif args.cmd == "audit":
            root = args.directory
            targets = [root] if root.is_file() else sorted(p for p in root.rglob("*") if p.is_file() and p.suffix.lower().lstrip(".") in FORMAT_SET)
            rows = []
            for f in targets:
                try:
                    raw, fmt = _parse(f)
                    item = audit_blob(raw, fmt)
                    item["file"] = str(f.relative_to(root)) if root.is_dir() else f.name
                    item["warnings"] = "; ".join(item["warnings"])
                    item["error"] = ""
                except Exception as ex:
                    item = {"file": str(f), "error": str(ex)}
                rows.append(item)
            out = args.output or (root / ("wondercard_audit.json" if args.json else "wondercard_audit.csv") if root.is_dir() else root.with_suffix(".audit.json" if args.json else ".audit.csv"))
            if args.json:
                _write(out, dumps({"count": len(rows), "records": rows}), args.force)
            else:
                keys = ["file", "format", "capability", "card_id", "title", "date", "card_type", "gift_used", "once_only", "species", "pid_type", "pid_rule", "nature", "ivs_raw", "language", "origin_game", "full_allowed_games_mask", "full_allowed_language", "roundtrip_ok", "sha256", "warnings", "error"]
                from io import StringIO
                s = StringIO(); writer = csv.DictWriter(s, fieldnames=keys, extrasaction="ignore"); writer.writeheader(); writer.writerows(rows)
                _write(out, '\ufeff' + s.getvalue(), args.force)
            print(f"Audited {len(rows)} file(s), {sum(bool(x.get('error')) for x in rows)} error(s)")
        elif args.cmd == "verify":
            raw, fmt = _parse(args.file, args.format)
            ok = roundtrip_check(raw, fmt)
            print("PASS: byte-for-byte identical" if ok else "FAIL: not identical")
            return 0 if ok else 2
        elif args.cmd == "diff":
            before = args.original.read_bytes(); after = args.changed.read_bytes()
            diff = binary_diff(before, after)
            print(dumps({"count": len(diff), "changes": diff}))
    except (ValueError, FileNotFoundError, PermissionError, FileExistsError, KeyError, TypeError) as ex:
        print(f"ERROR: {ex}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(run())
