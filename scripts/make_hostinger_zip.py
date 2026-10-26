#!/usr/bin/env python3
"""ZIP para Hostinger: api completa + intranet + .htaccess (sin assets web ni .env)."""
from __future__ import annotations

import os
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(os.environ.get("USERPROFILE", ".")) / "Downloads" / "burguardreams-COMPLETO-api-intranet-hostinger-LINUX.zip"

SKIP_DIRS = {"__pycache__", ".git", "node_modules", "assets", "data"}
SKIP_NAMES = {".env", ".env.for-hostinger"}


def should_add(rel: Path) -> bool:
    parts = rel.parts
    if parts and parts[0] in SKIP_DIRS:
        return False
    if rel.name in SKIP_NAMES:
        return False
    if rel.suffix.lower() in {".pyc", ".pyo"}:
        return False
    return True


def main() -> None:
    manifest: list[str] = []
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for label, base in (
            ("", ROOT / ".htaccess"),
            ("api", ROOT / "api"),
            ("intranet", ROOT / "intranet"),
        ):
            if label == "":
                if base.is_file():
                    arc = "public_html/.htaccess"
                    zf.write(base, arc)
                    manifest.append(arc)
                continue
            if not base.is_dir():
                raise SystemExit(f"Falta carpeta {base}")
            for path in base.rglob("*"):
                if path.is_dir():
                    continue
                rel = path.relative_to(ROOT)
                if not should_add(rel):
                    continue
                arc = "public_html/" + rel.as_posix()
                zf.write(path, arc)
                manifest.append(arc)

        api_count = sum(1 for m in manifest if m.startswith("public_html/api/"))
        intranet_count = sum(1 for m in manifest if m.startswith("public_html/intranet/"))
        readme = f"""SUBIR A HOSTINGER — {datetime.now().strftime('%Y-%m-%d %H:%M')}
ZIP COMPLETO: api + intranet (arreglo renta + Renti). ~{api_count} ficheros en api/, ~{intranet_count} en intranet/.

POR QUÉ FALLÓ EL LOGIN (404)
----------------------------
Si Hostinger «reemplaza la carpeta» al extraer un ZIP parcial, api/ queda con pocos PHP
(solo Db, BurguarContracts, contracts) y desaparecen login.php, index.php, auth/, etc.

PASOS (mezclar, NO reemplazar carpeta entera)
---------------------------------------------
1) hPanel → Archivos → public_html → crear tmp/
2) Subir ESTE zip a tmp/ y extraer DENTRO de tmp/
3) Entra en tmp/public_html/api/ → selecciona TODO → Mover a public_html/api/
   → elegir SOBRESCRIBIR ARCHIVOS (no «reemplazar carpeta» / no borrar api antes)
4) Igual con tmp/public_html/intranet/ → public_html/intranet/ (sobrescribir)
5) Si el zip trae .htaccess en public_html/, copia también a public_html/ (sobrescribir)
6) NO toques el .env de la raíz ni el .env de api/ si ya tiene DATABASE_URL

COMPROBAR
---------
- https://burguardreams.com/api/intranet-check.php → JSON ok (no 404)
- https://burguardreams.com/intranet/ → login con Ctrl+F5
- python scripts/test_api_full.py https://burguardreams.com → ALL OK

Después de verificar, puedes borrar copias viejas (api.7479, intranet.4359, …).

Ficheros en este ZIP (sin .env): {len(manifest)}
"""
        zf.writestr("public_html/LEEME-SUBIR-AHORA.txt", readme)
        zf.writestr("public_html/api/API_MANIFEST.txt", "\n".join(sorted(m for m in manifest if "/api/" in m)))

    mb = OUT.stat().st_size / (1024 * 1024)
    print("OK", OUT, f"{mb:.1f} MB", "files", len(manifest))


if __name__ == "__main__":
    main()
