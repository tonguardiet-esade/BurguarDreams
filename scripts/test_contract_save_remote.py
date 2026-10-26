#!/usr/bin/env python3
"""Prueba guardado en producción (misma URL que la intranet)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "https://burguardreams.com"
USER = "Burguardreams"
PASSWORD = "BCNBurguar123++"


def req(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict | str]:
    data = None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-Auth-Token"] = token
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=45) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return resp.status, json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return resp.status, raw[:300]
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            return e.code, json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            return e.code, raw[:300]


def main() -> int:
    for path in ("/api/auth/login", "/api/login"):
        code, login = req("POST", path, {"username": USER, "password": PASSWORD})
        print("login", path, code)
        if code == 200 and isinstance(login, dict) and login.get("token"):
            break
    else:
        print("login failed", login)
        return 1

    token = login["token"]
    for get_path in ("/api/contracts.php", "/api/contracts"):
        code, listing = req("GET", get_path, token=token)
        print("GET", get_path, code, type(listing))
        if code == 200 and isinstance(listing, dict):
            break
    else:
        return 1

    row = (listing.get("rows") or [None])[0]
    if not row:
        print("no rows")
        return 1
    patch = {**row, "monthlyRent": 1111.11}
    for post_path in ("/api/contracts.php", "/api/contracts"):
        code, saved = req("POST", post_path, patch, token=token)
        print("POST", post_path, code, saved if code != 200 else saved.get("row", {}).get("monthlyRent"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
