<?php
declare(strict_types=1);
/**
 * Prueba rápida: https://burguardreams.com/TEST-API.php
 * Si ves JSON, PHP funciona. Si ves la web, este archivo no se subió a public_html.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$apiDir = __DIR__ . DIRECTORY_SEPARATOR . 'api';
$dbPath = __DIR__ . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'burguar.db';

echo json_encode([
    'ok' => true,
    'message' => 'PHP funciona en Hostinger',
    'php' => PHP_VERSION,
    'api_folder' => is_dir($apiDir),
    'login_php' => is_file($apiDir . DIRECTORY_SEPARATOR . 'auth' . DIRECTORY_SEPARATOR . 'login.php'),
    'db' => is_file($dbPath),
    'pdo_sqlite' => in_array('sqlite', PDO::getAvailableDrivers(), true),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
