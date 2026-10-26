#!/usr/bin/env python3
"""Prueba login + GET/POST contratos (misma API que la intranet)."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8010"
USER = "Burguardreams"
PASSWORD = "BCNBurguar123++"


def req(method: str, path: str, body: dict | None = None, token: str | None = None) -> tuple[int, dict]:
    data = None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-Auth-Token"] = token
    if body is not None:
        data = json.dumps(body).encode("utf-8")
    request = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            payload = {"raw": raw[:500]}
        return e.code, payload


def main() -> int:
    print("=== POST login ===")
    code, login = req("POST", "/api/auth/login", {"username": USER, "password": PASSWORD})
    print(code, login)
    if code != 200 or "token" not in login:
        print("LOGIN FAILED")
        return 1
    token = login["token"]

    print("\n=== GET contracts.php ===")
    code, listing = req("GET", "/api/contracts.php", token=token)
    print(code, "rows", len(listing.get("rows") or []))
    if code != 200:
        print(listing)
        return 1

    rows = listing.get("rows") or []
    if not rows:
        print("No contracts")
        return 1
    row = rows[0]
    cid = row["id"]
    print("contract", cid, "rent before", row.get("monthlyRent"))

    patch = {**row, "monthlyRent": 1234.56, "monthlyUtilities": row.get("monthlyUtilities")}
    print("\n=== POST contracts.php save ===")
    code, saved = req("POST", "/api/contracts.php", patch, token=token)
    print("status", code, "payload keys", list(saved.keys()))
    if code != 200:
        print("SAVE FAILED", saved)
        return 1
    out = saved.get("row") or {}
    print("rent after", out.get("monthlyRent"))
    if out.get("monthlyRent") != 1234.56:
        print("MISMATCH")
        return 1

    print("\n=== GET verify ===")
    code, listing2 = req("GET", "/api/contracts.php", token=token)
    row2 = next((r for r in listing2.get("rows") or [] if r["id"] == cid), None)
    print("status", code, "rent", row2.get("monthlyRent") if row2 else None)
    if not row2 or row2.get("monthlyRent") != 1234.56:
        print("VERIFY FAILED")
        return 1

    print("\nOK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
