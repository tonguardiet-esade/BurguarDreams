#!/usr/bin/env python3
"""Estado rápido de producción (sin credenciales en salida)."""
import json
import sys
import urllib.error
import urllib.request

BASE = "https://burguardreams.com"
REQUIRED = [
    "/api/login.php",
    "/api/index.php",
    "/api/intranet-check.php",
    "/api/contracts.php",
    "/intranet/index.html",
]


def head_or_get(path: str) -> int:
    try:
        req = urllib.request.Request(BASE + path, method="GET")
        with urllib.request.urlopen(req, timeout=25) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code


def main() -> int:
    bad = []
    for path in REQUIRED:
        code = head_or_get(path)
        ok = code in (200, 401, 405)
        print(f"{path}\t{code}\t{'OK' if ok else 'FALTA'}")
        if not ok:
            bad.append(path)

    if bad:
        print("\nSube: burguardreams-LISTO-HOSTINGER-API-INTRANET-LINUX.zip (Descargas)")
        return 1
    print("\nRutas presentes. Prueba login en intranet.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
