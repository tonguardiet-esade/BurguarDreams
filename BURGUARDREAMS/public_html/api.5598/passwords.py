"""Hash y verificación de contraseñas (PBKDF2-SHA256, solo stdlib)."""
from __future__ import annotations

import hashlib
import hmac
import secrets

ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 260_000


def hash_password(password: str) -> str:
    if not password:
        raise ValueError("password vacío")
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("ascii"),
        ITERATIONS,
    )
    return f"{ALGORITHM}${ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, iterations_raw, salt, expected_hex = stored.split("$", 3)
        if algorithm != ALGORITHM:
            return False
        iterations = int(iterations_raw)
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("ascii"),
            iterations,
        )
        return hmac.compare_digest(digest.hex(), expected_hex)
    except (ValueError, TypeError):
        return False
