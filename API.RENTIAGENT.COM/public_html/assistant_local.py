"""Respuestas deterministas del Copilot a partir del contexto enviado por el navegador."""
from __future__ import annotations

import re
import unicodedata
from typing import Any


def _norm(text: str) -> str:
    if not text:
        return ""
    lowered = text.lower()
    decomposed = unicodedata.normalize("NFD", lowered)
    return "".join(ch for ch in decomposed if unicodedata.category(ch) != "Mn")


def _includes_any(haystack: str, needles: list[str]) -> bool:
    h = _norm(haystack)
    return any(_norm(n) in h for n in needles)


def _is_task_list_query(question: str) -> bool:
    if _includes_any(
        question,
        [
            "repar",
            "tasca",
            "tarea",
            "pendent",
            "pendiente",
            "obres",
            "manteniment",
            "mantenimiento",
        ],
    ):
        return True
    q = _norm(question)
    return ("lista" in q or "listado" in q or "listar" in q) and (
        "tarea" in q or "tasca" in q or "pendiente" in q or "pendent" in q or "repar" in q
    )


def _tenant_refs(context: dict[str, Any]) -> list[dict[str, Any]]:
    refs: list[dict[str, Any]] = []
    for row in context.get("tenants") or []:
        if not isinstance(row, dict):
            continue
        refs.append(
            {
                "id": str(row.get("id") or ""),
                "name": str(row.get("name") or ""),
                "propertyId": row.get("propertyId"),
            }
        )
    for row in context.get("contracts") or []:
        if not isinstance(row, dict):
            continue
        name = str(row.get("tenant") or "")
        if not name:
            continue
        if any(_norm(r.get("name", "")) == _norm(name) for r in refs):
            continue
        refs.append({"id": "", "name": name, "propertyId": None})
    return refs


def _find_tenants_mentioned(question: str, context: dict[str, Any]) -> list[dict[str, Any]]:
    q = _norm(question)
    hits: list[tuple[int, dict[str, Any]]] = []
    for row in _tenant_refs(context):
        name = str(row.get("name") or "")
        n = _norm(name)
        if not n:
            continue
        score = 0
        if n in q:
            score += 8
        for token in [t for t in re.split(r"\s+", n) if len(t) > 3]:
            if token in q:
                score += 3
        if score >= 3:
            hits.append((score, row))
    hits.sort(key=lambda x: x[0], reverse=True)
    return [row for _, row in hits]


def _task_belongs(task: dict[str, Any], tenant: dict[str, Any]) -> bool:
    tid = str(tenant.get("id") or "")
    tpid = tenant.get("propertyId")
    if tid and str(task.get("tenantId") or "") == tid:
        return True
    if tpid and task.get("propertyId") == tpid:
        return True
    name = _norm(str(tenant.get("name") or ""))
    tn = _norm(str(task.get("tenantName") or ""))
    if name and tn and (name == tn or name in tn or tn in name):
        return True
    blob = _norm(f"{task.get('title', '')} {task.get('propertyLabel', '')}")
    if name and name in blob:
        return True
    for token in [t for t in re.split(r"\s+", name) if len(t) > 3]:
        if token in blob:
            return True
    return False


def _receipt_matches_client(receipt: dict[str, Any], tenant: dict[str, Any]) -> bool:
    client = _norm(str(receipt.get("client") or ""))
    name = _norm(str(tenant.get("name") or ""))
    if not client or not name:
        return False
    if client == name or name in client or client in name:
        return True
    for token in [t for t in re.split(r"\s+", name) if len(t) > 2]:
        if token in client:
            return True
    return False


def _is_receipt_count_query(question: str) -> bool:
    if not _includes_any(question, ["recibo", "rebut", "receipt"]):
        return False
    return _includes_any(
        question,
        [
            "cuantos",
            "cuántos",
            "quants",
            "how many",
            "numero",
            "número",
            "cantidad",
            "tiene",
            "té",
            "hay",
        ],
    ) or bool(re.search(r"\bcuant[oa]s?\b", _norm(question)))


def _try_answer_receipt_inquiry(question: str, context: dict[str, Any]) -> str | None:
    if not _is_receipt_count_query(question):
        return None
    receipts = [r for r in (context.get("receipts") or []) if isinstance(r, dict)]
    mentioned = _find_tenants_mentioned(question, context)
    if not mentioned:
        return (
            f"Hay **{len(receipts)} recibos** en el listado actual. "
            "Indique el inquilino (por ejemplo: Punit) para contar solo los suyos."
        )
    label = " / ".join(str(t.get("name") or "") for t in mentioned)
    scoped = [r for r in receipts if any(_receipt_matches_client(r, t) for t in mentioned)]
    if not scoped:
        return (
            f"**{label}** no tiene recibos en el listado actual (**0**). "
            "Revise **Recibos** en la intranet y vuelva a preguntar."
        )
    total = sum(float(r.get("amount") or 0) for r in scoped)
    lines = []
    for r in scoped:
        lines.append(
            f"• **{r.get('reference', '—')}** — {r.get('amount', '—')} € ({r.get('date', '—')})"
        )
    body = "\n".join(lines)
    return (
        f"**{label}** tiene **{len(scoped)} recibo(s)** registrados, "
        f"importe acumulado **{total:.2f} €**:\n\n{body}"
    )


