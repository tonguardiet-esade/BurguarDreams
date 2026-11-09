-- Burguar Dreams — esquema PostgreSQL (Supabase)
-- Ejecutar en: Supabase → SQL Editor → New query → Run

CREATE EXTENSION IF NOT EXISTS citext;

-- ---------------------------------------------------------------------------
-- Auth / usuarios (vuestra lógica actual; no Supabase Auth por defecto)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username CITEXT NOT NULL UNIQUE,
  email CITEXT UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'superadmin', 'user')),
  property_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ---------------------------------------------------------------------------
-- Contratos (API persistida)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rental_contracts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  property_id TEXT,
  reference TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  tenant TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  monthly_rent DOUBLE PRECISION,
  monthly_utilities DOUBLE PRECISION,
  finished BOOLEAN NOT NULL DEFAULT FALSE,
  finished_last_six_months BOOLEAN NOT NULL DEFAULT FALSE,
  documents_json TEXT NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant ON rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_property ON rental_contracts(property_id);

-- ---------------------------------------------------------------------------
-- Suministros
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utility_provisions (
  property_id TEXT PRIMARY KEY,
  apartment_label TEXT NOT NULL,
  address_label TEXT NOT NULL,
  water BOOLEAN NOT NULL DEFAULT TRUE,
  electricity BOOLEAN NOT NULL DEFAULT TRUE,
  wifi BOOLEAN NOT NULL DEFAULT FALSE,
  monthly_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS utility_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  year_month TEXT NOT NULL,
  month_label TEXT NOT NULL,
  entry_date TEXT,
  water DOUBLE PRECISION,
  electricity DOUBLE PRECISION,
  wifi DOUBLE PRECISION,
  a_compte DOUBLE PRECISION,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(property_id, year_month)
);

CREATE INDEX IF NOT EXISTS idx_utility_ledger_property ON utility_ledger(property_id, sort_order);

CREATE TABLE IF NOT EXISTS utility_tenancy (
  property_id TEXT PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- ---------------------------------------------------------------------------
-- Tickets de soporte
-- ---------------------------------------------------------------------------
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
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_support_comments_ticket ON support_ticket_comments(ticket_id);
