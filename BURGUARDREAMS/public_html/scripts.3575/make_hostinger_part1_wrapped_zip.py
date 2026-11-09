"""PART1 CORE dentro de carpeta public_html/ para extracción en Hostinger."""
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(r"C:\Users\moham\Downloads\burguardreams-public_html-PART1-CORE-EN-CARPETA-public_html-LINUX.zip")

SKIP_DIRS = {".git", "__pycache__", ".cursor", "node_modules", ".venv", "venv"}
SKIP_FILES = {".env", "intranet-SUBIR.zip"}
SKIP_SUFFIX = {".pyc", ".pyo"}
SKIP_PATH_PARTS = {"data/burguar.db"}


def should_skip(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    if rel in SKIP_PATH_PARTS:
        return True
    if path.name in SKIP_FILES or path.suffix.lower() in SKIP_SUFFIX:
        return True
    if any(part in SKIP_DIRS for part in path.parts):
        return True
    if path.suffix.lower() == ".zip" and path.parent == ROOT:
        return True
    return False


def include_core(rel: str) -> bool:
    return not rel.startswith("assets/")


count = 0
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
    for p in sorted(ROOT.rglob("*")):
        if not p.is_file() or should_skip(p):
            continue
        rel = p.relative_to(ROOT).as_posix()
        if not include_core(rel):
            continue
        arc = f"public_html/{rel}"
        zf.write(p, arc)
        count += 1

print(OUT)
print("files", count, "MB", round(OUT.stat().st_size / 1024 / 1024, 1))
