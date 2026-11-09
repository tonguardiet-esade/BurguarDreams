<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/Env.php';
require_once dirname(__DIR__) . '/Http.php';
require_once dirname(__DIR__) . '/Db.php';
require_once dirname(__DIR__) . '/BurguarAuth.php';
require_once dirname(__DIR__) . '/BurguarSupport.php';

Env::load();

try {
    $session = Auth::requireAdmin();
    $method = Http::method();
    $ticketId = isset($_GET['id']) ? trim((string) $_GET['id']) : '';

    if ($method === 'GET') {
        if ($ticketId !== '') {
            Http::json(200, SupportTickets::getById($ticketId, $session));
            exit;
        }
        Http::json(200, SupportTickets::listAll($session));
        exit;
    }

    if ($method === 'POST') {
        Http::json(200, SupportTickets::create(Http::readJsonBody(), $session));
        exit;
    }

    if ($method === 'PATCH') {
        Http::json(200, SupportTickets::updateStatus(Http::readJsonBody(), $session));
        exit;
    }

    if ($method === 'DELETE') {
        if ($ticketId === '') {
            $body = Http::readJsonBody();
            $ticketId = trim((string) ($body['id'] ?? ''));
        }
        Http::json(200, SupportTickets::delete($ticketId, $session));
        exit;
    }

    Http::json(405, ['error' => 'method_not_allowed', 'message' => 'Método no permitido']);
} catch (ApiError $e) {
    Http::json($e->status, ['error' => $e->errorCode, 'message' => $e->getMessage()]);
} catch (Throwable $e) {
    error_log('[support/tickets] ' . $e->getMessage());
    Http::json(500, ['error' => 'server_error', 'message' => $e->getMessage()]);
}
