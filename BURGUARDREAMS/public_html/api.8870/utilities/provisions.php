<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

try {
    require_once dirname(__DIR__) . '/Env.php';
    require_once dirname(__DIR__) . '/Http.php';
    require_once dirname(__DIR__) . '/Db.php';
    require_once dirname(__DIR__) . '/Passwords.php';
    require_once dirname(__DIR__) . '/BurguarAuth.php';
    require_once dirname(__DIR__) . '/UtilityProvisions.php';

    Env::load();
    $method = Http::method();

    if ($method === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
        http_response_code(204);
        exit;
    }

    if ($method === 'GET') {
        Http::json(200, UtilityProvisions::listAll());
        exit;
    }

    if ($method === 'POST') {
        Http::json(200, UtilityProvisions::save(Http::readJsonBody()));
        exit;
    }

    Http::json(405, ['error' => 'method_not_allowed', 'message' => 'Método no permitido']);
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('[api/utilities/provisions] ' . $e->getMessage());
    Http::json(500, [
        'error' => 'server_error',
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
    ]);
}
