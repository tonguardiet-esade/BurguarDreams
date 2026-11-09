<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';

/**
 * Cliente mínimo de Supabase Storage por REST, sin dependencias Composer.
 * La clave secreta solo se usa en el servidor.
 */
final class SupabaseStorage
{
    private const DEFAULT_BUCKET = 'intranet-files';

    public static function configured(): bool
    {
        return self::baseUrl() !== '' && self::secretKey() !== '';
    }

    public static function bucket(): string
    {
        $bucket = Env::get('SUPABASE_STORAGE_BUCKET', self::DEFAULT_BUCKET);
        return $bucket !== '' ? $bucket : self::DEFAULT_BUCKET;
    }

    public static function ensureBucket(): void
    {
        self::requireConfigured();
        [$status, $body] = self::request(
            'POST',
            '/storage/v1/bucket',
            json_encode([
                'id' => self::bucket(),
                'name' => self::bucket(),
                'public' => false,
                'file_size_limit' => 50 * 1024 * 1024,
            ], JSON_UNESCAPED_SLASHES),
            ['Content-Type: application/json']
        );
        if ($status >= 200 && $status < 300) {
            return;
        }
        $decoded = json_decode($body, true);
        $message = strtolower((string) ($decoded['message'] ?? $decoded['error'] ?? $body));
        if ($status === 409 || str_contains($message, 'already exists') || str_contains($message, 'duplicate')) {
            return;
        }
        throw new RuntimeException('No se pudo crear/verificar el bucket de Storage: HTTP ' . $status);
    }

    public static function put(string $objectPath, string $localPath, string $mimeType): void
    {
        self::requireConfigured();
        if (!is_file($localPath)) {
            throw new RuntimeException('No existe el fichero temporal para Storage');
        }
        $bytes = file_get_contents($localPath);
        if ($bytes === false) {
            throw new RuntimeException('No se pudo leer el fichero temporal');
        }
        [$status, $body] = self::request(
            'POST',
            '/storage/v1/object/' . rawurlencode(self::bucket()) . '/' . self::encodePath($objectPath),
            $bytes,
            [
                'Content-Type: ' . ($mimeType !== '' ? $mimeType : 'application/octet-stream'),
                'x-upsert: true',
                'Cache-Control: 3600',
            ]
        );
        if ($status < 200 || $status >= 300) {
            throw new RuntimeException('Storage rechazó la subida (HTTP ' . $status . '): ' . substr($body, 0, 300));
        }
    }

    /** @return array{0:string,1:string} bytes, content-type */
    public static function get(string $objectPath): array
    {
        self::requireConfigured();
        [$status, $body, $headers] = self::request(
            'GET',
            '/storage/v1/object/' . rawurlencode(self::bucket()) . '/' . self::encodePath($objectPath),
            null,
            [],
            true
        );
        if ($status < 200 || $status >= 300) {
            throw new ApiError('storage_missing', 404, 'Fichero no encontrado en Supabase Storage');
        }
        return [$body, (string) ($headers['content-type'] ?? 'application/octet-stream')];
    }

    public static function delete(string $objectPath): void
    {
        self::requireConfigured();
        [$status, $body] = self::request(
            'DELETE',
            '/storage/v1/object/' . rawurlencode(self::bucket()),
            json_encode(['prefixes' => [$objectPath]], JSON_UNESCAPED_SLASHES),
            ['Content-Type: application/json']
        );
        if ($status < 200 || $status >= 300) {
            throw new RuntimeException('Storage rechazó el borrado (HTTP ' . $status . '): ' . substr($body, 0, 200));
        }
    }

    private static function baseUrl(): string
    {
        return rtrim(Env::get('SUPABASE_URL'), '/');
    }

    private static function secretKey(): string
    {
        $key = Env::get('SUPABASE_SECRET_KEY');
        if ($key === '') {
            $key = Env::get('SUPABASE_SERVICE_ROLE_KEY');
        }
        return $key;
    }

    private static function requireConfigured(): void
    {
        if (!self::configured()) {
            throw new RuntimeException('Faltan SUPABASE_URL y SUPABASE_SECRET_KEY en .env');
        }
    }

    private static function encodePath(string $path): string
    {
        $parts = array_filter(explode('/', str_replace('\\', '/', $path)), static fn ($p) => $p !== '');
        return implode('/', array_map('rawurlencode', $parts));
    }

    /**
     * @return array{0:int,1:string,2?:array<string,string>}
     */
    private static function request(
        string $method,
        string $path,
        ?string $body = null,
        array $extraHeaders = [],
        bool $captureHeaders = false
    ): array {
        $ch = curl_init(self::baseUrl() . $path);
        if ($ch === false) {
            throw new RuntimeException('No se pudo iniciar cURL');
        }
        $headers = array_merge([
            'Authorization: Bearer ' . self::secretKey(),
            'apikey: ' . self::secretKey(),
        ], $extraHeaders);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 90,
        ]);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        }
        $responseHeaders = [];
        if ($captureHeaders) {
            curl_setopt(
                $ch,
                CURLOPT_HEADERFUNCTION,
                static function ($curl, string $line) use (&$responseHeaders): int {
                    $parts = explode(':', $line, 2);
                    if (count($parts) === 2) {
                        $responseHeaders[strtolower(trim($parts[0]))] = trim($parts[1]);
                    }
                    return strlen($line);
                }
            );
        }
        $response = curl_exec($ch);
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new RuntimeException('Error de conexión con Supabase Storage: ' . $error);
        }
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        return $captureHeaders
            ? [$status, (string) $response, $responseHeaders]
            : [$status, (string) $response];
    }
}
