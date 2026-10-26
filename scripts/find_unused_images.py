#!/usr/bin/env python3
"""Lista imágenes en assets/ no referenciadas en HTML, CSS o JS."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
SCAN_DIRS = [ROOT / "js", ROOT / "css"]
SCAN_FILES = [ROOT / "index.html"]
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"}


def collect_images() -> list[Path]:
    out: list[Path] = []
    for path in ASSETS.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMAGE_EXT:
            out.append(path)
    return sorted(out)


def collect_references() -> set[str]:
    refs: set[str] = set()
    sources: list[Path] = list(SCAN_FILES)
    for d in SCAN_DIRS:
        sources.extend(d.rglob("*"))
    pattern = re.compile(r"[\./]*assets/[\w./\-]+\.(?:jpg|jpeg|png|webp|svg|gif)", re.I)
    for src in sources:
        if not src.is_file():
            continue
        try:
            text = src.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        for m in pattern.finditer(text):
            ref = m.group(0).lstrip("./")
            refs.add(ref)
            refs.add(ref.split("assets/", 1)[-1])
    return refs


def main() -> None:
    images = collect_images()
    refs = collect_references()
    unused: list[str] = []
    for img in images:
        rel = img.relative_to(ROOT).as_posix()
        tail = rel.split("assets/", 1)[-1]
        if rel not in refs and tail not in refs and f"assets/{tail}" not in refs:
            unused.append(rel)
    print(f"Imágenes totales: {len(images)}")
    print(f"Referencias: {len(refs)}")
    print(f"Sin referencia: {len(unused)}")
    for u in unused:
        print(f"  - {u}")


if __name__ == "__main__":
    main()
