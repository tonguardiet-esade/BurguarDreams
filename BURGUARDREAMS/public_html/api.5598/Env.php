<?php
declare(strict_types=1);

/**
 * Carga variables desde .env en la raíz de public_html.
 */
final class Env
{
    private static bool $loaded = false;

    public static function load(?string $path = null): void
    {
        if (self::$loaded) {
            return;
        }
        $envFile = $path ?? dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
        if (!is_file($envFile)) {
            self::$loaded = true;
            return;
        }
        $lines = file($envFile, FILE_IGNORE_NEW_LINES);
        if ($lines === false) {
            self::$loaded = true;
            return;
        }
        foreach ($lines as $raw) {
            $line = trim($raw);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $key = ltrim(trim($key), "\xEF\xBB\xBF");
            $value = trim($value);
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }
            if ($key !== '') {
                $_ENV[$key] = $value;
                putenv($key . '=' . $value);
            }
        }
        self::$loaded = true;
    }

    public static function get(string $key, string $default = ''): string
    {
        self::load();
        $value = $_ENV[$key] ?? getenv($key);
        if ($value === false || $value === null) {
            return $default;
        }
        return trim((string) $value);
    }
}
