"""API libro de suministros (SQLite) con prorrateo agua/luz."""
from __future__ import annotations

import calendar
from datetime import date
from typing import Any

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body, _send_json
from .db import connect, init_db, utc_now_iso
from .db_connection import row_scalar, use_postgres

MONTH_ABBR = {
    1: "ene",
    2: "feb",
    3: "mar",
    4: "abr",
    5: "may",
    6: "jun",
    7: "jul",
    8: "ago",
    9: "sep",
    10: "oct",
    11: "nov",
    12: "dic",
}

TENANCIES: dict[str, dict[str, Any]] = {
    "prop-urgell": {
        "start": date(2026, 7, 1),
        "end": date(2027, 5, 31),
        "aCompte": 140.0,
        "title": "Urgell (emma i Sara) (Llum i aigua)",
    },
    "prop-can-bruixa": {
        "start": date(2026, 7, 13),
        "end": date(2027, 6, 12),
        "aCompte": 35.0,
        "title": "Can Bruixa (Solo agua)",
    },
    "prop-valencia": {
        "start": date(2026, 9, 16),
        "end": date(2027, 8, 15),
        "aCompte": 100.0,
        "title": "València (Llum i aigua)",
    },
    "prop-gran-via": {
        "start": date(2026, 10, 3),
        "end": date(2027, 9, 2),
        "aCompte": 100.0,
        "title": "Gran Via (Llum i aigua)",
    },
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS utility_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  year_month TEXT NOT NULL,
  month_label TEXT NOT NULL,
  entry_date TEXT,
  water REAL,
  electricity REAL,
  wifi REAL,
  a_compte REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(property_id, year_month)
);
CREATE INDEX IF NOT EXISTS idx_utility_ledger_property ON utility_ledger(property_id, sort_order);
"""


def _require_admin(handler) -> None:
    session = get_session(bearer_token(handler))
    if not is_staff_role((session.get("user") or {}).get("role")):
        raise AuthError("forbidden", 403, "Solo el administrador puede editar suministros")


def _require_property_access(handler, property_id: str) -> dict:
    """Admin o inquilino del inmueble: lectura del libro."""
    session = get_session(bearer_token(handler))
    user = session.get("user") or {}
    if is_staff_role(user.get("role")):
        return session
    own = (user.get("propertyId") or "").strip()
    if not own and user.get("id"):
        init_db()
        with connect() as conn:
            row = conn.execute(
                "SELECT property_id FROM users WHERE id = ?",
                (user["id"],),
            ).fetchone()
            own = (row["property_id"] or "").strip() if row else ""
    if not own or own != property_id:
        raise AuthError("forbidden", 403, "No tienes acceso a este inmueble")
    return session


def occupancy(start: date, end: date, year: int, month: int) -> dict[str, Any]:
    days_in_month = calendar.monthrange(year, month)[1]
    month_start = date(year, month, 1)
    month_end = date(year, month, days_in_month)
    occ_start = max(start, month_start)
    occ_end = min(end, month_end)
    if occ_start > occ_end:
        return {"daysInMonth": days_in_month, "occupiedDays": 0, "fullMonth": False}
    occupied = (occ_end - occ_start).days + 1
    return {
        "daysInMonth": days_in_month,
        "occupiedDays": occupied,
        "fullMonth": occupied == days_in_month,
    }


def prorate(full_amount: float, days_in_month: int, occupied_days: int) -> float:
    if days_in_month <= 0 or occupied_days <= 0:
        return 0.0
    if occupied_days >= days_in_month:
        return round(full_amount, 2)
    return round(full_amount / days_in_month * occupied_days, 2)


def default_date_label(start: date, end: date, year: int, month: int, info: dict[str, Any]) -> str:
    if info["fullMonth"] or info["occupiedDays"] <= 0:
        return ""
    if year == start.year and month == start.month:
        return f"{start.day}/{start.month}/{start.year}"
    if year == end.year and month == end.month:
        return f"{end.day}/{end.month}/{end.year}"
    return ""


def _ensure_schema(conn) -> None:
    if use_postgres():
        return
    conn.executescript(SCHEMA)
    cols = {r[1] for r in conn.execute("PRAGMA table_info(utility_ledger)").fetchall()}
    if "wifi" not in cols:
        conn.execute("ALTER TABLE utility_ledger ADD COLUMN wifi REAL")
        conn.commit()


def _seed_if_empty(conn, property_id: str) -> None:
    count = row_scalar(
        conn.execute(
            "SELECT COUNT(*) FROM utility_ledger WHERE property_id = ?",
            (property_id,),
        ).fetchone()
    )
    if count:
        return
    tenancy = TENANCIES[property_id]
    start: date = tenancy["start"]
    end: date = tenancy["end"]
    y, m = start.year, start.month
    order = 0
    now = utc_now_iso()
    while (y, m) <= (end.year, end.month):
        ym = f"{y:04d}-{m:02d}"
        info = occupancy(start, end, y, m)
        a_compte = prorate(-tenancy["aCompte"], info["daysInMonth"], info["occupiedDays"])
        entry_date = default_date_label(start, end, y, m, info) or None
        water = electricity = None
        if property_id == "prop-urgell" and ym == "2026-07":
            water, electricity = 100.0, 50.0
        conn.execute(
            """
            INSERT INTO utility_ledger
              (id, property_id, year_month, month_label, entry_date, water, electricity, a_compte, sort_order, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                f"ul-{property_id}-{ym}",
                property_id,
                ym,
                MONTH_ABBR[m],
                entry_date,
                water,
                electricity,
                a_compte,
                order,
                now,
            ),
        )
        order += 1
        m += 1
        if m > 12:
            m = 1
            y += 1
    conn.commit()


