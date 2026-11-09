<?php
declare(strict_types=1);

/**
 * Renti — POST /api/intranet/assistant.php
 */
header('X-Content-Type-Options: nosniff');

try {
    require_once dirname(__DIR__) . '/Env.php';
    require_once dirname(__DIR__) . '/Http.php';
    require_once dirname(__DIR__) . '/Db.php';
    require_once dirname(__DIR__) . '/Passwords.php';
    require_once dirname(__DIR__) . '/BurguarAuth.php';
    require_once dirname(__DIR__) . '/BurguarCatalog.php';
    require_once __DIR__ . '/_assistant_bootstrap.php';

    Env::load();

    if (Http::method() === 'OPTIONS') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
        http_response_code(204);
        exit;
    }

    if (Http::method() !== 'POST') {
        Http::json(405, ['error' => 'method_not_allowed', 'message' => 'Usa POST']);
        exit;
    }

    burguar_assistant_require_files();
    require_once dirname(__DIR__) . '/BurguarAssistantDbContext.php';
    require_once dirname(__DIR__) . '/BurguarAssistant.php';

    Http::json(200, IntranetAssistant::chat(Http::readJsonBody()));
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    burguar_assistant_json_error($e, '[api/intranet/assistant]');
}
