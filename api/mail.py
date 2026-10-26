"""Envío de correos por SMTP (Hostinger)."""
from __future__ import annotations

import smtplib
import ssl
from email.message import EmailMessage

from .env_config import env


class MailError(Exception):
    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


def _smtp_settings() -> dict[str, str | int]:
    host = env("SMTP_HOST", "smtp.hostinger.com")
    port_raw = env("SMTP_PORT", "465") or "465"
    user = env("SMTP_USER")
    password = env("SMTP_PASSWORD")
    from_addr = env("SMTP_FROM") or user
    from_name = env("SMTP_FROM_NAME", "Burguar Dreams")

    if not user or not password or not from_addr:
        raise MailError(
            "Falta configuración SMTP. Revisa SMTP_USER / SMTP_PASSWORD en el archivo .env",
        )

    try:
        port = int(port_raw)
    except ValueError as exc:
        raise MailError("SMTP_PORT inválido") from exc

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "from_addr": from_addr,
        "from_name": from_name,
    }


def send_welcome_email(
    *,
    to_email: str,
    tenant_name: str,
    username: str,
    password: str,
    apartment_label: str | None = None,
) -> None:
    settings = _smtp_settings()
    login_url = env("INTRANET_LOGIN_URL", "https://burguardreams.com/intranet/login")

    apartment_line = (
        f"Inmueble: {apartment_label}\n" if apartment_label else ""
    )

    text_body = (
        f"Hola {tenant_name},\n\n"
        "Te damos la bienvenida a la intranet de Burguar Dreams.\n"
        "Ya puedes acceder con estas credenciales:\n\n"
        f"Usuario: {username}\n"
        f"Contraseña: {password}\n"
        f"{apartment_line}"
        f"\nAcceso: {login_url}\n\n"
        "Te recomendamos cambiar la contraseña tras el primer acceso "
        "cuando esa opción esté disponible.\n\n"
        "Un saludo,\n"
        "Burguar Dreams\n"
    )

    html_body = f"""\
<html>
  <body style="font-family: Georgia, 'Times New Roman', serif; color: #1c1c1c; line-height: 1.5;">
    <p>Hola {tenant_name},</p>
    <p>Te damos la bienvenida a la intranet de <strong>Burguar Dreams</strong>.</p>
    <p>Ya puedes acceder con estas credenciales:</p>
    <ul>
      <li><strong>Usuario:</strong> {username}</li>
      <li><strong>Contraseña:</strong> {password}</li>
      {f"<li><strong>Inmueble:</strong> {apartment_label}</li>" if apartment_label else ""}
    </ul>
    <p><a href="{login_url}">Entrar en la intranet</a></p>
    <p>Un saludo,<br/>Burguar Dreams</p>
  </body>
</html>
"""

    message = EmailMessage()
    message["Subject"] = "Bienvenida a la intranet Burguar Dreams"
    message["From"] = f"{settings['from_name']} <{settings['from_addr']}>"
    message["To"] = to_email
    message.set_content(text_body)
    message.add_alternative(html_body, subtype="html")

    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL(
            str(settings["host"]),
            int(settings["port"]),
            context=context,
            timeout=30,
        ) as server:
            server.login(str(settings["user"]), str(settings["password"]))
            server.send_message(message)
    except smtplib.SMTPAuthenticationError as exc:
        raise MailError(
            "Autenticación SMTP fallida. Revisa usuario/contraseña de aplicación en Hostinger.",
        ) from exc
    except Exception as exc:  # noqa: BLE001
        raise MailError(f"No se pudo enviar el correo: {exc}") from exc
