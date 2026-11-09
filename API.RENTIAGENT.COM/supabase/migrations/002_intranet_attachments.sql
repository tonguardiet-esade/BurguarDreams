-- Metadatos de PDF/adjuntos de sesión (Hostinger: ficheros en data/intranet_uploads/)
CREATE TABLE IF NOT EXISTS intranet_attachments (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL DEFAULT 'documento.pdf',
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  byte_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  uploaded_by_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_intranet_attachments_user ON intranet_attachments(uploaded_by_id);
