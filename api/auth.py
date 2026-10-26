"""Endpoints de autenticación contra SQLite."""
from __future__ import annotations

import json
import secrets
import sqlite3
from typing import Any

from .db import connect, init_db, utc_now_iso
from .passwords import verify_password


STAFF_ROLES = frozenset({"admin", "superadmin"})


def is_staff_role(role: str | None) -> bool:
    return (role or "") in STAFF_ROLES


class AuthError(Exception):
    def __init__(self, code: str, status: int = 401, message: str = ""):
        super().__init__(message or code)
        self.code = code
        self.status = status
        self.message = message or code


def _user_payload(row: Any) -> dict[str, Any]:
    role = row["role"] if "role" in row.keys() else "user"
    property_id = row["property_id"] if "property_id" in row.keys() else None
    raw_email = row["email"]
    email = (
        ""
        if raw_email is None or str(raw_email).strip() == ""
        else str(raw_email)
    )
    return {
        "id": row["id"],
        "name": row["display_name"],
        "email": email,
        "username": row["username"],
        "role": role if role in ("admin", "superadmin", "user") else "user",
        "propertyId": property_id,
    }


def _session_payload(
    user: dict[str, Any],
    token: str,
    issued_at: str,
    expires_at: str | None,
) -> dict[str, Any]:
    return {
        "authenticated": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "username": user.get("username"),
            "role": user["role"],
            "propertyId": user.get("propertyId"),
        },
        "issuedAt": issued_at,
        "expiresAt": expires_at,
    }


