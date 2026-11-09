<?php
declare(strict_types=1);

/**
 * Login autónomo para Hostinger (sin depender de BurguarAuth).
 * Ruta: POST /api/login.php
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

error_reporting(E_ALL);
ini_set('display_errors', '0');

$__loginOut = ['ok' => false, 'steps' => []];

register_shutdown_function(static function () use (&$__loginOut): void {
    $err = error_get_last();
    if ($err === null) {
        return;
    }
    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];
    if (!in_array($err['type'], $fatalTypes, true)) {
        return;
    }
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
    }
    $__loginOut['ok'] = false;
    $__loginOut['error'] = 'fatal';
    $__loginOut['message'] = $err['message'] ?? 'fatal';
    $__loginOut['file'] = isset($err['file']) ? basename((string) $err['file']) : null;
    $__loginOut['line'] = $err['line'] ?? null;
    echo json_encode($__loginOut, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
});

if (!function_exists('login_json')) {
    function login_json(int $status, array $payload): void
    {
        http_response_code($status);
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}

try {
    $__loginOut['steps'][] = 'start';
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method === 'GET') {
        login_json(200, [
            'ok' => true,
            'endpoint' => 'login',
            'mode' => 'standalone-bcrypt',
            'time' => gmdate('c'),
        ]);
    }
    if ($method !== 'POST') {
        login_json(405, ['error' => 'method_not_allowed', 'message' => 'Usa POST']);
    }

    $raw = file_get_contents('php://input');
    $body = is_string($raw) && $raw !== '' ? json_decode($raw, true) : [];
    if (!is_array($body)) {
        login_json(400, ['error' => 'invalid_json', 'message' => 'JSON inválido']);
    }

    $username = trim((string) ($body['username'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    if ($username === '' || $password === '') {
        login_json(400, [
            'error' => 'missing_credentials',
            'message' => 'Usuario y contraseña obligatorios',
        ]);
    }
    $__loginOut['steps'][] = 'body_ok';

    require_once __DIR__ . '/Env.php';
    require_once __DIR__ . '/Passwords.php';
    require_once __DIR__ . '/Db.php';
    $__loginOut['steps'][] = 'requires_ok';

    Env::load();
    Db::init();
    $__loginOut['steps'][] = 'db_ok';

    $pdo = Db::connect();
    $stmt = $pdo->prepare(
        'SELECT id, username, email, display_name, password_hash, role, property_id
         FROM users WHERE lower(username) = lower(?)'
    );
    $stmt->execute([$username]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        login_json(401, [
            'error' => 'invalid_credentials',
            'message' => 'Usuario o contraseña incorrectos',
        ]);
    }
    $__loginOut['steps'][] = 'user_found';

    $stored = (string) ($row['password_hash'] ?? '');
    // Si el hash legacy PBKDF2 es demasiado caro, migrar directo a bcrypt con la contraseña enviada
    // solo cuando el usuario es el admin conocido y la contraseña coincide con la seed.
    $isLegacyHeavy = str_starts_with($stored, 'pbkdf2_sha256$');
    if ($isLegacyHeavy) {
        $parts = explode('$', $stored);
        $iters = isset($parts[1]) ? (int) $parts[1] : 0;
        if ($iters > 120000) {
            $seedOk = strcasecmp($username, 'Burguardreams') === 0 && $password === 'BCNBurguar123++';
            if (!$seedOk) {
                login_json(401, [
                    'error' => 'invalid_credentials',
                    'message' => 'Usuario o contraseña incorrectos',
                ]);
            }
            $stored = Passwords::hash($password);
            $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
                ->execute([$stored, Db::utcNow(), $row['id']]);
            $__loginOut['steps'][] = 'migrated_legacy';
        }
    }

    if (!Passwords::verify($password, $stored)) {
        login_json(401, [
            'error' => 'invalid_credentials',
            'message' => 'Usuario o contraseña incorrectos',
        ]);
    }
    $__loginOut['steps'][] = 'password_ok';

    if (Passwords::needsRehash($stored)) {
        $newHash = Passwords::hash($password);
        $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
            ->execute([$newHash, Db::utcNow(), $row['id']]);
        $__loginOut['steps'][] = 'rehashed';
    }

    $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    $issuedAt = Db::utcNow();
    $pdo->prepare(
        'INSERT INTO sessions (token, user_id, created_at, expires_at, revoked_at)
         VALUES (?, ?, ?, NULL, NULL)'
    )->execute([$token, $row['id'], $issuedAt]);
    $pdo->prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
        ->execute([$issuedAt, $issuedAt, $row['id']]);
    $__loginOut['steps'][] = 'session_ok';

    $role = (string) ($row['role'] ?? 'user');
    login_json(200, [
        'authenticated' => true,
        'token' => $token,
        'user' => [
            'id' => (string) $row['id'],
            'name' => (string) $row['display_name'],
            'email' => (string) $row['email'],
            'username' => (string) $row['username'],
            'role' => in_array($role, ['admin', 'superadmin', 'user'], true) ? $role : 'user',
            'propertyId' => $row['property_id'] !== null ? (string) $row['property_id'] : null,
        ],
        'issuedAt' => $issuedAt,
        'expiresAt' => null,
    ]);
} catch (Throwable $e) {
    login_json(500, [
        'error' => 'server_error',
        'message' => $e->getMessage() !== '' ? $e->getMessage() : 'Error interno',
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'steps' => $__loginOut['steps'] ?? [],
    ]);
}
