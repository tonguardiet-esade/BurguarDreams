"""API provisiones de suministros (casillas + a compte) persistidas en SQLite."""
from __future__ import annotations

from typing import Any

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body, _send_json
from .db import connect, init_db, utc_now_iso
from .db_connection import row_scalar, use_postgres

DEFAULTS: dict[str, dict[str, Any]] = {
    "prop-urgell": {
        "id": "util-urgell",
        "apartmentLabel": "Urgell — Francesc Macià",
        "addressLabel": "Carrer Comte d'Urgell 259, -2º 1ª, 08036 Barcelona",
        "water": True,
        "electricity": True,
        "wifi": False,
        "monthlyAmount": 140.0,
    },
    "prop-gran-via": {
        "id": "util-gran-via",
        "apartmentLabel": "Gran Via",
        "addressLabel": "Gran Via de les Corts Catalanes 794, 1ª planta 2º, 08013 Barcelona",
        "water": True,
        "electricity": True,
        "wifi": False,
        "monthlyAmount": 100.0,
    },
    "prop-can-bruixa": {
        "id": "util-can-bruixa",
        "apartmentLabel": "Can Bruixa",
        "addressLabel": "Carrer Can Bruixa 16, 1ª planta 1ª, 08028 Barcelona",
        "water": True,
        "electricity": False,
        "wifi": False,
        "monthlyAmount": 35.0,
    },
    "prop-valencia": {
        "id": "util-valencia",
        "apartmentLabel": "València",
        "addressLabel": "Carrer València 178, 1ª planta 3ª, 08011 Barcelona",
        "water": True,
        "electricity": True,
        "wifi": False,
        "monthlyAmount": 100.0,
    },
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS utility_provisions (
  property_id TEXT PRIMARY KEY,
  apartment_label TEXT NOT NULL,
  address_label TEXT NOT NULL,
  water INTEGER NOT NULL DEFAULT 1,
  electricity INTEGER NOT NULL DEFAULT 1,
  wifi INTEGER NOT NULL DEFAULT 0,
  monthly_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  updated_at TEXT NOT NULL
);
"""


def _ensure_schema(conn) -> None:
    conn.executescript(SCHEMA)
    count = conn.execute("SELECT COUNT(*) FROM utility_provisions").fetchone()[0]
    if count:
        return
    now = utc_now_iso()
    for property_id, row in DEFAULTS.items():
        conn.execute(
            """
            INSERT INTO utility_provisions
              (property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                property_id,
                row["apartmentLabel"],
                row["addressLabel"],
                1 if row["water"] else 0,
                1 if row["electricity"] else 0,
                1 if row["wifi"] else 0,
                float(row["monthlyAmount"]),
                "EUR",
                now,
            ),
        )
    conn.commit()


def _row_payload(property_id: str, row: Any) -> dict[str, Any]:
    defaults = DEFAULTS[property_id]
    return {
        "id": defaults["id"],
        "propertyId": property_id,
        "apartmentLabel": str(row["apartment_label"]),
        "addressLabel": str(row["address_label"]),
        "services": {
            "water": int(row["water"]) == 1,
            "electricity": int(row["electricity"]) == 1,
            "wifi": int(row["wifi"]) == 1,
        },
        "monthlyAmount": round(float(row["monthly_amount"]), 2),
        "currency": "EUR",
        "negotiableNote": True,
    }


def monthly_amount_for(property_id: str) -> float | None:
    if property_id not in DEFAULTS:
        return None
    init_db()
    with connect() as conn:
        _ensure_schema(conn)
        row = conn.execute(
            "SELECT monthly_amount FROM utility_provisions WHERE property_id = ?",
            (property_id,),
        ).fetchone()
        if not row:
            return float(DEFAULTS[property_id]["monthlyAmount"])
        return float(row["monthly_amount"])


def handle_utilities_provisions_request(handler, method: str, path: str) -> bool:
    if path not in ("/api/utilities/provisions", "/api/utilities/provisions.php"):
        return False
    try:
        if method == "GET":
            session = get_session(bearer_token(handler))
            user = session.get("user") or {}
            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                rows = conn.execute(
                    """
                    SELECT property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency
                    FROM utility_provisions
                    ORDER BY apartment_label ASC
                    """
                ).fetchall()
                out = []
                for row in rows:
                    property_id = str(row["property_id"])
                    if not is_staff_role(user.get("role")):
                        scoped = (user.get("propertyId") or "").strip()
                        if scoped and scoped != property_id:
                            continue
                    out.append(_row_payload(property_id, row))
            _send_json(handler, 200, {"ok": True, "rows": out})
            return True

        if method == "POST":
            session = get_session(bearer_token(handler))
            if not is_staff_role((session.get("user") or {}).get("role")):
                raise AuthError("forbidden", 403, "Solo el administrador puede editar suministros")
            body = read_json_body(handler)
            property_id = str(body.get("propertyId") or "").strip()
            if property_id not in DEFAULTS:
                raise AuthError("invalid_property", 400, "Apartamento no válido")

            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                current = conn.execute(
                    """
                    SELECT apartment_label, address_label, water, electricity, wifi, monthly_amount
                    FROM utility_provisions WHERE property_id = ?
                    """,
                    (property_id,),
                ).fetchone()
                defaults = DEFAULTS[property_id]
                if current:
                    water = bool(current["water"])
                    electricity = bool(current["electricity"])
                    wifi = bool(current["wifi"])
                    monthly = float(current["monthly_amount"])
                    apt = str(current["apartment_label"])
                    addr = str(current["address_label"])
                else:
                    water = bool(defaults["water"])
                    electricity = bool(defaults["electricity"])
                    wifi = bool(defaults["wifi"])
                    monthly = float(defaults["monthlyAmount"])
                    apt = str(defaults["apartmentLabel"])
                    addr = str(defaults["addressLabel"])

                services = body.get("services") if isinstance(body.get("services"), dict) else {}
                if "water" in services:
                    water = bool(services["water"])
                if "electricity" in services:
                    electricity = bool(services["electricity"])
                if "wifi" in services:
                    wifi = bool(services["wifi"])
                if "monthlyAmount" in body:
                    try:
                        monthly = round(float(body["monthlyAmount"]), 2)
                    except (TypeError, ValueError) as exc:
                        raise AuthError("invalid_amount", 400, "Importe no válido") from exc
                    if monthly < 0:
                        raise AuthError("invalid_amount", 400, "Importe no válido")

                now = utc_now_iso()
                conn.execute(
                    """
                    INSERT INTO utility_provisions
                      (property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(property_id) DO UPDATE SET
                      water = excluded.water,
                      electricity = excluded.electricity,
                      wifi = excluded.wifi,
                      monthly_amount = excluded.monthly_amount,
                      updated_at = excluded.updated_at
                    """,
                    (
                        property_id,
                        apt,
                        addr,
                        1 if water else 0,
                        1 if electricity else 0,
                        1 if wifi else 0,
                        monthly,
                        "EUR",
                        now,
                    ),
                )
                conn.commit()
                saved = conn.execute(
                    """
                    SELECT apartment_label, address_label, water, electricity, wifi, monthly_amount
                    FROM utility_provisions WHERE property_id = ?
                    """,
                    (property_id,),
                ).fetchone()
            _send_json(handler, 200, {"ok": True, "row": _row_payload(property_id, saved)})
            return True

        _send_json(handler, 405, {"error": "method_not_allowed", "message": "Método no permitido"})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": str(exc)})
        return True
    except Exception as exc:  # noqa: BLE001
        _send_json(handler, 500, {"error": "server_error", "message": str(exc)})
        return True
