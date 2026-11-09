-- Permite mover los binarios de Hostinger a Supabase Storage sin perder fallback.
ALTER TABLE intranet_attachments
  ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'hostinger';

ALTER TABLE intranet_attachments
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT;

ALTER TABLE intranet_attachments
  ADD COLUMN IF NOT EXISTS storage_object_path TEXT;

ALTER TABLE intranet_attachments
  ADD COLUMN IF NOT EXISTS legacy_storage_path TEXT;

UPDATE intranet_attachments
SET legacy_storage_path = storage_path
WHERE legacy_storage_path IS NULL
  AND storage_path IS NOT NULL
  AND storage_path <> '';

CREATE INDEX IF NOT EXISTS idx_intranet_attachments_storage
  ON intranet_attachments(storage_provider, storage_bucket);
