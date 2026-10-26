<?php
declare(strict_types=1);

/**
 * Login con Google (Hostinger). POST { "credential": "<id_token>" }
 */
ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

error_reporting(E_ALL);
ini_set('display_errors', '0');

if (!function_exists('google_login_json')) {
    function google_login_json(int $status, array $payload): void
    {
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

register_shutdown_function(static function (): void {
    $err = error_get_last();
    if ($err === null) {
        return;
    }
    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];
    if (!in_array($err['type'], $fatalTypes, true)) {
        return;
    }
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    echo json_encode(
        [
            'error' => 'fatal',
            'message' => $err['message'] ?? 'fatal',
            'file' => isset($err['file']) ? basename((string) $err['file']) : null,
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
});

/**
 * @return array<string, mixed>
 */
function google_login_verify_token(string $idToken): array
{
    require_once __DIR__ . '/Env.php';
    require_once __DIR__ . '/Http.php';

    Env::load();
    $token = trim($idToken);
    if ($token === '') {
        throw new ApiError('missing_google_token', 400, 'Token de Google obligatorio');
    }
    $clientId = Env::get('GOOGLE_OAUTH_CLIENT_ID', '');
    if ($clientId === '') {
        throw new ApiError(
            'google_not_configured',
            503,
            'Inicio con Google no configurado (GOOGLE_OAUTH_CLIENT_ID).'
        );
    }

    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($token);
    $raw = false;

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        if ($ch !== false) {
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_FOLLOWLOCATION => true,
            ]);
            $raw = curl_exec($ch);
            curl_close($ch);
        }
    }

    if ($raw === false || $raw === '') {
        $ctx = stream_context_create([
            'http' => ['timeout' => 15, 'ignore_errors' => true],
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
    }

    if ($raw === false || $raw === '') {
        throw new ApiError('google_unreachable', 503, 'No se pudo verificar el token con Google.');
    }

    /** @var mixed $data */
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new ApiError('invalid_google_token', 401, 'Respuesta de Google inválida.');
    }
    if (isset($data['error_description']) || isset($data['error'])) {
        throw new ApiError('invalid_google_token', 401, 'Token de Google no válido o caducado.');
    }

    $aud = (string) ($data['aud'] ?? $data['azp'] ?? '');
    if ($aud !== $clientId) {
        throw new ApiError('invalid_google_token', 401, 'Token de Google no válido para esta app.');
    }

    $verified = $data['email_verified'] ?? false;
    if ($verified !== true && $verified !== 'true' && $verified !== '1') {
        throw new ApiError('google_email_unverified', 403, 'El correo de Google no está verificado.');
    }

    $email = trim((string) ($data['email'] ?? ''));
    if ($email === '') {
        throw new ApiError('invalid_google_token', 401, 'Google no devolvió un correo.');
    }

    return $data;
}

try {
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method === 'GET') {
        google_login_json(200, ['ok' => true, 'endpoint' => 'google-login', 'time' => gmdate('c')]);
    }
    if ($method !== 'POST') {
        google_login_json(405, ['error' => 'method_not_allowed', 'message' => 'Usa POST']);
    }

    $raw = file_get_contents('php://input');
    $body = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
    if (!is_array($body)) {
        google_login_json(400, ['error' => 'invalid_json', 'message' => 'JSON inválido']);
    }

    $credential = trim((string) ($body['credential'] ?? ''));
    if ($credential === '') {
        google_login_json(400, [
            'error' => 'missing_google_token',
            'message' => 'Token de Google obligatorio',
        ]);
    }

    $info = google_login_verify_token($credential);
    $email = strtolower(trim((string) ($info['email'] ?? '')));

    require_once __DIR__ . '/Db.php';
    Db::init();
    $pdo = Db::connect();
    $stmt = $pdo->prepare(
        'SELECT id, username, email, display_name, password_hash, role, property_id
         FROM users WHERE lower(email) = ?'
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        google_login_json(403, [
            'error' => 'google_not_registered',
            'message' => 'Esta cuenta de Google no está registrada en la intranet.',
        ]);
    }

    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $issuedAt = Db::utcNow();
    $pdo->prepare(
        'INSERT INTO sessions (token, user_id, created_at, expires_at, revoked_at)
         VALUES (?, ?, ?, NULL, NULL)'
    )->execute([$token, $row['id'], $issuedAt]);
    $pdo->prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
        ->execute([$issuedAt, $issuedAt, $row['id']]);

    $role = (string) ($row['role'] ?? 'user');
    $emailOut = $row['email'] !== null && $row['email'] !== '' ? (string) $row['email'] : '';

    google_login_json(200, [
        'authenticated' => true,
        'token' => $token,
        'user' => [
            'id' => (string) $row['id'],
            'name' => (string) $row['display_name'],
            'email' => $emailOut,
            'username' => (string) $row['username'],
            'role' => in_array($role, ['admin', 'superadmin', 'user'], true) ? $role : 'user',
            'propertyId' => $row['property_id'] !== null ? (string) $row['property_id'] : null,
        ],
        'issuedAt' => $issuedAt,
        'expiresAt' => null,
    ]);
} catch (ApiError $e) {
    google_login_json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    google_login_json(500, [
        'error' => 'server_error',
        'message' => $e->getMessage() !== '' ? $e->getMessage() : 'Error interno de autenticación',
    ]);
}
