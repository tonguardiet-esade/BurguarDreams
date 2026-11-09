<?php
header('Content-Type: application/json');
echo json_encode([
  'pdo_drivers' => PDO::getAvailableDrivers(),
  'pgsql_loaded' => extension_loaded('pgsql'),
  'pdo_pgsql_loaded' => extension_loaded('pdo_pgsql'),
]);