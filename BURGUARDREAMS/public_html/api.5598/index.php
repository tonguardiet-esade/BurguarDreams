<?php
declare(strict_types=1);

/**
 * Front controller API para Hostinger (PHP + SQLite).
 * Rutas: /api/auth/*, /api/users/*, /api/utilities/*
 */

header('X-Content-Type-Options: nosniff');

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/BurguarUsers.php';
require_once __DIR__ . '/BurguarUtilities.php';
require_once __DIR__ . '/UtilityLedger.php';
require_once __DIR__ . '/UtilityProvisions.php';
require_once __DIR__ . '/BurguarContracts.php';
require_once __DIR__ . '/GoogleOAuth.php';
require_once __DIR__ . '/BurguarAssistant.php';


Env::load();

$method = Http::method();
$path = Http::path();

if ($method === 'OPTIONS' && str_starts_with($path, '/api')) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}

try {
    if ($method === 'GET' && ($path === '/api/health' || $path === '/api/health.php')) {
        Db::init();
        Http::json(200, [
            'ok' => true,
            'service' => 'burguar-api',
            'runtime' => 'php',
            'db' => is_file(Db::path()),
        ]);
        exit;
    }

    if ($method === 'POST' && ($path === '/api/auth/login' || $path === '/api/login')) {
        $body = Http::readJsonBody();
        Http::json(200, Auth::login(
            (string) ($body['username'] ?? ''),
            (string) ($body['password'] ?? '')
        ));
        exit;
    }

    if ($method === 'POST' && $path === '/api/auth/logout') {
        Auth::logout(Http::bearerToken());
        Http::json(200, ['ok' => true]);
        exit;
    }

    if ($method === 'GET' && $path === '/api/auth/session') {
        Http::json(200, Auth::getSession(Http::bearerToken()));
        exit;
    }

    if ($method === 'GET' && $path === '/api/users/tenants') {
        Http::json(200, Users::listTenants());
        exit;
    }

    if ($method === 'POST' && $path === '/api/users/notify-welcome') {
        Http::json(200, Users::notifyWelcome(Http::readJsonBody()));
        exit;
    }

    if (
        $method === 'POST'
        && ($path === '/api/auth/google'
            || $path === '/api/auth/google/login'
            || $path === '/api/google-login'
            || $path === '/api/google-login.php')
    ) {
        require __DIR__ . '/google-login.php';
    }

    if ($method === 'POST' && $path === '/api/utilities/invoice') {
        Http::json(200, Utilities::invoice(Http::readJsonBody()));
        exit;
    }

    if ($method === 'GET' && ($path === '/api/utilities/provisions' || $path === '/api/utilities/provisions.php')) {
        Http::json(200, UtilityProvisions::listAll());
        exit;
    }

    if ($method === 'POST' && ($path === '/api/utilities/provisions' || $path === '/api/utilities/provisions.php')) {
        Http::json(200, UtilityProvisions::save(Http::readJsonBody()));
        exit;
    }

    if ($method === 'GET' && $path === '/api/utilities/ledger') {
        $propertyId = trim((string) ($_GET['propertyId'] ?? ''));
        Http::json(200, UtilityLedger::get($propertyId));
        exit;
    }

    if ($method === 'POST' && $path === '/api/utilities/ledger') {
        Http::json(200, UtilityLedger::save(Http::readJsonBody()));
        exit;
    }

    if ($method === 'POST' && $path === '/api/intranet/assistant') {
        Http::json(200, IntranetAssistant::chat(Http::readJsonBody()));
        exit;
    }

    if ($method === 'GET' && ($path === '/api/contracts' || $path === '/api/listings/contracts')) {
        Http::json(200, Contracts::listAll());
        exit;
    }

    if ($method === 'POST' && ($path === '/api/contracts' || $path === '/api/listings/contracts')) {
        Http::json(200, Contracts::save(Http::readJsonBody()));
        exit;
    }

    if (str_starts_with($path, '/api')) {
        Http::json(404, ['error' => 'not_found', 'message' => 'Ruta API no encontrada']);
        exit;
    }

    Http::json(404, ['error' => 'not_found', 'message' => 'Not Found']);
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->code, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('[api] ' . $e->getMessage());
    Http::json(500, ['error' => 'server_error', 'message' => 'Error interno del servidor']);
}
