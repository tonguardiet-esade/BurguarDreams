<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/SupabaseStorage.php';

Env::load();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$result = null;
$error = null;

if (Http::method() === 'POST') {
    try {
        $session = Auth::login(
            (string) ($_POST['username'] ?? ''),
            (string) ($_POST['password'] ?? '')
        );
        $role = (string) ($session['user']['role'] ?? '');
        if (!in_array($role, ['admin', 'superadmin'], true)) {
            throw new RuntimeException('El usuario no es administrador');
        }
        if (!SupabaseStorage::configured()) {
            throw new RuntimeException('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en .env');
        }
        SupabaseStorage::ensureBucket();
        Db::init();
        if (!Db::isPostgres()) {
            throw new RuntimeException('La API no está conectada a Supabase PostgreSQL');
        }
        $pdo = Db::connect();
        $userId = (string) ($session['user']['id'] ?? '');
        $removedPrevious = resetStaticImports($pdo);
        $uploaded = [];
        $source = __DIR__ . DIRECTORY_SEPARATOR . '_storage_import';
        if (is_dir($source)) {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($source, FilesystemIterator::SKIP_DOTS)
            );
            foreach ($iterator as $file) {
                if (!$file->isFile()) {
                    continue;
                }
                $fullPath = $file->getPathname();
                $relative = str_replace('\\', '/', substr($fullPath, strlen($source) + 1));
                while (str_starts_with($relative, '_storage_import/')) {
                    $relative = substr($relative, strlen('_storage_import/'));
                }
                $extension = strtolower(pathinfo($relative, PATHINFO_EXTENSION));
                if (!in_array($extension, ['pdf', 'jpg', 'jpeg', 'png', 'webp'], true)) {
                    continue;
                }
                $objectPath = 'static/' . $relative;
                $mime = function_exists('mime_content_type')
                    ? ((string) mime_content_type($fullPath) ?: 'application/octet-stream')
                    : 'application/octet-stream';
                SupabaseStorage::put($objectPath, $fullPath, $mime);
                $id = 'static-' . substr(hash('sha256', $relative), 0, 32);
                upsertAttachment(
                    $pdo,
                    $id,
                    $file->getFilename(),
                    $mime,
                    (int) $file->getSize(),
                    $objectPath,
                    $userId
                );
                $uploaded[] = $relative;
            }
        }

        $migratedLegacy = migrateLegacyAttachments($pdo, $userId);
        $result = [
            'bucket' => SupabaseStorage::bucket(),
            'removed_previous_static' => $removedPrevious,
            'static_files' => count($uploaded),
            'legacy_attachments' => $migratedLegacy,
            'files' => $uploaded,
        ];
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

function resetStaticImports(PDO $pdo): int
{
    $rows = $pdo->query(
        "SELECT id, storage_object_path
         FROM intranet_attachments
         WHERE storage_provider = 'supabase'
           AND storage_object_path LIKE 'static/%'"
    )->fetchAll(PDO::FETCH_ASSOC);
    $removed = 0;
    foreach ($rows as $row) {
        $path = (string) ($row['storage_object_path'] ?? '');
        if ($path !== '') {
            try {
                SupabaseStorage::delete($path);
            } catch (Throwable $e) {
                error_log('[storage-import] No se pudo borrar ' . $path . ': ' . $e->getMessage());
            }
        }
        $pdo->prepare('DELETE FROM intranet_attachments WHERE id = ?')->execute([(string) $row['id']]);
        $removed++;
    }
    return $removed;
}

function upsertAttachment(
    PDO $pdo,
    string $id,
    string $name,
    string $mime,
    int $size,
    string $objectPath,
    string $userId,
    ?string $legacyPath = null
): void {
    $now = Db::utcNow();
    $pdo->prepare(
        'INSERT INTO intranet_attachments (
           id, file_name, mime_type, byte_size, storage_path, uploaded_by_id,
           created_at, updated_at, storage_provider, storage_bucket,
           storage_object_path, legacy_storage_path
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           file_name = EXCLUDED.file_name, mime_type = EXCLUDED.mime_type,
           byte_size = EXCLUDED.byte_size, storage_path = EXCLUDED.storage_path,
           storage_provider = EXCLUDED.storage_provider,
           storage_bucket = EXCLUDED.storage_bucket,
           storage_object_path = EXCLUDED.storage_object_path,
           legacy_storage_path = COALESCE(intranet_attachments.legacy_storage_path, EXCLUDED.legacy_storage_path),
           updated_at = EXCLUDED.updated_at'
    )->execute([
        $id,
        $name,
        $mime,
        $size,
        $objectPath,
        $userId !== '' ? $userId : null,
        $now,
        $now,
        'supabase',
        SupabaseStorage::bucket(),
        $objectPath,
        $legacyPath,
    ]);
}

function migrateLegacyAttachments(PDO $pdo, string $userId): int
{
    $rows = $pdo->query(
        "SELECT id, file_name, mime_type, byte_size, storage_path
         FROM intranet_attachments
         WHERE COALESCE(storage_provider, 'hostinger') = 'hostinger'"
    )->fetchAll(PDO::FETCH_ASSOC);
    $count = 0;
    foreach ($rows as $row) {
        $legacyPath = (string) ($row['storage_path'] ?? '');
        if ($legacyPath === '' || str_contains($legacyPath, '..')) {
            continue;
        }
        $normalized = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $legacyPath);
        $dataPrefix = 'data' . DIRECTORY_SEPARATOR;
        $fullPath = dirname(__DIR__) . DIRECTORY_SEPARATOR
            . (str_starts_with($normalized, $dataPrefix) ? '' : $dataPrefix)
            . $normalized;
        if (!is_file($fullPath)) {
            continue;
        }
        $safe = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename((string) $row['file_name']));
        $objectPath = 'attachments/' . (string) $row['id'] . '__' . ($safe ?: 'documento.pdf');
        $mime = (string) ($row['mime_type'] ?? 'application/octet-stream');
        SupabaseStorage::put($objectPath, $fullPath, $mime);
        upsertAttachment(
            $pdo,
            (string) $row['id'],
            (string) $row['file_name'],
            $mime,
            (int) filesize($fullPath),
            $objectPath,
            $userId,
            $legacyPath
        );
        $count++;
    }
    return $count;
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Migrar archivos a Supabase</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.5}
    label{display:block;margin:14px 0 4px}input{width:100%;padding:10px;box-sizing:border-box}
    button{margin-top:18px;padding:10px 16px}.ok{background:#e8f5e9;padding:14px}.error{background:#ffebee;padding:14px}
    code,pre{background:#f3f3f3;padding:3px 5px}pre{overflow:auto;padding:12px}
  </style>
</head>
<body>
  <h1>Migración a Supabase Storage</h1>
  <p>Ejecuta este importador una sola vez. Usa un administrador de la intranet.</p>
  <?php if ($error !== null): ?>
    <div class="error"><strong>Error:</strong> <?= h($error) ?></div>
  <?php endif; ?>
  <?php if ($result !== null): ?>
    <div class="ok">
      <strong>Migración terminada.</strong>
      <pre><?= h(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?></pre>
      <p>Borra ahora <code>storage-import.php</code> y <code>_storage_import/</code> del servidor.</p>
    </div>
  <?php else: ?>
    <form method="post" autocomplete="off">
      <label for="username">Usuario administrador</label>
      <input id="username" name="username" required>
      <label for="password">Contraseña</label>
      <input id="password" name="password" type="password" required>
      <button type="submit">Migrar archivos</button>
    </form>
  <?php endif; ?>
</body>
</html>
