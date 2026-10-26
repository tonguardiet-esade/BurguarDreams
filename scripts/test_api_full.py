#!/usr/bin/env python3
"""Smoke test API intranet (local o producción). Uso: python test_api_full.py [base_url]"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8010").rstrip("/")
USER = "Burguardreams"
PASSWORD = "BCNBurguar123++"


def call(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, object]:
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-Auth-Token"] = token
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return resp.status, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return resp.status, raw[:200]
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return e.code, raw[:200]


def main() -> int:
    errors: list[str] = []
    print("BASE", BASE)

    for path in ("/api/login.php", "/api/auth/login.php", "/api/auth/login"):
        code, payload = call("POST", path, {"username": USER, "password": PASSWORD})
        print("login", path, code)
        if code == 200 and isinstance(payload, dict) and payload.get("token"):
            token = payload["token"]
            break
        if code not in (401, 404, 405, 500):
            errors.append(f"login {path} unexpected {code}")
    else:
        errors.append("no login path worked")
        token = None

    if not token:
        print("FAIL", errors)
        return 1

    for path in ("/api/contracts.php", "/api/contracts"):
        code, payload = call("GET", path, token=token)
        print("GET", path, code)
        if code == 200 and isinstance(payload, dict) and payload.get("rows"):
            row = payload["rows"][0]
            patch = {**row, "monthlyRent": 2222.22}
            code2, saved = call("POST", path, patch, token=token)
            print("POST", path, code2, saved if code2 != 200 else (saved.get("row") or {}).get("monthlyRent"))
            if code2 != 200:
                errors.append(f"save {path} {code2} {saved}")
            break
    else:
        errors.append("contracts GET failed")

    code, ping = call("GET", "/api/ping.php")
    print("ping", code, ping if code != 200 else "ok")

    if errors:
        print("ERRORS", errors)
        return 1
    print("ALL OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