def _try_answer_tasks(question: str, context: dict[str, Any]) -> str | None:
    if not _is_task_list_query(question):
        return None

    tasks_raw = context.get("agencyTasks") or []
    tasks = [t for t in tasks_raw if isinstance(t, dict)]
    mentioned = _find_tenants_mentioned(question, context)
    exclusive = _includes_any(
        question,
        [
            "explicit",
            "solo ",
            " solamente",
            "únicamente",
            "unicamente",
            "ningun otro",
            "ningún otro",
        ],
    ) and len(mentioned) > 0

    scope = mentioned if (exclusive or mentioned) else []

    if scope:
        filtered = [t for t in tasks if any(_task_belongs(t, tenant) for tenant in scope)]
        label = " / ".join(str(t.get("name") or "") for t in scope)
        if not filtered:
            return (
                f"**Tareas pendientes de {label}:** ninguna en el listado enviado "
                "(estado pendiente o en revisión).\n\n"
                "Revise la sección **Tareas** en la intranet y recargue la página antes de volver a preguntar."
            )
        lines = []
        for task in filtered:
            prop = task.get("propertyLabel")
            extra = f" · {prop}" if prop else ""
            lines.append(
                f"• **{task.get('number', '—')}** — {task.get('title', '—')} "
                f"(estado: {task.get('status', '—')}, prioridad {task.get('priority', '—')}){extra}"
            )
        body = "\n".join(lines)
        return (
            f"**Tareas pendientes exclusivamente de {label}** ({len(filtered)}):\n\n{body}\n\n"
            "Detalle en **Tareas** de la intranet."
        )

    if not tasks:
        return (
            "**Sin tareas pendientes** en el contexto recibido del navegador.\n\n"
            "Abra **Tareas** en la intranet (mismo navegador), espere a que cargue el tablero y vuelva a preguntar."
        )

    lines = []
    for task in tasks:
        who = task.get("tenantName")
        who_suffix = f" · {who}" if who else ""
        prop = task.get("propertyLabel")
        extra = f" · {prop}" if prop else ""
        lines.append(
            f"• **{task.get('number', '—')}** — {task.get('title', '—')} "
            f"(estado: {task.get('status', '—')}, prioridad {task.get('priority', '—')})"
            f"{extra}{who_suffix}"
        )
    return (
        f"**Tareas abiertas** ({len(tasks)}):\n\n" + "\n".join(lines) + "\n\n"
        "Indique un inquilino para filtrar solo su cartera."
    )


def _is_notification_query(question: str) -> bool:
    return _includes_any(
        question,
        [
            "notific",
            "aviso",
            "alerta",
            "campana",
            "llegado",
            "llegó",
            "llego",
            "recibi",
            "recibí",
            "bandeja",
        ],
    )


def _looks_like_stay_ending(text: str) -> bool:
    blob = _norm(text)
    return (
        "30" in blob
        or "estancia" in blob
        or "fin de" in blob
        or "caduc" in blob
        or "venc" in blob
        or "contrato" in blob
        or "dias" in blob
    )


def _try_answer_notifications(question: str, context: dict[str, Any]) -> str | None:
    if not _is_notification_query(question):
        return None
    stay_topic = _looks_like_stay_ending(question) or _includes_any(
        question, ["contrato", "caduc", "venc", "estancia", "30", "treinta"]
    )
    if not stay_topic:
        unread = [n for n in (context.get("notificationsUnread") or []) if isinstance(n, dict)]
        read = [n for n in (context.get("notificationsRead") or []) if isinstance(n, dict)]
        items = unread + read
        if not items:
            return "No hay **notificaciones** visibles en la bandeja."
        lines = "\n".join(
            f"• **{n.get('title', '—')}** — {n.get('body', '')}" for n in items[:10]
        )
        return f"Avisos en bandeja:\n\n{lines}"

    unread = [
        n
        for n in (context.get("notificationsUnread") or [])
        if isinstance(n, dict)
        and _looks_like_stay_ending(f"{n.get('title', '')} {n.get('body', '')}")
    ]
    read = [
        n
        for n in (context.get("notificationsRead") or [])
        if isinstance(n, dict)
        and _looks_like_stay_ending(f"{n.get('title', '')} {n.get('body', '')}")
    ]
    if unread:
        lines = "\n".join(f"• **{n.get('title', '—')}** — {n.get('body', '')}" for n in unread)
        return (
            "Sí: avisos **pendientes** sobre fin de estancia / 30 días:\n\n"
            f"{lines}\n\nRevise la campana (pestaña pendientes)."
        )
    if read:
        lines = "\n".join(f"• **{n.get('title', '—')}** — {n.get('body', '')}" for n in read)
        return (
            "Sí: consta en **notificaciones leídas**:\n\n"
            f"{lines}\n\nCampana → pestaña Leídas."
        )
    alerts = [
        a for a in (context.get("contractStayEndingAlerts") or []) if isinstance(a, dict)
    ]
    if alerts:
        lines = []
        for row in alerts:
            extra = (
                " — aviso automático de 30 días hoy"
                if row.get("systemWouldNotify")
                else ""
            )
            lines.append(
                f"• **{row.get('tenantName', '—')}** ({row.get('apartmentLabel', '—')}): "
                f"quedan **{row.get('daysRemaining', '—')}** días, fin {row.get('endDate', '—')}{extra}"
            )
        body = "\n".join(lines)
        return (
            "No aparece ese aviso en la bandeja ahora, pero contratos a ≤30 días del fin:\n\n"
            f"{body}\n\nEl aviso «Fin de estancia en 30 días» solo sale el día exacto que faltan 30."
        )
    return (
        "No consta aviso de 30 días en pendientes ni leídas, "
        "y ningún contrato está ahora en ventana ≤30 días."
    )


def try_answer_from_context(question: str, context: dict[str, Any]) -> str | None:
    notification = _try_answer_notifications(question, context)
    if notification:
        return notification
    receipt = _try_answer_receipt_inquiry(question, context)
    if receipt:
        return receipt
    return _try_answer_tasks(question, context)
