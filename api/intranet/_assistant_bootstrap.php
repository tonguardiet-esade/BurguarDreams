<?php
declare(strict_types=1);

function burguar_assistant_require_files(): void
{
    $root = dirname(__DIR__);
    $required = [
        'BurguarAssistantDbContext.php' => $root . '/BurguarAssistantDbContext.php',
        'BurguarAssistant.php' => $root . '/BurguarAssistant.php',
    ];
    $missing = [];
    foreach ($required as $label => $path) {
        if (!is_file($path)) {
            $missing[] = $label;
        }
    }
    if ($missing !== []) {
        throw new ApiError(
            'assistant_files_missing',
            503,
            'Faltan en public_html/api/: ' . implode(', ', $missing)
        );
    }
}

function burguar_assistant_json_error(Throwable $e, string $logPrefix): void
{
    error_log($logPrefix . ' ' . $e->getMessage());
    Http::json(500, [
        'error' => 'server_error',
        'message' => $e->getMessage(),
        'type' => get_class($e),
    ]);
}
