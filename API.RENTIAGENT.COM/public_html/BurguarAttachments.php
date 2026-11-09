<?php
declare(strict_types=1);

require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/SupabaseStorage.php';

/**
 * PDF/adjuntos en Supabase Storage, con fallback de lectura en disco durante la migración.
 */
final class Attachments
{
    private const MAX_BYTES = 25 * 1024 * 1024;

    public static function upload(): array
    {
        $session = Auth::requireAdmin();
        $userId = (string) ($session['user']['id'] ?? '');

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            throw new ApiError('missing_file', 400, 'Falta el archivo (campo file)');
        }
        $file = $_FILES['file'];
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            throw new ApiError('upload_error', 400, 'Error al subir el archivo');
        }
        $tmp = (string) ($file['tmp_name'] ?? '');
        if ($tmp === '' || !is_uploaded_file($tmp)) {
            throw new ApiError('invalid_upload', 400, 'Subida no válida');
        }
        $size = (int) ($file['size'] ?? 0);
        if ($size <= 0 || $size > self::MAX_BYTES) {
            throw new ApiError('file_too_large', 400, 'El archivo supera el límite (25 MB)');
        }

        $id = trim((string) ($_POST['id'] ?? ''));
        if ($id === '') {
            throw new ApiError('missing_id', 400, 'Falta id del adjunto');
        }
        if (!preg_match('/^[a-zA-Z0-9._-]{1,200}$/', $id)) {
            throw new ApiError('invalid_id', 400, 'Identificador de adjunto no válido');
        }

        $originalName = (string) ($file['name'] ?? 'documento.pdf');
        $mime = (string) ($file['type'] ?? '');
        if ($mime === '') {
            $mime = 'application/pdf';
        }

        Db::init();
        $pdo = Db::connect();

        $safeFile = preg_replace('/[^a-zA-Z0-9._-]/', '_', basename($originalName));
        if ($safeFile === '') {
            $safeFile = 'documento.pdf';
        }
        $version = gmdate('YmdHis') . '-' . bin2hex(random_bytes(4));
        $storageName = $id . '__' . $version . '__' . $safeFile;
        $provider = SupabaseStorage::configured() ? 'supabase' : 'hostinger';
        $bucket = null;
        $objectPath = null;
        $currentFullPath = null;
        $relPath = 'intranet_uploads/' . $storageName;
        if ($provider === 'supabase') {
            SupabaseStorage::ensureBucket();
            $bucket = SupabaseStorage::bucket();
            $objectPath = 'attachments/' . $storageName;
            SupabaseStorage::put($objectPath, $tmp, $mime);
            $relPath = $objectPath;
        } else {
            $dir = self::storageDir();
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new ApiError('storage_error', 500, 'No se pudo crear el directorio de adjuntos');
            }
            $fullPath = $dir . DIRECTORY_SEPARATOR . $storageName;
            $currentFullPath = $fullPath;
            if (!move_uploaded_file($tmp, $fullPath)) {
                throw new ApiError('move_failed', 500, 'No se pudo guardar el archivo');
            }
        }
        $now = Db::utcNow();

        $selectColumns = Db::isPostgres()
            ? 'storage_path, storage_provider, storage_object_path, legacy_storage_path'
            : 'storage_path';
        $sel = $pdo->prepare('SELECT ' . $selectColumns . ' FROM intranet_attachments WHERE id = ?');
        $sel->execute([$id]);
        $prev = $sel->fetch();
        if (!is_array($prev)) {
            $prev = [];
        }
        $oldObjectToDelete = null;
        $oldLocalToDelete = null;
        if ($prev && !empty($prev['storage_path'])) {
            $oldProvider = (string) ($prev['storage_provider'] ?? 'hostinger');
            if ($oldProvider === 'supabase' && !empty($prev['storage_object_path']) && SupabaseStorage::configured()) {
                $oldObject = (string) $prev['storage_object_path'];
                if ($oldObject !== $objectPath) {
                    $oldObjectToDelete = $oldObject;
                }
            } else {
                $oldFull = self::absolutePath((string) $prev['storage_path']);
                if ($oldFull !== '' && $oldFull !== $currentFullPath) {
                    $oldLocalToDelete = $oldFull;
                }
            }
        }

        if (Db::isPostgres()) {
            $pdo->prepare(
                'INSERT INTO intranet_attachments (
                   id, file_name, mime_type, byte_size, storage_path, uploaded_by_id,
                   created_at, updated_at, storage_provider, storage_bucket,
                   storage_object_path, legacy_storage_path
                 )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT (id) DO UPDATE SET
                   file_name = EXCLUDED.file_name,
                   mime_type = EXCLUDED.mime_type,
                   byte_size = EXCLUDED.byte_size,
                   storage_path = EXCLUDED.storage_path,
                   uploaded_by_id = EXCLUDED.uploaded_by_id,
                   storage_provider = EXCLUDED.storage_provider,
                   storage_bucket = EXCLUDED.storage_bucket,
                   storage_object_path = EXCLUDED.storage_object_path,
                   legacy_storage_path = COALESCE(intranet_attachments.legacy_storage_path, EXCLUDED.legacy_storage_path),
                   updated_at = EXCLUDED.updated_at'
            )->execute([
                $id,
                $originalName,
                $mime,
                $size,
                $relPath,
                $userId !== '' ? $userId : null,
                $now,
                $now,
                $provider,
                $bucket,
                $objectPath,
                $prev['legacy_storage_path'] ?? (
                    (($prev['storage_provider'] ?? 'hostinger') === 'hostinger')
                        ? ($prev['storage_path'] ?? null)
                        : null
                ),
            ]);
        } else {
            $pdo->prepare(
                'INSERT OR REPLACE INTO intranet_attachments (id, file_name, mime_type, byte_size, storage_path, uploaded_by_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM intranet_attachments WHERE id = ?), ?), ?)'
            )->execute([
                $id,
                $originalName,
                $mime,
                $size,
                $relPath,
                $userId !== '' ? $userId : null,
                $id,
                $now,
                $now,
            ]);
        }
        if ($oldObjectToDelete !== null) {
            try {
                SupabaseStorage::delete($oldObjectToDelete);
            } catch (Throwable $e) {
                error_log('[attachments] No se pudo limpiar objeto anterior: ' . $e->getMessage());
            }
        }
        if ($oldLocalToDelete !== null && is_file($oldLocalToDelete)) {
            @unlink($oldLocalToDelete);
        }

        return [
            'ok' => true,
            'id' => $id,
            'fileName' => $originalName,
            'mimeType' => $mime,
            'byteSize' => $size,
            'storageProvider' => $provider,
        ];
    }

    public static function delete(string $id): array
    {
        Auth::requireAdmin();
        $id = trim($id);
        if ($id === '' || !preg_match('/^[a-zA-Z0-9._-]{1,200}$/', $id)) {
            throw new ApiError('invalid_id', 400, 'Identificador no válido');
        }
        Db::init();
        $pdo = Db::connect();
        $selectColumns = Db::isPostgres()
            ? 'storage_path, storage_provider, storage_object_path, legacy_storage_path'
            : 'storage_path';
        $stmt = $pdo->prepare('SELECT ' . $selectColumns . ' FROM intranet_attachments WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            return ['ok' => true, 'deleted' => false];
        }
        $provider = (string) ($row['storage_provider'] ?? 'hostinger');
        $path = self::absolutePath((string) ($row['legacy_storage_path'] ?? $row['storage_path']));
        if ($provider === 'supabase' && !empty($row['storage_object_path']) && SupabaseStorage::configured()) {
            SupabaseStorage::delete((string) $row['storage_object_path']);
        }
        $pdo->prepare('DELETE FROM intranet_attachments WHERE id = ?')->execute([$id]);
        if ($path !== '' && is_file($path)) {
            @unlink($path);
        }
        return ['ok' => true, 'deleted' => true];
    }

    /** Metadatos para que otra sesión/navegador muestre el nombre sin tener el blob local. */
    public static function meta(string $id): array
    {
        Auth::requireAdmin();
        $id = trim($id);
        if ($id === '' || !preg_match('/^[a-zA-Z0-9._-]{1,200}$/', $id)) {
            throw new ApiError('invalid_id', 400, 'Identificador no válido');
        }
        Db::init();
        $pdo = Db::connect();
        $stmt = $pdo->prepare(
            'SELECT id, file_name, mime_type, byte_size'
            . (Db::isPostgres() ? ', storage_provider' : '')
            . ' FROM intranet_attachments WHERE id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new ApiError('not_found', 404, 'Adjunto no encontrado');
        }
        return [
            'ok' => true,
            'id' => (string) $row['id'],
            'fileName' => (string) $row['file_name'],
            'mimeType' => (string) ($row['mime_type'] ?? 'application/pdf'),
            'byteSize' => (int) ($row['byte_size'] ?? 0),
            'storageProvider' => (string) ($row['storage_provider'] ?? 'hostinger'),
        ];
    }

    public static function download(string $id): void
    {
        Auth::requireAdmin();
        $id = trim($id);
        if ($id === '' || !preg_match('/^[a-zA-Z0-9._-]{1,200}$/', $id)) {
            throw new ApiError('invalid_id', 400, 'Identificador no válido');
        }
        Db::init();
        $pdo = Db::connect();
        $columns = Db::isPostgres()
            ? 'file_name, mime_type, storage_path, storage_provider, storage_object_path, legacy_storage_path'
            : 'file_name, mime_type, storage_path';
        $stmt = $pdo->prepare('SELECT ' . $columns . ' FROM intranet_attachments WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new ApiError('not_found', 404, 'Adjunto no encontrado');
        }
        $name = (string) $row['file_name'];
        $mime = (string) ($row['mime_type'] ?? 'application/pdf');
        $bytes = null;
        if (
            (string) ($row['storage_provider'] ?? 'hostinger') === 'supabase'
            && !empty($row['storage_object_path'])
            && SupabaseStorage::configured()
        ) {
            try {
                [$bytes, $storedMime] = SupabaseStorage::get((string) $row['storage_object_path']);
                if ($mime === '' || $mime === 'application/octet-stream') {
                    $mime = $storedMime;
                }
            } catch (Throwable $e) {
                error_log('[attachments] Storage fallback: ' . $e->getMessage());
            }
        }
        if ($bytes === null) {
            $legacy = (string) ($row['legacy_storage_path'] ?? $row['storage_path']);
            $full = self::absolutePath($legacy);
            if ($full === '' || !is_file($full)) {
                throw new ApiError('missing_file', 404, 'Fichero no encontrado en Storage ni en el servidor');
            }
            $bytes = (string) file_get_contents($full);
        }

        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) strlen($bytes));
        $safe = preg_replace('/[^a-zA-Z0-9._ -]/', '_', basename($name));
        header('Content-Disposition: inline; filename="' . $safe . '"');
        header('Cache-Control: private, max-age=0, must-revalidate');
        echo $bytes;
        exit;
    }

    private static function storageDir(): string
    {
        return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR
            . 'intranet_uploads';
    }

    private static function absolutePath(string $storagePath): string
    {
        $storagePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $storagePath);
        if (str_contains($storagePath, '..')) {
            return '';
        }
        $dataPrefix = 'data' . DIRECTORY_SEPARATOR;
        if (str_starts_with($storagePath, $dataPrefix)) {
            return dirname(__DIR__) . DIRECTORY_SEPARATOR . $storagePath;
        }
        return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . $storagePath;
    }
}
