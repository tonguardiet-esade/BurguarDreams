<?php
declare(strict_types=1);

require_once dirname(__DIR__, 2) . '/Env.php';
require_once dirname(__DIR__, 2) . '/Http.php';
require_once dirname(__DIR__, 2) . '/Db.php';
require_once dirname(__DIR__, 2) . '/BurguarAuth.php';
require_once dirname(__DIR__, 2) . '/BurguarSupport.php';

Env::load();

try {
    $session = Auth::requireAdmin();
    if (Http::method() !== 'POST') {
        Http::json(405, ['error' => 'method_not_allowed', 'message' => 'Método no permitido']);
        exit;
    }
    Http::json(200, SupportTickets::addComment(Http::readJsonBody(), $session));
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('[support/comment] ' . $e->getMessage());
    Http::json(500, ['error' => 'server_error', 'message' => $e->getMessage()]);
}
