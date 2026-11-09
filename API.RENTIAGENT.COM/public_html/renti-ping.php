<?php
declare(strict_types=1);

/**
 * Diagnóstico Renti (sin secretos). Ábrelo tras subir archivos a Hostinger.
 * GET /api/renti-ping.php
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$root = __DIR__;
$result = [
    'ok' => true,
    'time' => gmdate('c'),
    'files' => [
        'BurguarAssistant.php' => is_file($root . '/BurguarAssistant.php'),
        'BurguarAssistantDbContext.php' => is_file($root . '/BurguarAssistantDbContext.php'),
        'BurguarCatalog.php' => is_file($root . '/BurguarCatalog.php'),
        'intranet/assistant.php' => is_file($root . '/intranet/assistant.php'),
        'intranet/assistant-database.php' => is_file($root . '/intranet/assistant-database.php'),
    ],
    'steps' => [],
];

try {
    require_once $root . '/Env.php';
    require_once $root . '/Http.php';
    Env::load();
    $result['steps']['env'] = 'ok';
    $result['gemini_in_env'] = Env::get('GEMINI_API_KEY', '') !== '';
    $result['groq_in_env'] = Env::get('GROQ_API_KEY', '') !== '';
    $result['assistant_provider'] = Env::get('ASSISTANT_PROVIDER', 'auto');
    $result['gemini_model'] = Env::get('GEMINI_MODEL', 'gemini-3.8-flash');
    $result['gemini_model_effective'] = 'gemini-3.8-flash';
    $deprecated = ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-2.0-flash-lite', 'gemini-3-flash-preview'];
    if (!in_array(trim($result['gemini_model']), $deprecated, true)) {
        $result['gemini_model_effective'] = trim($result['gemini_model']) ?: 'gemini-3.8-flash';
    }
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['steps']['env'] = $e->getMessage();
}

try {
    require_once $root . '/Db.php';
    require_once $root . '/Passwords.php';
    require_once $root . '/BurguarAuth.php';
    Auth::getSession(null);
    $result['steps']['auth_no_token'] = 'unexpected_ok';
} catch (ApiError $e) {
    $result['steps']['auth_no_token'] = $e->errorCode . ' (' . $e->status . ')';
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['steps']['auth_no_token'] = get_class($e) . ': ' . $e->getMessage();
}

try {
    require_once $root . '/BurguarCatalog.php';
    require_once $root . '/BurguarAssistantDbContext.php';
    $result['steps']['assistant_db_context_class'] = class_exists('AssistantDbContext', false) ? 'ok' : 'missing';
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['steps']['assistant_db_context_class'] = get_class($e) . ': ' . $e->getMessage();
}

try {
    require_once $root . '/BurguarAssistant.php';
    $result['steps']['intranet_assistant_class'] = class_exists('IntranetAssistant', false) ? 'ok' : 'missing';
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['steps']['intranet_assistant_class'] = get_class($e) . ': ' . $e->getMessage();
}

$indexPath = $root . '/index.php';
$indexBody = is_file($indexPath) ? (string) file_get_contents($indexPath) : '';
$result['index_has_lazy_assistant'] = str_contains($indexBody, 'burguar_load_assistant_modules');

if (isset($_GET['gemini_probe']) && (string) $_GET['gemini_probe'] === '1') {
    $key = Env::get('GEMINI_API_KEY', '');
    if ($key === '') {
        $result['gemini_probe'] = 'sin_clave';
    } elseif (!function_exists('curl_init')) {
        $result['gemini_probe'] = 'sin_curl';
    } else {
        require_once $root . '/BurguarAssistant.php';
        $model = 'gemini-3.8-flash';
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($model)
            . ':generateContent';
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'x-goog-api-key: ' . $key,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'contents' => [['role' => 'user', 'parts' => [['text' => 'Responde solo: ok']]]],
            ], JSON_UNESCAPED_UNICODE),
        ]);
        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        }
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        $result['gemini_probe'] = $body === false
            ? ['ok' => false, 'curl' => $err]
            : ['ok' => $code >= 200 && $code < 300, 'http' => $code, 'bytes' => strlen((string) $body)];
    }
}

if (isset($_GET['groq_probe']) && (string) $_GET['groq_probe'] === '1') {
    $key = Env::get('GROQ_API_KEY', '');
    if ($key === '') {
        $result['groq_probe'] = 'sin_clave';
    } elseif (!function_exists('curl_init')) {
        $result['groq_probe'] = 'sin_curl';
    } else {
        $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 15,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $key,
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'model' => Env::get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
                'messages' => [['role' => 'user', 'content' => 'Responde solo: ok']],
                'max_tokens' => 8,
            ], JSON_UNESCAPED_UNICODE),
        ]);
        $body = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        $result['groq_probe'] = $body === false
            ? ['ok' => false, 'curl' => $err]
            : ['ok' => $code >= 200 && $code < 300, 'http' => $code, 'bytes' => strlen((string) $body)];
    }
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
