<?php
declare(strict_types=1);

/**
 * Contraseñas para Hostinger.
 * - Nuevo formato: bcrypt (password_hash) — rápido y estable en LiteSpeed.
 * - Legado: pbkdf2_sha256$iterations$salt$digest (solo verify / migración).
 */
final class Passwords
{
    private const PBKDF2_ALGORITHM = 'pbkdf2_sha256';

    public static function hash(string $password): string
    {
        if ($password === '') {
            throw new InvalidArgumentException('password vacío');
        }
        $hash = password_hash($password, PASSWORD_BCRYPT);
        if (!is_string($hash) || $hash === '') {
            throw new RuntimeException('No se pudo generar hash de contraseña');
        }
        return $hash;
    }

    public static function verify(string $password, string $stored): bool
    {
        if ($password === '' || $stored === '') {
            return false;
        }

        // bcrypt / argon (password_hash)
        if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2a$') || str_starts_with($stored, '$2b$') || str_starts_with($stored, '$argon')) {
            return password_verify($password, $stored);
        }

        // Legado PBKDF2 (puede ser lento; evitar >120k en Hostinger)
        $parts = explode('$', $stored, 4);
        if (count($parts) !== 4) {
            return false;
        }
        [$algorithm, $iterationsRaw, $salt, $expectedHex] = $parts;
        if ($algorithm !== self::PBKDF2_ALGORITHM) {
            return false;
        }
        $iterations = (int) $iterationsRaw;
        if ($iterations < 1) {
            return false;
        }
        // Protección Hostinger: hashes absurdamente caros no se verifican aquí
        if ($iterations > 120000) {
            return false;
        }
        $digest = hash_pbkdf2('sha256', $password, $salt, $iterations, 32, true);
        return hash_equals($expectedHex, bin2hex($digest));
    }

    public static function needsRehash(string $stored): bool
    {
        if ($stored === '') {
            return true;
        }
        if (str_starts_with($stored, self::PBKDF2_ALGORITHM . '$')) {
            return true;
        }
        if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2a$') || str_starts_with($stored, '$2b$')) {
            return password_needs_rehash($stored, PASSWORD_BCRYPT);
        }
        return true;
    }
}
