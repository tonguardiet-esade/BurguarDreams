<?php
declare(strict_types=1);

/**
 * CORS for intranet on app.rentiagent.com calling api.rentiagent.com.
 */
function api_send_cors(): void
{
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    $allowed = [
        'https://app.rentiagent.com',
        'https://burguardreams.com',
        'https://www.burguardreams.com',
    ];
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Auth-Token');
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
