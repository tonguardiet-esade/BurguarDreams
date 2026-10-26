<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/Env.php';

Env::load();
$clientId = Env::get('GOOGLE_OAUTH_CLIENT_ID', '');

echo json_encode(
    [
        'enabled' => $clientId !== '',
        'clientId' => $clientId,
    ],
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
);
