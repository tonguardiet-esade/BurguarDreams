"""Verificación de ID tokens de Google Sign-In (GIS)."""
from __future__ import annotations

import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import urlopen

from .env_config import env


class GoogleOAuthError(Exception):
    def __init__(self, code: str, status: int = 401, message: str = ""):
        super().__init__(message or code)
        self.code = code
        self.status = status
        self.message = message or code


def google_client_id() -> str:
    return env("GOOGLE_OAUTH_CLIENT_ID", "")


def google_config_payload() -> dict[str, Any]:
    client_id = google_client_id()
    return {
        "enabled": bool(client_id),
        "clientId": client_id,
    }


def verify_google_id_token(id_token: str) -> dict[str, Any]:
    token = (id_token or "").strip()
    if not token:
        raise GoogleOAuthError("missing_google_token", 400, "Token de Google obligatorio")

    client_id = google_client_id()
    if not client_id:
        raise GoogleOAuthError(
            "google_not_configured",
            503,
            "Inicio con Google no configurado (GOOGLE_OAUTH_CLIENT_ID).",
        )

    url = f"https://oauth2.googleapis.com/tokeninfo?id_token={quote(token, safe='')}"
    try:
        with urlopen(url, timeout=12) as resp:
            raw = resp.read().decode("utf-8")
    except HTTPError as exc:
        raise GoogleOAuthError(
            "invalid_google_token",
            401,
            "Token de Google no válido o caducado.",
        ) from exc
    except URLError as exc:
        raise GoogleOAuthError(
            "google_unreachable",
            503,
            "No se pudo verificar el token con Google.",
        ) from exc

    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise GoogleOAuthError("invalid_google_token", 401, "Respuesta de Google inválida.") from exc

    if not isinstance(data, dict):
        raise GoogleOAuthError("invalid_google_token", 401, "Respuesta de Google inválida.")

    aud = str(data.get("aud") or data.get("azp") or "")
    if aud != client_id:
        raise GoogleOAuthError("invalid_google_token", 401, "Token de Google no válido para esta app.")

    verified = data.get("email_verified")
    if str(verified).lower() not in ("true", "1"):
        raise GoogleOAuthError("google_email_unverified", 403, "El correo de Google no está verificado.")

    email = str(data.get("email") or "").strip()
    if not email:
        raise GoogleOAuthError("invalid_google_token", 401, "Google no devolvió un correo.")

    return data
