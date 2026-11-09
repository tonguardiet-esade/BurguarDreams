"""Renti — POST /api/intranet/assistant (local serve_8010, Gemini)."""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body, _send_json
from .assistant_local import try_answer_from_context
from .env_config import env


class AssistantError(Exception):
    def __init__(self, code: str, status: int = 502, message: str = ""):
        super().__init__(message or code)
        self.code = code
        self.status = status
        self.message = message or code


def handle_assistant_request(handler, method: str, path: str) -> bool:
    normalized = path.rstrip("/")
    if normalized != "/api/intranet/assistant":
        return False

    try:
        if method != "POST":
            _send_json(handler, 405, {"error": "method_not_allowed", "message": "Solo POST"})
            return True
        payload = _chat(handler)
        _send_json(handler, 200, payload)
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": exc.message})
        return True
    except AssistantError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": exc.message})
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[api/assistant] {exc!r}")
        _send_json(
            handler,
            500,
            {"error": "server_error", "message": "Error interno del asistente"},
        )
        return True


def _require_admin(handler) -> dict[str, Any]:
    session = get_session(bearer_token(handler))
    role = (session.get("user") or {}).get("role")
    if not is_staff_role(role):
        raise AuthError("forbidden", 403, "Solo gestión puede usar Renti")
    return session


def _system_prompt(locale: str) -> str:
    return f"""Eres **Renti**, asistente de gestión de la intranet Burguar Dreams (no un chatbot de ayuda).

Idioma: locale={locale}.

Tono ejecutivo y profesional. Sin emojis ni muletillas. Primero el dato; contexto breve después.
Usa solo el JSON de contexto. No inventes datos.
Última conexión = tenants[].lastLoginAt o portalUsers[].lastLoginAt. Fin de contrato = contracts[].endDate.
Usa **negrita** para cifras y fechas. No menciones JSON ni APIs."""


def _chat(handler) -> dict[str, Any]:
    _require_admin(handler)
    body = read_json_body(handler)
    question = str(body.get("question") or "").strip()
    if not question:
        raise AssistantError("missing_question", 400, "Pregunta obligatoria")

    locale = str(body.get("locale") or "es").strip() or "es"
    context = body.get("context") if isinstance(body.get("context"), dict) else {}
    history = body.get("history") if isinstance(body.get("history"), list) else []

    local_answer = try_answer_from_context(question, context)
    if local_answer:
        return {"ok": True, "answer": local_answer, "source": "local_rules"}

    api_key = env("GEMINI_API_KEY")
    if not api_key:
        raise AssistantError(
            "assistant_not_configured",
            503,
            "Añade GEMINI_API_KEY en public_html/.env y reinicia serve_8010.py",
        )

    model = env("GEMINI_MODEL", "gemini-2.0-flash") or "gemini-2.0-flash"
    context_json = json.dumps(context, ensure_ascii=False)
    if len(context_json) > 32000:
        context_json = context_json[:32000] + "…"

    system = _system_prompt(locale)
    contents: list[dict[str, Any]] = [
        {
            "role": "user",
            "parts": [
                {
                    "text": (
                        "Datos actuales de la intranet (única fuente de verdad):\n"
                        f"```json\n{context_json}\n```"
                    ),
                },
            ],
        },
        {
            "role": "model",
            "parts": [{"text": "Entendido. Responderé solo con esos datos, tono profesional."}],
        },
    ]

    for turn in history[-10:]:
        if not isinstance(turn, dict):
            continue
        role = str(turn.get("role") or "")
        content = str(turn.get("content") or "").strip()
        if not content:
            continue
        gemini_role = "model" if role == "assistant" else "user"
        contents.append({"role": gemini_role, "parts": [{"text": content}]})

    contents.append({"role": "user", "parts": [{"text": question}]})

    payload = {
        "system_instruction": {"parts": [{"text": system}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.45, "maxOutputTokens": 1400},
    }

    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{urllib.parse.quote(model, safe='')}:generateContent"
    )
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            raw = resp.read().decode("utf-8")
            status = resp.status
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(detail)
            msg = (
                parsed.get("error", {}).get("message")
                or parsed.get("error", {}).get("status")
                or detail[:240]
            )
        except json.JSONDecodeError:
            msg = detail[:240] or str(exc)
        raise AssistantError("assistant_upstream", 502, str(msg)) from exc
    except urllib.error.URLError as exc:
        raise AssistantError("assistant_upstream", 502, f"Error de conexión: {exc.reason}") from exc

    if status < 200 or status >= 300:
        raise AssistantError("assistant_upstream", 502, "Error del proveedor IA")

    decoded = json.loads(raw)
    parts = (decoded.get("candidates") or [{}])[0].get("content", {}).get("parts") or []
    text = ""
    for part in parts:
        if isinstance(part, dict) and part.get("text"):
            text += str(part["text"])
    text = text.strip()
    if not text:
        raise AssistantError("assistant_empty", 502, "Respuesta vacía de Gemini")

    return {"ok": True, "answer": text, "source": "gemini"}
