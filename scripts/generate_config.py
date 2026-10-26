#!/usr/bin/env python3
"""Generate js/config.js from .env variables."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
OUTPUT = ROOT / "js" / "config.js"


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        raise SystemExit(f"Missing {path}. Copy .env.example to .env and fill in values.")
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def main() -> None:
    env = load_env(ENV_FILE)
    url = env.get("SUPABASE_URL") or env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("SUPABASE_KEY") or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    anon = (
        env.get("SUPABASE_ANON_KEY", "")
        or env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    ).strip()
    if not key and anon:
        key = anon
    if not url or not key:
        raise SystemExit(
            ".env must define SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) "
            "and SUPABASE_KEY or SUPABASE_ANON_KEY"
        )

    anon_line = ""
    if anon:
        anon_line = f'window.SUPABASE_ANON_KEY = "{anon}";\n'

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        f'window.SUPABASE_URL = "{url}";\n'
        f'window.SUPABASE_KEY = "{key}";\n'
        f"{anon_line}"
        'if (typeof supabase === "undefined") {\n'
        '  console.error("[Burguar Dreams] No se cargó el SDK de Supabase (CDN bloqueado o sin conexión).");\n'
        "} else {\n"
        "  window.db = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);\n"
        "}\n"
        "let currentPropertyId = null;\n",
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
