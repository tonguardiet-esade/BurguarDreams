<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/BurguarCatalog.php';
require_once __DIR__ . '/BurguarCloudMigration.php';

Env::load();
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

$result = null;
$error = null;
if (Http::method() === 'POST') {
    try {
        $session = Auth::login(
            (string) ($_POST['username'] ?? ''),
            (string) ($_POST['password'] ?? '')
        );
        if (!in_array((string) ($session['user']['role'] ?? ''), ['admin', 'superadmin'], true)) {
            throw new RuntimeException('El usuario no es administrador');
        }
        $result = CloudMigration::importCatalog($session);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}
?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Normalizar catálogo en Supabase</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.5}
    label{display:block;margin:14px 0 4px}input{width:100%;padding:10px;box-sizing:border-box}
    button{margin-top:18px;padding:10px 16px}.ok{background:#e8f5e9;padding:14px}.error{background:#ffebee;padding:14px}
    code,pre{background:#f3f3f3;padding:3px 5px}pre{overflow:auto;padding:12px}
  </style>
</head>
<body>
  <h1>Normalizar catálogo en Supabase</h1>
  <p>Copia los snapshots actuales a tablas normalizadas sin borrar los originales.</p>
  <?php if ($error !== null): ?>
    <div class="error"><strong>Error:</strong> <?= h($error) ?></div>
  <?php endif; ?>
  <?php if ($result !== null): ?>
    <div class="ok">
      <strong>Importación terminada.</strong>
      <pre><?= h(json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) ?></pre>
      <p>Borra ahora <code>catalog-import.php</code> del servidor.</p>
    </div>
  <?php else: ?>
    <form method="post" autocomplete="off">
      <label for="username">Usuario administrador</label>
      <input id="username" name="username" required>
      <label for="password">Contraseña</label>
      <input id="password" name="password" type="password" required>
      <button type="submit">Migrar catálogo</button>
    </form>
  <?php endif; ?>
</body>
</html>
