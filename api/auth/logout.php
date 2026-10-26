<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

try {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($auth === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $k => $v) {
            if (strcasecmp((string) $k, 'Authorization') === 0) {
                $auth = (string) $v;
                break;
            }
        }
    }
    $token = null;
    if (stripos($auth, 'Bearer ') === 0) {
        $token = trim(substr($auth, 7));
    }

    if ($token) {
        require_once dirname(__DIR__) . '/Env.php';
        require_once dirname(__DIR__) . '/Db.php';
        Env::load();
        Db::init();
        $pdo = Db::connect();
        $pdo->prepare('UPDATE sessions SET revoked_at = ? WHERE token = ? AND revoked_at IS NULL')
            ->execute([gmdate('Y-m-d\TH:i:s\Z'), $token]);
    }
    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    echo json_encode(['ok' => true]);
}
