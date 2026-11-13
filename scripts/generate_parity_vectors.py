"""Generate deterministic cross-language WC6/WC7 test vectors via legacy Python code.

Synthetic data only. Do not interpret these vectors as real-world event validation.
Run from repository root: python scripts/generate_parity_vectors.py
"""
from __future__ import annotations
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT))
from wondercard.core import to_document,from_document,binary_diff  # noqa: E402

def fixture(fmt: str) -> dict:
    full=fmt.endswith("full")
    gen7=fmt.startswith("wc7")
    base=0x208 if full else 0
    original=bytearray(0x310 if full else 0x108)
    struct.pack_into("<H",original,base+0x00,25)
    title="PARITY".encode("utf-16le")
    original[base+0x02:base+0x02+len(title)]=title
    struct.pack_into("<I",original,base+0x4c,150317 if gen7 else 20150317)
    original[base+0x51]=0 # Pokemon gift
    struct.pack_into("<H",original,base+0x82,25)
    original[base+0xd0]=10
    original[base+0x105]=0xAA # untouched unknown field
    original=bytes(original)
    document=to_document(original,fmt=fmt,filename="synthetic."+fmt)
    assert from_document(document)==original,fmt
    expected={
        "card_id":document["fields"]["card_id"],
        "title":document["fields"]["title"],
        "date":document["fields"]["date"],
        "pokemon.species":document["fields"]["pokemon"]["species"],
        "pokemon.level":document["fields"]["pokemon"]["level"]
    }
    edited=json.loads(json.dumps(document))
    if not full:
        edited["fields"]["date"]="2015-03-19"
        edited["fields"]["pokemon"]["level"]=50
    modified=from_document(edited)
    diffs=binary_diff(original,modified)
    if full: assert diffs==[],fmt
    else: assert sorted(int(d["offset"],16) for d in diffs)==[0x4c,0xd0],(fmt,diffs)
    assert modified[base+0x105]==0xaa
    return {
        "format":fmt,
        "filename":"synthetic."+fmt,
        "raw_hex":original.hex(),
        "modified_hex":modified.hex(),
        "raw_sha256":hashlib.sha256(original).hexdigest(),
        "modified_sha256":hashlib.sha256(modified).hexdigest(),
        "baseline_fields":expected,
        "edited":not full,
        "byte_diffs":diffs
    }

def main() -> None:
    vectors=[fixture(f) for f in ("wc6","wc7","wc6full","wc7full")]
    output=ROOT/"tests"/"fixtures"/"generated-parity.json"
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps({
        "schema":"wondercard-python-ts-parity-v1",
        "generator":"scripts/generate_parity_vectors.py",
        "vectors":vectors
    },indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("Python parity vectors:",len(vectors),output)

if __name__=="__main__":main()
