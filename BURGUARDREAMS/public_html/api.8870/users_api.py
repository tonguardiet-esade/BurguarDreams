"""API de usuarios (listado, notificación de alta, etc.)."""
from __future__ import annotations

import re
from typing import Any

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body, _send_json
from .db import connect, init_db
from .env_config import env
from .mail import MailError, send_welcome_email

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def handle_users_request(handler, method: str, path: str) -> bool:
    if not path.startswith("/api/users"):
        return False

    try:
        if method == "GET" and path.rstrip("/") == "/api/users/tenants":
            _list_tenants(handler)
            return True

        if method == "POST" and path.rstrip("/") == "/api/users/notify-welcome":
            _notify_welcome(handler)
            return True

        _send_json(handler, 404, {"error": "not_found", "message": "Ruta API no encontrada"})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": exc.message})
        return True
    except MailError as exc:
        _send_json(handler, 502, {"error": "mail_error", "message": exc.message})
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[api/users] {exc!r}")
        _send_json(
            handler,
            500,
            {"error": "server_error", "message": "Error interno en usuarios"},
        )
        return True


def _require_admin(handler) -> dict[str, Any]:
    session = get_session(bearer_token(handler))
    role = (session.get("user") or {}).get("role")
    if not is_staff_role(role):
        raise AuthError("forbidden", 403, "Solo el administrador puede gestionar usuarios")
    return session


def _list_tenants(handler) -> None:
    _require_admin(handler)
    init_db()
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, username, display_name, email, property_id, last_login_at
            FROM users
            WHERE role = 'user'
            ORDER BY display_name COLLATE NOCASE
            """,
        ).fetchall()

    tenants = [
        {
            "userId": row["id"],
            "username": row["username"],
            "displayName": row["display_name"],
            "email": row["email"],
            "propertyId": row["property_id"],
            "lastLoginAt": row["last_login_at"],
        }
        for row in rows
    ]
    _send_json(handler, 200, {"tenants": tenants})


def _notify_welcome(handler) -> None:
    _require_admin(handler)
    body = read_json_body(handler)

    to_email = str(body.get("toEmail") or body.get("email") or "").strip()
    tenant_name = str(body.get("tenantName") or body.get("name") or "").strip()
    username = str(body.get("username") or "").strip()
    apartment = str(body.get("apartmentLabel") or body.get("apartment") or "").strip() or None

    if not to_email or not EMAIL_RE.match(to_email):
        raise AuthError("invalid_email", 400, "Indica un correo válido")
    if not tenant_name or not username:
        raise AuthError("invalid_payload", 400, "Faltan datos del inquilino")

    password = env("TENANT_DEFAULT_PASSWORD", "1234") or "1234"

    send_welcome_email(
        to_email=to_email,
        tenant_name=tenant_name,
        username=username,
        password=password,
        apartment_label=apartment,
    )

    from .db import connect, init_db, utc_now_iso

    init_db()
    user_id = str(body.get("userId") or "").strip()
    now = utc_now_iso()
    with connect() as conn:
        if user_id:
            cur = conn.execute(
                "UPDATE users SET email = ?, updated_at = ? WHERE id = ? AND role = 'user'",
                (to_email, now, user_id),
            )
            if cur.rowcount == 0:
                conn.execute(
                    """
                    UPDATE users SET email = ?, updated_at = ?
                    WHERE username = ? COLLATE NOCASE AND role = 'user'
                    """,
                    (to_email, now, username),
                )
        else:
            conn.execute(
                """
                UPDATE users SET email = ?, updated_at = ?
                WHERE username = ? COLLATE NOCASE AND role = 'user'
                """,
                (to_email, now, username),
            )
        conn.commit()

    _send_json(
        handler,
        200,
        {
            "ok": True,
            "message": "Correo de bienvenida enviado",
            "toEmail": to_email,
            "username": username,
        },
    )
