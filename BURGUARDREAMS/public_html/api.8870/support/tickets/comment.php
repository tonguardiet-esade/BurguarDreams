<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(501);
echo json_encode([
    'error' => 'not_implemented',
    'message' => 'Comentarios de soporte en PHP pendiente.',
], JSON_UNESCAPED_UNICODE);