def _sync_dates_and_acompte(conn, property_id: str) -> None:
    """Solo completa entry_date vacías. No pisa a_compte ni importes guardados."""
    tenancy = TENANCIES[property_id]
    start: date = tenancy["start"]
    end: date = tenancy["end"]
    now = utc_now_iso()
    rows = conn.execute(
        "SELECT year_month, entry_date FROM utility_ledger WHERE property_id = ?",
        (property_id,),
    ).fetchall()
    for row in rows:
        ym = row["year_month"]
        y, m = map(int, ym.split("-"))
        info = occupancy(start, end, y, m)
        date_label = default_date_label(start, end, y, m, info)
        current = row["entry_date"]
        if current or not date_label:
            continue
        conn.execute(
            """
            UPDATE utility_ledger
            SET entry_date = ?, updated_at = ?
            WHERE property_id = ? AND year_month = ?
            """,
            (date_label, now, property_id, ym),
        )
    conn.commit()


def _build(conn, property_id: str) -> dict[str, Any]:
    from .utilities_provisions_api import monthly_amount_for

    tenancy = TENANCIES[property_id]
    start: date = tenancy["start"]
    end: date = tenancy["end"]
    a_compte_full = monthly_amount_for(property_id)
    if a_compte_full is None:
        a_compte_full = float(tenancy["aCompte"])
    # Detectar columna wifi si existe (migración suave).
    cols = {r[1] for r in conn.execute("PRAGMA table_info(utility_ledger)").fetchall()}
    has_wifi = "wifi" in cols
    select_sql = (
        "SELECT year_month, month_label, entry_date, water, electricity, wifi, a_compte"
        if has_wifi
        else "SELECT year_month, month_label, entry_date, water, electricity, a_compte"
    )
    rows_db = conn.execute(
        f"""
        {select_sql}
        FROM utility_ledger
        WHERE property_id = ?
        ORDER BY sort_order ASC, year_month ASC
        """,
        (property_id,),
    ).fetchall()
    rows: list[dict[str, Any]] = []
    saldo = 0.0
    tot_w = tot_l = tot_wifi = tot_wp = tot_lp = tot_wifip = tot_a = 0.0
    for row in rows_db:
        ym = row["year_month"]
        y, m = map(int, ym.split("-"))
        info = occupancy(start, end, y, m)
        water = None if row["water"] is None else float(row["water"])
        light = None if row["electricity"] is None else float(row["electricity"])
        wifi = None
        if has_wifi:
            wifi = None if row["wifi"] is None else float(row["wifi"])
        a_compte = None if row["a_compte"] is None else float(row["a_compte"])
        pct = (
            1.0
            if info["fullMonth"]
            else (
                0.0
                if info["daysInMonth"] <= 0 or info["occupiedDays"] <= 0
                else info["occupiedDays"] / info["daysInMonth"]
            )
        )
        a_applied = round((a_compte or 0) * pct, 2) if a_compte is not None else 0.0
        # Saldo Excel: agua + luz + wifi + (a_compte × %)
        saldo = round(saldo + (water or 0) + (light or 0) + (wifi or 0) + a_applied, 2)
        if water is not None:
            tot_w += water
            tot_wp += water
        if light is not None:
            tot_l += light
            tot_lp += light
        if wifi is not None:
            tot_wifi += wifi
            tot_wifip += wifi
        if a_compte is not None:
            tot_a += a_compte
        entry = row["entry_date"] or default_date_label(start, end, y, m, info)
        rows.append(
            {
                "yearMonth": ym,
                "monthLabel": row["month_label"],
                "entryDate": entry or "",
                "water": water,
                "electricity": light,
                "wifi": wifi,
                "waterPay": water,
                "electricityPay": light,
                "wifiPay": wifi,
                "aCompte": a_compte,
                "saldo": saldo,
                "daysInMonth": info["daysInMonth"],
                "occupiedDays": info["occupiedDays"],
                "fullMonth": info["fullMonth"],
            }
        )
    return {
        "propertyId": property_id,
        "title": tenancy["title"],
        "aCompteFull": a_compte_full,
        "tenancyStart": tenancy["start"].isoformat(),
        "tenancyEnd": tenancy["end"].isoformat(),
        "proration": "Saldo = anterior + agua + luz + wifi + (a_compte × % mes)",
        "rows": rows,
        "totals": {
            "water": round(tot_w, 2),
            "electricity": round(tot_l, 2),
            "wifi": round(tot_wifi, 2),
            "waterPay": round(tot_wp, 2),
            "electricityPay": round(tot_lp, 2),
            "wifiPay": round(tot_wifip, 2),
            "aCompte": round(tot_a, 2),
            "saldo": saldo,
        },
    }


