"""API contratos de alquiler (importes mensuales y resto de campos) en SQLite."""
from __future__ import annotations

import json
from typing import Any

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body, _send_json
from .db import connect, init_db, utc_now_iso
from .db_connection import row_scalar, use_postgres

SEEDS: list[dict[str, Any]] = [
    {
        "id": "c1",
        "tenantId": "tenant-urgell",
        "propertyId": "prop-urgell",
        "reference": "CNT-UR-001",
        "address": "Urgell — Comte d'Urgell 259, -2º 1ª",
        "tenant": "Emma y Sara",
        "startDate": "2026-07-01",
        "endDate": "2027-05-31",
        "status": "active",
        "monthlyRent": None,
        "monthlyUtilities": None,
        "finished": False,
        "finishedLastSixMonths": False,
        "documents": [
            {"id": "doc-c1-1", "type": "contractPdf", "available": True},
            {"id": "doc-c1-2", "type": "annex", "available": True},
        ],
    },
    {
        "id": "c2",
        "tenantId": "tenant-gran-via",
        "propertyId": "prop-gran-via",
        "reference": "CNT-GV-001",
        "address": "Gran Via — Gran Via 794, 1ª planta 2º",
        "tenant": "Punit",
        "startDate": "2026-10-03",
        "endDate": "2027-09-02",
        "status": "active",
        "monthlyRent": None,
        "monthlyUtilities": None,
        "finished": False,
        "finishedLastSixMonths": False,
        "documents": [
            {"id": "doc-c2-1", "type": "contractPdf", "available": True},
            {"id": "doc-c2-2", "type": "annex", "available": True},
        ],
    },
    {
        "id": "c3",
        "tenantId": "tenant-can-bruixa",
        "propertyId": "prop-can-bruixa",
        "reference": "CNT-CB-001",
        "address": "Can Bruixa — Carrer Can Bruixa 16, 1ª planta 1ª",
        "tenant": "Ostap y Arina",
        "startDate": "2026-07-13",
        "endDate": "2027-06-12",
        "status": "active",
        "monthlyRent": None,
        "monthlyUtilities": None,
        "finished": False,
        "finishedLastSixMonths": False,
        "documents": [
            {"id": "doc-c3-1", "type": "contractPdf", "available": True},
            {"id": "doc-c3-2", "type": "inventory", "available": True},
        ],
    },
    {
        "id": "c4",
        "tenantId": "tenant-valencia",
        "propertyId": "prop-valencia",
        "reference": "CNT-VA-001",
        "address": "València — Carrer València 178, 1ª planta 3ª",
        "tenant": "Aida Abuzaid",
        "startDate": "2026-09-16",
        "endDate": "2027-08-15",
        "status": "active",
        "monthlyRent": None,
        "monthlyUtilities": None,
        "finished": False,
        "finishedLastSixMonths": False,
        "documents": [{"id": "doc-c4-1", "type": "contractPdf", "available": True}],
    },
]

SCHEMA = """
CREATE TABLE IF NOT EXISTS rental_contracts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  property_id TEXT,
  reference TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  tenant TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  monthly_rent REAL,
  monthly_utilities REAL,
  finished INTEGER NOT NULL DEFAULT 0,
  finished_last_six_months INTEGER NOT NULL DEFAULT 0,
  documents_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant ON rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_property ON rental_contracts(property_id);
"""


