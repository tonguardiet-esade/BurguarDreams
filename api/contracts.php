<?php
declare(strict_types=1);

/**
 * Endpoint: /api/contracts.php
 * Clase en BurguarContracts.php (nunca Contracts.php: colisiona en Windows).
 */
header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/Passwords.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/BurguarContracts.php';

Env::load();

try {
    $method = Http::method();
    if ($method === 'GET') {
        Http::json(200, Contracts::listAll());
        exit;
    }
    if ($method === 'POST') {
        Http::json(200, Contracts::save(Http::readJsonBody()));
        exit;
    }
    Http::json(405, ['error' => 'method_not_allowed', 'message' => 'MÃ©todo no permitido']);
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    Http::json(500, [
        'error' => 'server_error',
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
    ]);
}
