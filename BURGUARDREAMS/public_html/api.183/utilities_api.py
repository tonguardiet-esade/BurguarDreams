"""API de suministros: contabilizar factura → Google Sheets (con prorrateo)."""
from __future__ import annotations

import calendar
import json
import urllib.error
import urllib.request
from datetime import date, datetime
from typing import Any

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body
from .env_config import env

PROPERTY_IDS = {
    "prop-urgell",
    "prop-can-bruixa",
    "prop-valencia",
    "prop-gran-via",
}

# Periodos reales de alquiler. Gran Via: fórmulas listas (datos aún no).
TENANCIES: dict[str, tuple[date, date]] = {
    "prop-urgell": (date(2026, 7, 1), date(2027, 5, 31)),
    "prop-can-bruixa": (date(2026, 7, 13), date(2027, 6, 12)),
    "prop-valencia": (date(2026, 9, 16), date(2027, 8, 15)),
    "prop-gran-via": (date(2026, 10, 3), date(2027, 9, 2)),
}


def _send_json(handler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.end_headers()
    handler.wfile.write(body)


def _require_admin(handler) -> dict[str, Any]:
    session = get_session(bearer_token(handler))
    if not session.get("authenticated"):
        raise AuthError("unauthorized", 401, "Sesión no válida")
    user = session.get("user") or {}
    if not is_staff_role(user.get("role")):
        raise AuthError("forbidden", 403, "Solo el administrador puede contabilizar facturas")
    return user


def _parse_amount(raw: str) -> float | None:
    text = (raw or "").strip().replace("€", "").replace(" ", "")
    if not text:
        return None
    if "," in text and "." in text:
        text = text.replace(".", "").replace(",", ".")
    elif "," in text:
        text = text.replace(",", ".")
    try:
        return float(text)
    except ValueError as exc:
        raise AuthError("invalid_amount", 400, f"Importe no válido: {raw}") from exc


def occupancy_for_month(start: date, end: date, year: int, month: int) -> tuple[int, int, bool]:
    """Devuelve (días_mes, días_ocupados, mes_completo)."""
    days_in_month = calendar.monthrange(year, month)[1]
    month_start = date(year, month, 1)
    month_end = date(year, month, days_in_month)
    occ_start = max(start, month_start)
    occ_end = min(end, month_end)
    if occ_start > occ_end:
        return days_in_month, 0, False
    occupied = (occ_end - occ_start).days + 1
    return days_in_month, occupied, occupied == days_in_month


def prorate(amount: float, days_in_month: int, occupied_days: int) -> float:
    if days_in_month <= 0 or occupied_days <= 0:
        return 0.0
    return round(amount / days_in_month * occupied_days, 2)


def _post_to_sheets(payload: dict[str, Any]) -> dict[str, Any]:
    url = env("GOOGLE_SHEETS_WEBHOOK_URL")
    if not url:
        raise AuthError(
            "sheets_not_configured",
            503,
            "Falta GOOGLE_SHEETS_WEBHOOK_URL en .env (despliega el Apps Script del Sheet)",
        )

    secret = env("GOOGLE_SHEETS_WEBHOOK_SECRET")
    body = dict(payload)
    if secret:
        body["secret"] = secret

    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise AuthError(
            "sheets_http_error",
            502,
            f"Google Sheets respondió {exc.code}: {detail[:200]}",
        ) from exc
    except urllib.error.URLError as exc:
        raise AuthError(
            "sheets_unreachable",
            502,
            f"No se pudo contactar con Google Sheets: {exc.reason}",
        ) from exc

    try:
        result = json.loads(raw) if raw else {}
    except json.JSONDecodeError as exc:
        raise AuthError(
            "sheets_invalid_response",
            502,
            "Respuesta inválida del webhook de Google Sheets",
        ) from exc

    if not isinstance(result, dict):
        raise AuthError("sheets_invalid_response", 502, "Respuesta inválida del webhook")

    if not result.get("ok"):
        message = str(result.get("message") or result.get("error") or "Error en Google Sheets")
        raise AuthError("sheets_write_failed", 502, message)

    return result


def handle_utilities_request(handler, method: str, path: str) -> bool:
    """Solo invoice/sync-dates. El libro editable va en utilities_ledger_api."""
    normalized = path.rstrip("/")
    if normalized not in ("/api/utilities/sync-dates", "/api/utilities/invoice"):
        return False

    try:
        if method == "POST" and normalized == "/api/utilities/sync-dates":
            _require_admin(handler)
            result = _post_to_sheets({"action": "syncTenancyDates"})
            _send_json(
                handler,
                200,
                {
                    "ok": True,
                    "message": "Fechas de entrada/salida sincronizadas en Google Sheets",
                    "sheets": result,
                },
            )
            return True

        if method == "POST" and normalized == "/api/utilities/invoice":
            _require_admin(handler)
            body = read_json_body(handler)
            property_id = str(body.get("propertyId") or "").strip()
            month = str(body.get("month") or "").strip()
            water_raw = str(body.get("water") if body.get("water") is not None else "").strip()
            electricity_raw = str(
                body.get("electricity") if body.get("electricity") is not None else ""
            ).strip()

            if property_id not in PROPERTY_IDS:
                raise AuthError("invalid_property", 400, "Apartamento no válido")
            if property_id not in TENANCIES:
                raise AuthError("invalid_tenancy", 400, "Sin periodo de alquiler")
            if not month or len(month.split("-")) != 2:
                raise AuthError("invalid_month", 400, "Selecciona un mes (YYYY-MM)")

            try:
                year_s, month_s = month.split("-")
                year, month_n = int(year_s), int(month_s)
            except ValueError as exc:
                raise AuthError("invalid_month", 400, "Mes inválido (YYYY-MM)") from exc

            water_full = _parse_amount(water_raw)
            electricity_full = _parse_amount(electricity_raw)
            if water_full is None and electricity_full is None:
                raise AuthError(
                    "missing_amounts",
                    400,
                    "Indica al menos gasto de agua o gasto de luz",
                )

            start, end = TENANCIES[property_id]
            days_in_month, occupied, full_month = occupancy_for_month(start, end, year, month_n)
            if occupied <= 0:
                raise AuthError(
                    "outside_tenancy",
                    400,
                    "Ese mes está fuera del periodo de alquiler del inmueble",
                )

            # El Apps Script aplica el prorrateo una sola vez al escribir en la hoja.
            water_pay = (
                None if water_full is None else prorate(water_full, days_in_month, occupied)
            )
            electricity_pay = (
                None
                if electricity_full is None
                else prorate(electricity_full, days_in_month, occupied)
            )

            result = _post_to_sheets(
                {
                    "action": "invoice",
                    "propertyId": property_id,
                    "month": month,
                    "water": "" if water_full is None else f"{water_full:.2f}",
                    "electricity": "" if electricity_full is None else f"{electricity_full:.2f}",
                    "daysInMonth": days_in_month,
                    "occupiedDays": occupied,
                },
            )

            msg = (
                "Factura contabilizada (mes completo)."
                if full_month
                else (
                    f"Factura prorrateada: {occupied}/{days_in_month} días "
                    f"(importe/días×días ocupados)."
                )
            )
            _send_json(
                handler,
                200,
                {
                    "ok": True,
                    "message": msg,
                    "propertyId": property_id,
                    "month": month,
                    "daysInMonth": days_in_month,
                    "occupiedDays": occupied,
                    "fullMonth": full_month,
                    "waterFull": water_full,
                    "electricityFull": electricity_full,
                    "water": water_pay,
                    "electricity": electricity_pay,
                    "sheets": result,
                },
            )
            return True

        _send_json(handler, 405, {"error": "method_not_allowed", "message": "Método no permitido"})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": exc.message})
        return True
    except Exception as exc:  # noqa: BLE001
        _send_json(
            handler,
            500,
            {"error": "server_error", "message": "Error interno en suministros"},
        )
        print(f"[api/utilities] {exc!r}")
        return True