def _issue_session_for_row(conn: Any, row: Any) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    issued_at = utc_now_iso()
    conn.execute(
        """
        INSERT INTO sessions (token, user_id, created_at, expires_at, revoked_at)
        VALUES (?, ?, ?, NULL, NULL)
        """,
        (token, row["id"], issued_at),
    )
    conn.execute(
        """
        UPDATE users
        SET last_login_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (issued_at, issued_at, row["id"]),
    )
    conn.commit()
    return _session_payload(_user_payload(row), token, issued_at, None)


def login(username: str, password: str) -> dict[str, Any]:
    username = (username or "").strip()
    password = password or ""
    if not username or not password:
        raise AuthError("missing_credentials", 400, "Usuario y contraseña obligatorios")

    init_db()
    with connect() as conn:
        row = conn.execute(
            """
            SELECT id, username, email, display_name, password_hash, role, property_id
            FROM users
            WHERE username = ? COLLATE NOCASE
            """,
            (username,),
        ).fetchone()
        if row is None or not verify_password(password, row["password_hash"]):
            raise AuthError("invalid_credentials", 401, "Usuario o contraseña incorrectos")

        return _issue_session_for_row(conn, row)


def login_with_google(id_token: str) -> dict[str, Any]:
    from .google_oauth import GoogleOAuthError, verify_google_id_token

    try:
        info = verify_google_id_token(id_token)
    except GoogleOAuthError as exc:
        raise AuthError(exc.code, exc.status, exc.message) from exc

    email = str(info.get("email") or "").strip().lower()
    init_db()
    with connect() as conn:
        row = conn.execute(
            """
            SELECT id, username, email, display_name, password_hash, role, property_id
            FROM users
            WHERE lower(email) = ?
            """,
            (email,),
        ).fetchone()
        if row is None:
            raise AuthError(
                "google_not_registered",
                403,
                "Esta cuenta de Google no está registrada en la intranet.",
            )
        return _issue_session_for_row(conn, row)


def logout(token: str | None) -> None:
    if not token:
        return
    init_db()
    with connect() as conn:
        conn.execute(
            """
            UPDATE sessions
            SET revoked_at = ?
            WHERE token = ? AND revoked_at IS NULL
            """,
            (utc_now_iso(), token),
        )
        conn.commit()


def get_session(token: str | None) -> dict[str, Any]:
    if not token:
        raise AuthError("missing_token", 401, "Sesión no encontrada")

    init_db()
    with connect() as conn:
        row = conn.execute(
            """
            SELECT
              s.token,
              s.created_at,
              s.expires_at,
              s.revoked_at,
              u.id,
              u.username,
              u.email,
              u.display_name,
              u.role,
              u.property_id
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token = ?
            """,
            (token,),
        ).fetchone()
        if row is None or row["revoked_at"]:
            raise AuthError("invalid_token", 401, "Sesión no válida")
        if row["expires_at"] and row["expires_at"] < utc_now_iso():
            raise AuthError("expired_token", 401, "Sesión caducada")

        return _session_payload(
            _user_payload(row),
            row["token"],
            row["created_at"],
            row["expires_at"],
        )


def read_json_body(handler) -> dict[str, Any]:
    length = int(handler.headers.get("Content-Length") or 0)
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    if not raw:
        return {}
    try:
        data = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise AuthError("invalid_json", 400, "JSON inválido") from exc
    if not isinstance(data, dict):
        raise AuthError("invalid_json", 400, "JSON inválido")
    return data


def bearer_token(handler) -> str | None:
    auth = handler.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        return auth[7:].strip() or None
    alt = (handler.headers.get("X-Auth-Token") or "").strip()
    return alt or None


def _is_auth_api_path(path: str) -> bool:
    normalized = path.rstrip("/")
    if normalized.startswith("/api/auth"):
        return True
    if normalized in (
        "/api/login",
        "/api/google-config",
        "/api/google-login",
        "/api/intranet-check",
    ):
        return True
    return False


def handle_auth_request(handler, method: str, path: str) -> bool:
    """
    Procesa /api/auth/* y alias Hostinger (/api/login, /api/google-config, …).
    """
    if not _is_auth_api_path(path):
        return False

    normalized = path.rstrip("/")

    try:
        if method == "GET" and normalized == "/api/intranet-check":
            from .db import database_label
            from .google_oauth import google_client_id, google_config_payload

            init_db()
            with connect() as conn:
                row = conn.execute(
                    "SELECT username, email FROM users WHERE id = 'user-burguar-001'"
                ).fetchone()
            from .env_config import env

            client_id = google_client_id()
            gemini_key = env("GEMINI_API_KEY")
            _send_json(
                handler,
                200,
                {
                    "ok": True,
                    "runtime": "python-8010",
                    "checks": {
                        "google_oauth_in_env": bool(client_id),
                        "gemini_in_env": bool(gemini_key),
                        "copilot_route": "/api/intranet/assistant",
                        "google_button_will_show": bool(client_id),
                        "burguardreams_email_in_db": row["email"] if row else None,
                        "burguardreams_email_is_gmail": bool(
                            row
                            and str(row["email"] or "").lower()
                            == "burguardreams@gmail.com"
                        ),
                        "db_path": database_label(),
                        "database": database_label(),
                    },
                    **google_config_payload(),
                },
            )
            return True

        if method == "POST" and normalized in ("/api/auth/login", "/api/login"):
            body = read_json_body(handler)
            payload = login(str(body.get("username", "")), str(body.get("password", "")))
            _send_json(handler, 200, payload)
            return True

        if method == "POST" and normalized == "/api/auth/logout":
            logout(bearer_token(handler))
            _send_json(handler, 200, {"ok": True})
            return True

        if method == "GET" and normalized == "/api/auth/session":
            payload = get_session(bearer_token(handler))
            _send_json(handler, 200, payload)
            return True

        if method == "GET" and normalized in (
            "/api/auth/google/config",
            "/api/auth/google-config",
            "/api/google-config",
        ):
            from .google_oauth import google_config_payload

            _send_json(handler, 200, google_config_payload())
            return True

        if method == "POST" and normalized in (
            "/api/auth/google",
            "/api/google-login",
        ):
            body = read_json_body(handler)
            payload = login_with_google(str(body.get("credential", "")))
            _send_json(handler, 200, payload)
            return True

        if normalized.startswith("/api/auth"):
            _send_json(handler, 404, {"error": "not_found", "message": "Ruta API no encontrada"})
            return True

        _send_json(handler, 404, {"error": "not_found", "message": "Ruta API no encontrada"})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": exc.message})
        return True
    except Exception as exc:  # noqa: BLE001 — respuesta controlada al cliente
        _send_json(
            handler,
            500,
            {"error": "server_error", "message": "Error interno de autenticación"},
        )
        print(f"[api/auth] {exc!r}")
        return True


def _send_json(handler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    if method_allows_body(handler.command):
        handler.wfile.write(body)


def method_allows_body(method: str) -> bool:
    return method.upper() != "HEAD"