def _parse_amount(raw: Any) -> float | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, (int, float)):
        return round(float(raw), 2)
    text = str(raw).strip().replace("€", "").replace(" ", "")
    if not text:
        return None
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return round(float(text), 2)
    except ValueError as exc:
        raise AuthError("invalid_amount", 400, f"Importe no válido: {raw}") from exc


def handle_utilities_ledger_request(handler, method: str, path: str) -> bool:
    normalized = path.rstrip("/")
    if normalized.endswith(".php"):
        normalized = normalized[: -len(".php")]
    if normalized != "/api/utilities/ledger":
        return False
    try:
        init_db()
        with connect() as conn:
            _ensure_schema(conn)
            if method == "GET":
                from urllib.parse import parse_qs, urlparse

                qs = parse_qs(urlparse(handler.path).query)
                property_id = (qs.get("propertyId") or [""])[0].strip()
                if property_id not in TENANCIES:
                    raise AuthError("invalid_property", 400, "Apartamento no válido")
                _require_property_access(handler, property_id)
                _seed_if_empty(conn, property_id)
                _sync_dates_and_acompte(conn, property_id)
                _send_json(handler, 200, _build(conn, property_id))
                return True

            if method == "POST":
                _require_admin(handler)
                body = read_json_body(handler)
                property_id = str(body.get("propertyId") or "").strip()
                if property_id not in TENANCIES:
                    raise AuthError("invalid_property", 400, "Apartamento no válido")
                rows_in = body.get("rows")
                if not isinstance(rows_in, list):
                    raise AuthError("invalid_payload", 400, "Faltan filas del libro")
                _seed_if_empty(conn, property_id)
                tenancy = TENANCIES[property_id]
                start: date = tenancy["start"]
                end: date = tenancy["end"]
                # Fechas de estancia enviadas por el panel (como en PHP).
                start_raw = str(body.get("tenancyStart") or "").strip()
                end_raw = str(body.get("tenancyEnd") or "").strip()
                if start_raw and end_raw:
                    try:
                        start = date.fromisoformat(start_raw[:10])
                        end = date.fromisoformat(end_raw[:10])
                    except ValueError as exc:
                        raise AuthError("invalid_tenancy", 400, "Fechas de estancia no válidas") from exc
                    if start > end:
                        raise AuthError(
                            "invalid_tenancy",
                            400,
                            "La fecha de inicio debe ser anterior a la de fin",
                        )
                    TENANCIES[property_id] = {
                        **tenancy,
                        "start": start,
                        "end": end,
                    }
                from .utilities_provisions_api import monthly_amount_for

                full_amount = monthly_amount_for(property_id)
                if full_amount is None:
                    full_amount = float(tenancy["aCompte"])
                now = utc_now_iso()
                cols = {r[1] for r in conn.execute("PRAGMA table_info(utility_ledger)").fetchall()}
                has_wifi = "wifi" in cols
                keep_ym: list[str] = []
                order = 0
                for row in rows_in:
                    if not isinstance(row, dict):
                        continue
                    ym = str(row.get("yearMonth") or "").strip()
                    parts = ym.split("-")
                    if len(parts) != 2:
                        continue
                    try:
                        y, m = int(parts[0]), int(parts[1])
                    except ValueError:
                        continue
                    info = occupancy(start, end, y, m)
                    label = str(row.get("monthLabel") or "").strip() or MONTH_ABBR.get(m, ym)
                    entry = str(row.get("entryDate") or "").strip()
                    if not entry:
                        entry = default_date_label(start, end, y, m, info)
                    if info["fullMonth"]:
                        entry = ""
                    a_compte = (
                        _parse_amount(row.get("aCompte"))
                        if "aCompte" in row
                        else -abs(full_amount)
                    )
                    water = _parse_amount(row.get("water"))
                    electricity = _parse_amount(row.get("electricity"))
                    wifi = _parse_amount(row.get("wifi")) if has_wifi else None
                    exists = conn.execute(
                        "SELECT 1 FROM utility_ledger WHERE property_id = ? AND year_month = ?",
                        (property_id, ym),
                    ).fetchone()
                    if exists:
                        if has_wifi:
                            conn.execute(
                                """
                                UPDATE utility_ledger
                                SET month_label = ?, entry_date = ?, water = ?, electricity = ?,
                                    wifi = ?, a_compte = ?, sort_order = ?, updated_at = ?
                                WHERE property_id = ? AND year_month = ?
                                """,
                                (
                                    label,
                                    entry or None,
                                    water,
                                    electricity,
                                    wifi,
                                    a_compte,
                                    order,
                                    now,
                                    property_id,
                                    ym,
                                ),
                            )
                        else:
                            conn.execute(
                                """
                                UPDATE utility_ledger
                                SET month_label = ?, entry_date = ?, water = ?, electricity = ?,
                                    a_compte = ?, sort_order = ?, updated_at = ?
                                WHERE property_id = ? AND year_month = ?
                                """,
                                (
                                    label,
                                    entry or None,
                                    water,
                                    electricity,
                                    a_compte,
                                    order,
                                    now,
                                    property_id,
                                    ym,
                                ),
                            )
                    else:
                        if has_wifi:
                            conn.execute(
                                """
                                INSERT INTO utility_ledger
                                  (id, property_id, year_month, month_label, entry_date,
                                   water, electricity, wifi, a_compte, sort_order, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    f"ul-{property_id}-{ym}",
                                    property_id,
                                    ym,
                                    label,
                                    entry or None,
                                    water,
                                    electricity,
                                    wifi,
                                    a_compte,
                                    order,
                                    now,
                                ),
                            )
                        else:
                            conn.execute(
                                """
                                INSERT INTO utility_ledger
                                  (id, property_id, year_month, month_label, entry_date,
                                   water, electricity, a_compte, sort_order, updated_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                """,
                                (
                                    f"ul-{property_id}-{ym}",
                                    property_id,
                                    ym,
                                    label,
                                    entry or None,
                                    water,
                                    electricity,
                                    a_compte,
                                    order,
                                    now,
                                ),
                            )
                    keep_ym.append(ym)
                    order += 1
                if keep_ym:
                    placeholders = ",".join("?" for _ in keep_ym)
                    conn.execute(
                        f"DELETE FROM utility_ledger WHERE property_id = ? AND year_month NOT IN ({placeholders})",
                        [property_id, *keep_ym],
                    )
                conn.commit()
                payload = _build(conn, property_id)
                payload["ok"] = True
                payload["message"] = "Cambios guardados"
                _send_json(handler, 200, payload)
                return True

            _send_json(handler, 405, {"error": "method_not_allowed", "message": "Método no permitido"})
            return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": exc.message})
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[api/utilities/ledger] {exc!r}")
        _send_json(handler, 500, {"error": "server_error", "message": "Error interno en suministros"})
        return True
