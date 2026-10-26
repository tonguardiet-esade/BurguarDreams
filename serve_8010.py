#!/usr/bin/env python3
"""Servidor local :8010 — estáticos + SPA /intranet + API /api/auth (SQLite)."""
from __future__ import annotations

import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from api.auth import handle_auth_request  # noqa: E402
from api.db import database_label, init_db, seed_all_users  # noqa: E402
from api.env_config import load_env  # noqa: E402
from api.users_api import handle_users_request  # noqa: E402
from api.utilities_api import handle_utilities_request  # noqa: E402
from api.contracts_api import handle_contracts_request  # noqa: E402
from api.utilities_ledger_api import handle_utilities_ledger_request  # noqa: E402
from api.utilities_provisions_api import handle_utilities_provisions_request  # noqa: E402
from api.tickets_api import handle_support_tickets_request  # noqa: E402
from api.assistant_api import handle_assistant_request  # noqa: E402


PORT = 8010


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):  # noqa: N802
        try:
            if self._dispatch_api():
                return
            self._serve_static_or_spa()
        except Exception:
            sys.stderr.write("SpaHandler GET error:\n")
            sys.stderr.flush()
            import traceback

            traceback.print_exc()
            try:
                self.send_error(500, "Internal Server Error")
            except Exception:
                pass

    def do_POST(self):  # noqa: N802
        if self._dispatch_api():
            return
        self.send_error(404, "Not Found")

    def do_PATCH(self):  # noqa: N802
        if self._dispatch_api():
            return
        self.send_error(404, "Not Found")

    def do_DELETE(self):  # noqa: N802
        if self._dispatch_api():
            return
        self.send_error(404, "Not Found")

    def do_OPTIONS(self):  # noqa: N802
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        if path.startswith("/api/"):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
            self.send_header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Auth-Token",
            )
            self.end_headers()
            return
        self.send_error(404, "Not Found")

    def _dispatch_api(self) -> bool:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)
        # Hostinger usa *.php; local acepta ambas formas.
        if path.endswith(".php"):
            path = path[: -len(".php")]
        if handle_support_tickets_request(self, self.command, path):
            return True
        if handle_assistant_request(self, self.command, path):
            return True
        if handle_auth_request(self, self.command, path):
            return True
        if handle_users_request(self, self.command, path):
            return True
        if handle_utilities_provisions_request(self, self.command, path):
            return True
        if handle_utilities_ledger_request(self, self.command, path):
            return True
        if handle_contracts_request(self, self.command, path):
            return True
        if handle_utilities_request(self, self.command, path):
            return True
        return False

    def _serve_static_or_spa(self) -> None:
        parsed = urlparse(self.path)
        path = unquote(parsed.path)

        # No exponer BD ni código Python por HTTP
        if path.startswith("/data/") or path.startswith("/api/"):
            self.send_error(404, "Not Found")
            return

        local = (ROOT / path.lstrip("/")).resolve()
        try:
            local.relative_to(ROOT)
            is_file = local.is_file()
        except ValueError:
            is_file = False

        # /intranet/*: solo ficheros reales (assets, fotos). Carpetas o rutas
        # SPA (p. ej. /intranet/properties/) → index.html, nunca directory listing.
        if path.startswith("/intranet") and not is_file:
            self.path = "/intranet/index.html"

        return super().do_GET()

    def end_headers(self):
        # Evita caché agresiva en demo local de API/HTML
        if self.path.startswith("/api/") or self.path.endswith(".html"):
            self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


if __name__ == "__main__":
    os.chdir(ROOT)
    load_env()
    init_db()
    users = seed_all_users()
    admin = next((u for u in users if u.get("role") == "admin"), users[0])
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), SpaHandler)
    print(f"Serving {ROOT}")
    print(f"DB:      {database_label()}")
    print(f"Admin:   {admin['username']} (+ {len(users) - 1} inquilinos)")
    print(f"Web:     http://127.0.0.1:{PORT}/")
    print(f"Demo:    http://127.0.0.1:{PORT}/intranet/")
    print(f"API:     http://127.0.0.1:{PORT}/api/login")
    print(f"Google:  http://127.0.0.1:{PORT}/api/google-config")
    print(f"Check:   http://127.0.0.1:{PORT}/api/intranet-check")
    print(f"Mail:    http://127.0.0.1:{PORT}/api/users/notify-welcome")
    print("Dev UI:  cd burguardreams-intranet && npm run dev")
    print("         http://localhost:5173/intranet/login (proxy /api -> :8010)")
    print(f"Utils:   http://127.0.0.1:{PORT}/api/utilities/invoice")
    print(f"Support: http://127.0.0.1:{PORT}/api/support/tickets.php")
    gemini = bool(__import__("os").environ.get("GEMINI_API_KEY", "").strip())
    print(f"Copilot: http://127.0.0.1:{PORT}/api/intranet/assistant (GEMINI={'sí' if gemini else 'no — revisa .env'})")
    httpd.serve_forever()
