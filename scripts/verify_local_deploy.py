#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
api = ROOT / "api"
intranet = ROOT / "intranet"
need_api = [
    "index.php",
    "login.php",
    ".htaccess",
    "auth/login.php",
    "Db.php",
    "BurguarContracts.php",
    "contracts.php",
    "intranet-check.php",
    "BurguarAssistant.php",
]

api_files = [
    p
    for p in api.rglob("*")
    if p.is_file() and "__pycache__" not in p.parts and p.suffix.lower() != ".pyc"
]
print("api_file_count", len(api_files))
for n in need_api:
    ok = (api / n).is_file()
    print(n, "OK" if ok else "MISSING")

bc = (api / "BurguarContracts.php").read_text(encoding="utf-8", errors="replace")
print("rent_postgres_bool_fix", "finishedDb = $finished ? 'true' : 'false'" in bc)

for d in ("fichas", "property-photos", "assets"):
    print(f"intranet/{d}", "OK" if (intranet / d).is_dir() else "MISSING")
print("intranet_file_count", len([p for p in intranet.rglob("*") if p.is_file()]))
