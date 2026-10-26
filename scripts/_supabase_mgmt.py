"""Utilidades compartidas para la API de gestión de Supabase."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
CONFIG_JS = ROOT / "js" / "config.js"
DEFAULT_PROJECT_REF = "vtwyqhxfuiwjvzgptecb"


def load_env() -> dict[str, str]:
    env: dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            env[key.strip()] = value.strip().strip('"').strip("'")
    if CONFIG_JS.exists():
        import re

        text = CONFIG_JS.read_text(encoding="utf-8")
        for key, pattern in (
            ("SUPABASE_URL", r'window\.SUPABASE_URL\s*=\s*"([^"]+)"'),
            ("SUPABASE_KEY", r'window\.SUPABASE_KEY\s*=\s*"([^"]+)"'),
            ("SUPABASE_ANON_KEY", r'window\.SUPABASE_ANON_KEY\s*=\s*"([^"]+)"'),
        ):
            if key not in env or not env[key]:
                m = re.search(pattern, text)
                if m:
                    env[key] = m.group(1)
    return env


def api_json(method: str, url: str, token: str, body: object | None = None) -> Any:
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {detail}") from e


def run_sql(project_ref: str, token: str, sql: str) -> None:
    result = api_json(
        "POST",
        f"https://api.supabase.com/v1/projects/{project_ref}/database/query",
        token,
        {"query": sql},
    )
    if isinstance(result, list):
        for row in result:
            if isinstance(row, dict) and row.get("error"):
                raise RuntimeError(row)


def set_secrets(project_ref: str, token: str, secrets: dict[str, str]) -> None:
    body = [{"name": k, "value": v} for k, v in secrets.items()]
    api_json(
        "POST",
        f"https://api.supabase.com/v1/projects/{project_ref}/secrets",
        token,
        body,
    )


def disable_verify_jwt(project_ref: str, token: str, slug: str = "resend-email") -> None:
    base = f"https://api.supabase.com/v1/projects/{project_ref}/functions"
    functions = api_json("GET", base, token)
    if not isinstance(functions, list):
        raise RuntimeError(f"Respuesta inesperada al listar funciones: {functions!r}")

    target = next((f for f in functions if f.get("slug") == slug), None)
    if not target:
        raise RuntimeError(f"No existe la función '{slug}'")

    fn_id = target.get("id")
    if not fn_id:
        raise RuntimeError(f"La función '{slug}' no tiene id")

    api_json(
        "PUT",
        base,
        token,
        [
            {
                "id": fn_id,
                "slug": slug,
                "name": target.get("name") or slug,
                "status": target.get("status") or "ACTIVE",
                "version": target.get("version", 1),
                "verify_jwt": False,
            }
        ],
    )


def deploy_function(
    project_ref: str,
    token: str,
    slug: str,
    index_path: Path,
    *,
    verify_jwt: bool = False,
) -> None:
    boundary = "----SupabaseMgmtBoundary7e9f"
    metadata = json.dumps(
        {
            "entrypoint_path": "index.ts",
            "name": slug,
            "verify_jwt": verify_jwt,
        }
    )
    file_bytes = index_path.read_bytes()
    body_parts = [
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="metadata"\r\n\r\n',
        metadata.encode(),
        b"\r\n",
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="file"; filename="index.ts"\r\n',
        b"Content-Type: application/typescript\r\n\r\n",
        file_bytes,
        b"\r\n",
        f"--{boundary}--\r\n".encode(),
    ]
    payload = b"".join(body_parts)

    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{project_ref}/functions/deploy?slug={slug}",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Deploy HTTP {e.code}: {detail}") from e


def validate_anon_key(anon: str) -> None:
    if not anon.startswith("eyJ"):
        raise ValueError(
            f"SUPABASE_ANON_KEY inválida (debe empezar por eyJ, no '{anon[:12]}...')"
        )
    if "TU_" in anon or "{{" in anon:
        raise ValueError("SUPABASE_ANON_KEY parece un placeholder, no un JWT real")