def _ensure_schema(conn) -> None:
    conn.executescript(SCHEMA)
    count = conn.execute("SELECT COUNT(*) FROM rental_contracts").fetchone()[0]
    if count:
        return
    now = utc_now_iso()
    for row in SEEDS:
        conn.execute(
            """
            INSERT INTO rental_contracts (
              id, tenant_id, property_id, reference, address, tenant,
              start_date, end_date, status, monthly_rent, monthly_utilities,
              finished, finished_last_six_months, documents_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                row["id"],
                row["tenantId"],
                row["propertyId"],
                row["reference"],
                row["address"],
                row["tenant"],
                row["startDate"],
                row["endDate"],
                row["status"],
                row["monthlyRent"],
                row["monthlyUtilities"],
                1 if row["finished"] else 0,
                1 if row["finishedLastSixMonths"] else 0,
                json.dumps(row["documents"], ensure_ascii=False),
                now,
            ),
        )
    conn.commit()


def _nullable_float(raw: Any) -> float | None:
    if raw is None or raw == "":
        return None
    try:
        return round(float(raw), 2)
    except (TypeError, ValueError) as exc:
        raise AuthError("invalid_amount", 400, "Importe no válido") from exc


def _row_payload(row: Any) -> dict[str, Any]:
    try:
        documents = json.loads(row["documents_json"] or "[]")
    except json.JSONDecodeError:
        documents = []
    if not isinstance(documents, list):
        documents = []
    return {
        "id": str(row["id"]),
        "tenantId": row["tenant_id"],
        "propertyId": row["property_id"],
        "reference": str(row["reference"] or ""),
        "address": str(row["address"] or ""),
        "tenant": str(row["tenant"] or ""),
        "startDate": str(row["start_date"] or ""),
        "endDate": str(row["end_date"] or ""),
        "status": str(row["status"] or "active"),
        "monthlyRent": None if row["monthly_rent"] is None else float(row["monthly_rent"]),
        "monthlyUtilities": None
        if row["monthly_utilities"] is None
        else float(row["monthly_utilities"]),
        "finished": int(row["finished"] or 0) == 1,
        "finishedLastSixMonths": int(row["finished_last_six_months"] or 0) == 1,
        "documents": documents,
    }


def _sync_utilities_provision(conn, property_id: str | None, monthly_utilities: float | None) -> None:
    """Si hay propertyId e importe de suministros, alinear a_compte de provisiones."""
    if not property_id or monthly_utilities is None:
        return
    try:
        from .utilities_provisions_api import DEFAULTS, _ensure_schema as ensure_prov

        if property_id not in DEFAULTS:
            return
        ensure_prov(conn)
        now = utc_now_iso()
        defaults = DEFAULTS[property_id]
        conn.execute(
            """
            INSERT INTO utility_provisions
              (property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(property_id) DO UPDATE SET
              monthly_amount = excluded.monthly_amount,
              updated_at = excluded.updated_at
            """,
            (
                property_id,
                defaults["apartmentLabel"],
                defaults["addressLabel"],
                1 if defaults["water"] else 0,
                1 if defaults["electricity"] else 0,
                1 if defaults["wifi"] else 0,
                float(monthly_utilities),
                "EUR",
                now,
            ),
        )
    except Exception:  # noqa: BLE001
        pass


def handle_contracts_request(handler, method: str, path: str) -> bool:
    normalized = path.rstrip("/")
    if normalized.endswith(".php"):
        normalized = normalized[: -len(".php")]
    if normalized not in ("/api/contracts", "/api/listings/contracts"):
        return False
    try:
        if method == "GET":
            session = get_session(bearer_token(handler))
            user = session.get("user") or {}
            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                rows = conn.execute(
                    "SELECT * FROM rental_contracts ORDER BY address ASC"
                ).fetchall()
                out = []
                for row in rows:
                    payload = _row_payload(row)
                    if not is_staff_role(user.get("role")):
                        scoped = (user.get("propertyId") or "").strip()
                        if scoped and scoped != (payload.get("propertyId") or ""):
                            continue
                    out.append(payload)
            _send_json(handler, 200, {"ok": True, "rows": out})
            return True

        if method == "POST":
            session = get_session(bearer_token(handler))
            if not is_staff_role((session.get("user") or {}).get("role")):
                raise AuthError("forbidden", 403, "Solo el administrador puede editar contratos")
            body = read_json_body(handler)
            contract_id = str(body.get("id") or "").strip()
            if not contract_id:
                raise AuthError("invalid_payload", 400, "Falta id de contrato")

            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                current = conn.execute(
                    "SELECT * FROM rental_contracts WHERE id = ?",
                    (contract_id,),
                ).fetchone()

                if current:
                    payload = _row_payload(current)
                else:
                    payload = {
                        "id": contract_id,
                        "tenantId": None,
                        "propertyId": None,
                        "reference": "",
                        "address": "",
                        "tenant": "",
                        "startDate": "",
                        "endDate": "",
                        "status": "active",
                        "monthlyRent": None,
                        "monthlyUtilities": None,
                        "finished": False,
                        "finishedLastSixMonths": False,
                        "documents": [],
                    }

                for key in (
                    "tenantId",
                    "propertyId",
                    "reference",
                    "address",
                    "tenant",
                    "startDate",
                    "endDate",
                    "status",
                ):
                    if key in body:
                        payload[key] = body[key]

                if "monthlyRent" in body:
                    payload["monthlyRent"] = _nullable_float(body.get("monthlyRent"))
                if "monthlyUtilities" in body:
                    payload["monthlyUtilities"] = _nullable_float(body.get("monthlyUtilities"))
                if "finished" in body:
                    payload["finished"] = bool(body.get("finished"))
                if "finishedLastSixMonths" in body:
                    payload["finishedLastSixMonths"] = bool(body.get("finishedLastSixMonths"))
                if "documents" in body and isinstance(body.get("documents"), list):
                    payload["documents"] = body["documents"]

                if payload.get("status") == "expired":
                    payload["finished"] = True

                now = utc_now_iso()
                finished = bool(payload.get("finished"))
                finished_six = bool(payload.get("finishedLastSixMonths"))
                if use_postgres():
                    finished_val = finished
                    finished_six_val = finished_six
                else:
                    finished_val = 1 if finished else 0
                    finished_six_val = 1 if finished_six else 0
                conn.execute(
                    """
                    INSERT INTO rental_contracts (
                      id, tenant_id, property_id, reference, address, tenant,
                      start_date, end_date, status, monthly_rent, monthly_utilities,
                      finished, finished_last_six_months, documents_json, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                      tenant_id = excluded.tenant_id,
                      property_id = excluded.property_id,
                      reference = excluded.reference,
                      address = excluded.address,
                      tenant = excluded.tenant,
                      start_date = excluded.start_date,
                      end_date = excluded.end_date,
                      status = excluded.status,
                      monthly_rent = excluded.monthly_rent,
                      monthly_utilities = excluded.monthly_utilities,
                      finished = excluded.finished,
                      finished_last_six_months = excluded.finished_last_six_months,
                      documents_json = excluded.documents_json,
                      updated_at = excluded.updated_at
                    """,
                    (
                        payload["id"],
                        payload.get("tenantId"),
                        payload.get("propertyId"),
                        str(payload.get("reference") or ""),
                        str(payload.get("address") or ""),
                        str(payload.get("tenant") or ""),
                        str(payload.get("startDate") or ""),
                        str(payload.get("endDate") or ""),
                        str(payload.get("status") or "active"),
                        payload.get("monthlyRent"),
                        payload.get("monthlyUtilities"),
                        finished_val,
                        finished_six_val,
                        json.dumps(payload.get("documents") or [], ensure_ascii=False),
                        now,
                    ),
                )
                if "monthlyUtilities" in body:
                    prop = (str(payload.get("propertyId") or "").strip() or None)
                    _sync_utilities_provision(conn, prop, payload.get("monthlyUtilities"))
                conn.commit()
                saved = conn.execute(
                    "SELECT * FROM rental_contracts WHERE id = ?",
                    (contract_id,),
                ).fetchone()
            _send_json(handler, 200, {"ok": True, "row": _row_payload(saved)})
            return True

        _send_json(handler, 405, {"error": "method_not_allowed", "message": "Método no permitido"})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": str(exc)})
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[api/contracts] {exc!r}")
        _send_json(handler, 500, {"error": "server_error", "message": "Error interno en contratos"})
        return True
