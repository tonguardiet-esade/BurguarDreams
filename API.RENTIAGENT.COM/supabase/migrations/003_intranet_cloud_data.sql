-- Datos normalizados de la intranet. Compatible con los snapshots existentes.
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT 'Barcelona',
  postal_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenancies (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tenancies_property ON tenancies(property_id);
CREATE INDEX IF NOT EXISTS idx_tenancies_user ON tenancies(user_id);

CREATE TABLE IF NOT EXISTS industrial_contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  email TEXT,
  phone TEXT,
  notes TEXT,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agency_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'normal',
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  assigned_contact_id TEXT REFERENCES industrial_contacts(id) ON DELETE SET NULL,
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_status ON agency_tasks(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_agency_tasks_property ON agency_tasks(property_id);

CREATE TABLE IF NOT EXISTS agency_task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES agency_tasks(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON agency_task_comments(task_id, created_at);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  number TEXT,
  concept TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  issued_on DATE,
  due_on DATE,
  document_attachment_id TEXT REFERENCES intranet_attachments(id) ON DELETE SET NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_property ON invoices(property_id, issued_on DESC);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  tenant_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  period TEXT,
  concept TEXT NOT NULL DEFAULT '',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  document_attachment_id TEXT REFERENCES intranet_attachments(id) ON DELETE SET NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_receipts_property ON receipts(property_id, period);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  property_id TEXT REFERENCES properties(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expenses_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'draft',
  document_attachment_id TEXT REFERENCES intranet_attachments(id) ON DELETE SET NULL,
  details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settlements_property ON settlements(property_id, period_start DESC);

CREATE TABLE IF NOT EXISTS utility_invoices (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  year_month TEXT NOT NULL,
  water NUMERIC(12,2),
  electricity NUMERIC(12,2),
  wifi NUMERIC(12,2),
  occupied_days INTEGER,
  days_in_month INTEGER,
  source TEXT NOT NULL DEFAULT 'google_sheets',
  source_reference TEXT,
  attachment_id TEXT REFERENCES intranet_attachments(id) ON DELETE SET NULL,
  created_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(property_id, year_month)
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  entity_type TEXT,
  entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON user_notifications(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_notification_state (
  notification_id TEXT NOT NULL REFERENCES user_notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  PRIMARY KEY(notification_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_client_state (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(user_id, state_key)
);

CREATE TABLE IF NOT EXISTS assistant_conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  assistant_type TEXT NOT NULL DEFAULT 'renti',
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assistant_conversations_user
  ON assistant_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES assistant_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_conversation
  ON assistant_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_user_id, created_at DESC);

-- Identificadores ya usados por usuarios, contratos y suministros.
INSERT INTO properties (id, name, address)
VALUES
  ('prop-urgell', 'Urgell', 'Comte d''Urgell, Barcelona'),
  ('prop-gran-via', 'Gran Via', 'Gran Via, Barcelona'),
  ('prop-can-bruixa', 'Can Bruixa', 'Can Bruixa, Barcelona'),
  ('prop-valencia', 'València', 'València, Barcelona')
ON CONFLICT (id) DO NOTHING;
