<?php
declare(strict_types=1);

/** Hostinger: delegar en index.php / implementación PHP futura. Local usa Python :8010. */
header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'error' => 'not_implemented',
    'message' => 'Soporte en PHP pendiente; usa el entorno local :8010 o la próxima actualización.',
], JSON_UNESCAPED_UNICODE);
