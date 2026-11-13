"""Private WC6/WC7 parity worker: consumes raw bytes from stdin, never persists samples."""
import hashlib, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from wondercard.core import to_document,from_document

if len(sys.argv)!=2 or sys.argv[1] not in {"wc6","wc7","wc6full","wc7full"}:
    raise SystemExit("Unknown WC format")
fmt=sys.argv[1]
raw=sys.stdin.buffer.read(2*1024*1024+1)
if len(raw)>2*1024*1024: raise SystemExit("Size limit exceeded")
doc=to_document(raw,fmt=fmt)
if from_document(doc)!=raw: raise SystemExit("Python raw roundtrip mismatch")
fields=dict(doc["fields"])
pokemon=fields.pop("pokemon",None)
fields.pop("item",None)
fields.pop("full",None)
if pokemon: fields.update({"pokemon."+key:value for key,value in pokemon.items()})
modified=raw
if not fmt.endswith("full"):
    doc["fields"]["card_id"] ^= 1
    modified=from_document(doc)
sys.stdout.write(json.dumps({
  "source_sha":hashlib.sha256(raw).hexdigest(),
  "modified_hex":modified.hex(),
  "modified_sha":hashlib.sha256(modified).hexdigest(),
  "fields":fields
},ensure_ascii=False,separators=(",",":")))
