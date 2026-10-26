<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    require_once __DIR__ . '/Db.php';
    require_once __DIR__ . '/Passwords.php';
    Db::init();
    echo json_encode([
        'ok' => true,
        'service' => 'burguar-api',
        'runtime' => 'php',
        'db' => is_file(Db::path()),
        'dbPath' => basename(dirname(Db::path())) . '/' . basename(Db::path()),
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
    ], JSON_UNESCAPED_UNICODE);
}
