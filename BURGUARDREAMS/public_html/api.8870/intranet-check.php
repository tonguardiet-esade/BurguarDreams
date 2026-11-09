<?php
declare(strict_types=1);

/**
 * Comprobación rápida tras subir a Hostinger (ábrelo en el navegador).
 * No muestra contraseñas ni secretos.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$result = [
    'ok' => true,
    'time' => gmdate('c'),
    'checks' => [],
];

try {
    require_once __DIR__ . '/Env.php';
    Env::load();
    $clientId = Env::get('GOOGLE_OAUTH_CLIENT_ID', '');
    $result['checks']['google_oauth_in_env'] = $clientId !== '';
    $result['checks']['google_button_will_show'] = $clientId !== '';
    if ($clientId !== '') {
        $result['checks']['google_client_id_prefix'] = substr($clientId, 0, 12) . '…';
    }

    require_once __DIR__ . '/Db.php';
    Db::init();
    $pdo = Db::connect();
    $row = $pdo->query(
        "SELECT username, email FROM users WHERE id = 'user-burguar-001' LIMIT 1"
    )->fetch(PDO::FETCH_ASSOC);
    $result['checks']['burguardreams_username'] = $row['username'] ?? null;
    $result['checks']['burguardreams_email_in_db'] = $row['email'] ?? null;
    $result['checks']['burguardreams_email_is_gmail'] =
        isset($row['email']) && strcasecmp((string) $row['email'], 'burguardreams@gmail.com') === 0;
    $result['checks']['database'] = Db::label();
    $result['checks']['uses_supabase'] = Db::isPostgres();
    $result['checks']['pdo_pgsql'] = in_array('pgsql', PDO::getAvailableDrivers(), true);
    if (!Db::isPostgres()) {
        $result['checks']['database_warning'] =
            'Falta DATABASE_URL en public_html/.env — los contratos se guardan en SQLite local, no en Supabase.';
    }
    try {
        $rent = $pdo->query(
            "SELECT monthly_rent FROM rental_contracts WHERE id = 'c1' LIMIT 1"
        )->fetchColumn();
        $result['checks']['contract_c1_monthly_rent'] = $rent === false ? null : $rent;
    } catch (Throwable $ignored) {
        $result['checks']['contract_c1_monthly_rent'] = null;
    }
    $result['checks']['gemini_in_env'] = Env::get('GEMINI_API_KEY', '') !== '';

    $result['checks']['files'] = [
        'google_config_php' => is_file(__DIR__ . '/google-config.php'),
        'GoogleOAuth_php' => is_file(__DIR__ . '/GoogleOAuth.php'),
        'intranet_js' => (bool) glob(dirname(__DIR__) . '/intranet/assets/index-*.js'),
    ];
} catch (Throwable $e) {
    $result['ok'] = false;
    $result['error'] = $e->getMessage();
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
