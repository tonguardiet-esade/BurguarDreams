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

    require_once __DIR__ . '/Db.php';
    Db::init();
    $result['checks']['database'] = Db::isPostgres() ? 'postgresql' : 'sqlite-local';
    $result['checks']['uses_supabase'] = Db::isPostgres();
    $result['checks']['pdo_pgsql'] = in_array('pgsql', PDO::getAvailableDrivers(), true);
    $result['checks']['schema_migrations'] = Db::appliedMigrations();
    require_once __DIR__ . '/SupabaseStorage.php';
    $result['checks']['supabase_storage_configured'] = SupabaseStorage::configured();
    $result['checks']['supabase_storage_bucket'] = SupabaseStorage::bucket();
    if (!Db::isPostgres()) {
        $result['checks']['database_warning'] =
            'Falta DATABASE_URL en public_html/.env — los contratos se guardan en SQLite local, no en Supabase.';
    }
    $result['checks']['assistant_php'] = is_file(__DIR__ . '/BurguarAssistant.php');
    $result['checks']['assistant_db_context_php'] = is_file(__DIR__ . '/BurguarAssistantDbContext.php');
    $result['checks']['assistant_endpoint_php'] = is_file(__DIR__ . '/intranet/assistant.php');
    $indexPath = __DIR__ . '/index.php';
    $indexBody = is_file($indexPath) ? (string) file_get_contents($indexPath) : '';
    $result['checks']['index_has_assistant_route'] = str_contains($indexBody, 'intranet/assistant');
    $result['checks']['index_lazy_assistant'] = str_contains($indexBody, 'burguar_load_assistant_modules');
    $result['checks']['renti_ping_php'] = is_file(__DIR__ . '/renti-ping.php');
    $result['checks']['assistant_bootstrap_php'] = is_file(__DIR__ . '/intranet/_assistant_bootstrap.php');

    $result['checks']['files'] = [
        'google_config_php' => is_file(__DIR__ . '/google-config.php'),
        'GoogleOAuth_php' => is_file(__DIR__ . '/GoogleOAuth.php'),
        'intranet_js' => (bool) glob(dirname(__DIR__) . '/intranet/assets/index-*.js'),
    ];
} catch (Throwable $e) {
    error_log('[intranet-check] ' . $e->getMessage());
    $result['ok'] = false;
    $result['error'] = 'No se pudo completar la comprobación';
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
