"""Tickets de soporte (intranet Burguar Dreams) — SQLite local."""
from __future__ import annotations

import base64
import json
import uuid
from typing import Any
from urllib.parse import parse_qs, urlparse

from .auth import AuthError, bearer_token, get_session, is_staff_role, read_json_body, _send_json
from .db import connect, init_db, utc_now_iso
from .db_connection import row_scalar, use_postgres

STATUSES = frozenset({"todo", "investigating", "waiting_user", "resolved"})
PRIORITIES = frozenset({"low", "normal", "high", "urgent"})
CATEGORIES = frozenset({"general", "technical", "billing", "property", "access", "other"})

PROPERTY_LABELS: dict[str, str] = {
    "prop-urgell": "Urgell — Francesc Macià",
    "prop-gran-via": "Gran Via",
    "prop-can-bruixa": "Can Bruixa",
    "prop-valencia": "València",
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  category TEXT NOT NULL DEFAULT 'general',
  property_id TEXT,
  created_by_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  assignee_id TEXT,
  assignee_name TEXT,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_comments_ticket ON support_ticket_comments(ticket_id);
"""


def _is_superadmin(user: dict[str, Any]) -> bool:
    role = (user.get("role") or "").strip()
    if role == "superadmin":
        return True
    return (user.get("id") or "") == "user-superadmin-001"


def _require_staff(session: dict[str, Any]) -> dict[str, Any]:
    user = session.get("user") or {}
    if not is_staff_role(user.get("role")):
        raise AuthError("forbidden", 403, "Solo el equipo de gestión puede acceder a soporte")
    return user


def _ensure_schema(conn) -> None:
    conn.executescript(SCHEMA)
    count = conn.execute("SELECT COUNT(*) FROM support_tickets").fetchone()[0]
    if count:
        return
    now = utc_now_iso()
    ticket_id = "ticket-seed-1"
    conn.execute(
        """
        INSERT INTO support_tickets (
          id, number, title, description, status, priority, category,
          property_id, created_by_id, created_by_name, assignee_id, assignee_name,
          attachments_json, created_at, updated_at, resolved_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ticket_id,
            "SUP-001",
            "Acceso al panel de suministros",
            "Al entrar en Suministros desde móvil la tabla no se ve completa.",
            "investigating",
            "normal",
            "technical",
            None,
            "user-burguar-001",
            "Burguardreams",
            "user-superadmin-001",
            "Superadmin",
            "[]",
            now,
            now,
            None,
        ),
    )
    conn.execute(
        """
        INSERT INTO support_ticket_comments (
          id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            "comment-seed-1",
            ticket_id,
            "user-superadmin-001",
            "Superadmin",
            "superadmin",
            "Reproducido en iPhone. Probando scroll horizontal.",
            1,
            now,
        ),
    )
    conn.commit()


def _next_number(conn) -> str:
    row = conn.execute(
        "SELECT number FROM support_tickets ORDER BY created_at DESC LIMIT 1"
    ).fetchone()
    if not row:
        return "SUP-001"
    text = str(row["number"])
    try:
        seq = int(text.split("-")[-1]) + 1
    except ValueError:
        seq = conn.execute("SELECT COUNT(*) FROM support_tickets").fetchone()[0] + 1
    return f"SUP-{seq:03d}"


def _attachments_from_body(raw: Any, *, max_total: int = 6 * 1024 * 1024) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    total = 0
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = str(item.get("name") or "archivo").strip()[:200]
        mime = str(item.get("mimeType") or "application/octet-stream").strip()[:120]
        try:
            size = int(item.get("size") or 0)
        except (TypeError, ValueError):
            size = 0
        data_b64 = str(item.get("dataBase64") or "").strip()
        if not data_b64:
            continue
        try:
            raw_bytes = base64.b64decode(data_b64, validate=True)
        except Exception as exc:
            raise AuthError("invalid_attachment", 400, "Adjunto no válido") from exc
        if len(raw_bytes) > 2 * 1024 * 1024:
            raise AuthError("attachment_too_large", 400, "Cada adjunto máximo 2 MB")
        total += len(raw_bytes)
        if total > max_total:
            raise AuthError("attachment_too_large", 400, "Adjuntos demasiado grandes en total")
        out.append(
            {
                "id": f"att-{uuid.uuid4()}",
                "name": name,
                "mimeType": mime,
                "size": len(raw_bytes),
                "url": f"data:{mime};base64,{base64.b64encode(raw_bytes).decode('ascii')}",
            }
        )
        if len(out) >= 8:
            break
    return out


def _load_comments(conn, ticket_id: str, *, viewer: dict[str, Any]) -> list[dict[str, Any]]:
    rows = conn.execute(
        """
        SELECT id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
        FROM support_ticket_comments
        WHERE ticket_id = ?
        ORDER BY created_at ASC
        """,
        (ticket_id,),
    ).fetchall()
    superadmin = _is_superadmin(viewer)
    comments: list[dict[str, Any]] = []
    for row in rows:
        internal = int(row["is_internal"]) == 1
        internal = bool(row["is_internal"])
        if internal and not superadmin:
            continue
        comments.append(
            {
                "id": row["id"],
                "ticketId": row["ticket_id"],
                "authorId": row["author_id"],
                "authorName": row["author_name"],
                "authorRole": row["author_role"],
                "body": row["body"],
                "isInternal": internal,
                "createdAt": row["created_at"],
            }
        )
    return comments


def _ticket_payload(conn, row: Any, viewer: dict[str, Any]) -> dict[str, Any]:
    property_id = row["property_id"]
    pid = str(property_id) if property_id else None
    try:
        attachments = json.loads(row["attachments_json"] or "[]")
        if not isinstance(attachments, list):
            attachments = []
    except json.JSONDecodeError:
        attachments = []
    return {
        "id": row["id"],
        "number": row["number"],
        "title": row["title"],
        "description": row["description"],
        "status": row["status"],
        "priority": row["priority"],
        "category": row["category"],
        "propertyId": pid,
        "propertyLabel": PROPERTY_LABELS.get(pid, None) if pid else None,
        "createdById": row["created_by_id"],
        "createdByName": row["created_by_name"],
        "assigneeId": row["assignee_id"],
        "assigneeName": row["assignee_name"],
        "attachments": attachments,
        "comments": _load_comments(conn, str(row["id"]), viewer=viewer),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "resolvedAt": row["resolved_at"],
    }


def _fetch_ticket(conn, ticket_id: str, viewer: dict[str, Any]) -> dict[str, Any]:
    row = conn.execute("SELECT * FROM support_tickets WHERE id = ?", (ticket_id,)).fetchone()
    if not row:
        raise AuthError("not_found", 404, "Ticket no encontrado")
    return _ticket_payload(conn, row, viewer)


def handle_support_tickets_request(handler, method: str, path: str) -> bool:
    parsed = urlparse(handler.path)
    qs = parse_qs(parsed.query or "")
    ticket_id = (qs.get("id") or [None])[0]

    if path in ("/api/support/tickets/comment", "/api/support/tickets/comment.php"):
        return _handle_comment(handler, method)

    if path not in ("/api/support/tickets", "/api/support/tickets.php"):
        return False

    try:
        session = get_session(bearer_token(handler))
        user = _require_staff(session)

        if method == "GET":
            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                if ticket_id:
                    ticket = _fetch_ticket(conn, str(ticket_id), user)
                    _send_json(handler, 200, {"ok": True, "ticket": ticket})
                    return True
                rows = conn.execute(
                    "SELECT * FROM support_tickets ORDER BY updated_at DESC"
                ).fetchall()
                tickets = [_ticket_payload(conn, row, user) for row in rows]
            _send_json(handler, 200, {"ok": True, "tickets": tickets})
            return True

        if method == "POST":
            body = read_json_body(handler)
            title = str(body.get("title") or "").strip()
            description = str(body.get("description") or "").strip()
            if len(title) < 3:
                raise AuthError("invalid_title", 400, "Indica un título (mín. 3 caracteres)")
            if len(description) < 10:
                raise AuthError("invalid_description", 400, "Describe el problema (mín. 10 caracteres)")
            priority = str(body.get("priority") or "normal")
            category = str(body.get("category") or "general")
            if priority not in PRIORITIES:
                priority = "normal"
            if category not in CATEGORIES:
                category = "general"
            property_id = body.get("propertyId")
            pid = str(property_id).strip() if property_id else None
            if pid and pid not in PROPERTY_LABELS:
                pid = None
            attachments = _attachments_from_body(body.get("attachments"))

            now = utc_now_iso()
            tid = f"ticket-{uuid.uuid4()}"
            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                number = _next_number(conn)
                conn.execute(
                    """
                    INSERT INTO support_tickets (
                      id, number, title, description, status, priority, category,
                      property_id, created_by_id, created_by_name, assignee_id, assignee_name,
                      attachments_json, created_at, updated_at, resolved_at
                    ) VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL)
                    """,
                    (
                        tid,
                        number,
                        title,
                        description,
                        priority,
                        category,
                        pid,
                        user.get("id"),
                        user.get("name") or user.get("username"),
                        json.dumps(attachments),
                        now,
                        now,
                    ),
                )
                conn.commit()
                ticket = _fetch_ticket(conn, tid, user)
            _send_json(handler, 200, {"ok": True, "ticket": ticket})
            return True

        if method == "DELETE":
            if not _is_superadmin(user):
                raise AuthError("forbidden", 403, "Solo el superadmin puede eliminar tickets")
            tid = str(ticket_id or "").strip()
            if not tid:
                body = read_json_body(handler)
                tid = str(body.get("id") or "").strip()
            if not tid:
                raise AuthError("invalid_payload", 400, "Indica el ticket a eliminar")
            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                cur = conn.execute("DELETE FROM support_tickets WHERE id = ?", (tid,))
                if cur.rowcount == 0:
                    raise AuthError("not_found", 404, "Ticket no encontrado")
                conn.commit()
            _send_json(handler, 200, {"ok": True, "deletedId": tid})
            return True

        if method == "PATCH":
            if not _is_superadmin(user):
                raise AuthError("forbidden", 403, "Solo el superadmin puede mover tickets de fase")
            body = read_json_body(handler)
            tid = str(body.get("id") or "").strip()
            status = str(body.get("status") or "").strip()
            if not tid or status not in STATUSES:
                raise AuthError("invalid_payload", 400, "Datos de ticket no válidos")
            now = utc_now_iso()
            resolved_at = now if status == "resolved" else None
            init_db()
            with connect() as conn:
                _ensure_schema(conn)
                cur = conn.execute(
                    """
                    UPDATE support_tickets
                    SET status = ?, updated_at = ?, resolved_at = ?
                    WHERE id = ?
                    """,
                    (status, now, resolved_at, tid),
                )
                if cur.rowcount == 0:
                    raise AuthError("not_found", 404, "Ticket no encontrado")
                conn.commit()
                ticket = _fetch_ticket(conn, tid, user)
            _send_json(handler, 200, {"ok": True, "ticket": ticket})
            return True

        _send_json(handler, 405, {"error": "method_not_allowed", "message": "Método no permitido"})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": str(exc)})
        return True
    except Exception as exc:  # noqa: BLE001
        _send_json(handler, 500, {"error": "server_error", "message": str(exc)})
        return True


def _handle_comment(handler, method: str) -> bool:
    if method != "POST":
        _send_json(handler, 405, {"error": "method_not_allowed", "message": "Método no permitido"})
        return True
    try:
        session = get_session(bearer_token(handler))
        user = _require_staff(session)
        body = read_json_body(handler)
        ticket_id = str(body.get("ticketId") or "").strip()
        text = str(body.get("body") or "").strip()
        is_internal = bool(body.get("isInternal"))
        if not ticket_id or len(text) < 1:
            raise AuthError("invalid_payload", 400, "Comentario vacío")
        if is_internal and not _is_superadmin(user):
            raise AuthError("forbidden", 403, "Notas internas solo para superadmin")
        now = utc_now_iso()
        cid = f"comment-{uuid.uuid4()}"
        init_db()
        with connect() as conn:
            _ensure_schema(conn)
            exists = conn.execute(
                "SELECT id FROM support_tickets WHERE id = ?", (ticket_id,)
            ).fetchone()
            if not exists:
                raise AuthError("not_found", 404, "Ticket no encontrado")
            conn.execute(
                """
                INSERT INTO support_ticket_comments (
                  id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    cid,
                    ticket_id,
                    user.get("id"),
                    user.get("name") or user.get("username"),
                    user.get("role") or "admin",
                    text,
                    is_internal,
                ),
            )
            conn.execute(
                "UPDATE support_tickets SET updated_at = ? WHERE id = ?",
                (now, ticket_id),
            )
            conn.commit()
            ticket = _fetch_ticket(conn, ticket_id, user)
        _send_json(handler, 200, {"ok": True, "ticket": ticket})
        return True
    except AuthError as exc:
        _send_json(handler, exc.status, {"error": exc.code, "message": str(exc)})
        return True
    except Exception as exc:  # noqa: BLE001
        _send_json(handler, 500, {"error": "server_error", "message": str(exc)})
        return True
