<?php
declare(strict_types=1);

/**
 * Entrada común para endpoints físicos (/api/auth/login/, etc.).
 * Hostinger/LiteSpeed sirve DirectoryIndex aunque el rewrite SPA falle.
 */
require __DIR__ . '/index.php';
