"""Rebuild the dependency-free standalone editor from web source files."""
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "web"
html = (root / "index.html").read_text(encoding="utf-8")
css = (root / "style.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="style.css">', "<style>\n" + css + "\n</style>")
for module in ("manifest", "typed_manifest", "i18n", "app"):
    content = (root / (module + ".js")).read_text(encoding="utf-8")
    html = html.replace(f'<script src="{module}.js"></script>', "<script>\n" + content + "\n</script>")
if "<script src=" in html or '<link rel="stylesheet" href="style.css">' in html:
    raise SystemExit("Unresolved local dependencies")
out = root / "standalone.html"
out.write_text(html, encoding="utf-8")
print("Created", out, "with", len(html), "characters")
