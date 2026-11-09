<?php
declare(strict_types=1);

require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/Passwords.php';
require_once __DIR__ . '/Http.php';

final class Auth
{
    /** Admin y superadmin comparten permisos de gestión. */
    public static function isStaffRole(string $role): bool
    {
        return $role === 'admin' || $role === 'superadmin';
    }

    public static function login(string $username, string $password): array
    {
        $username = trim($username);
        if ($username === '' || $password === '') {
            throw new ApiError('missing_credentials', 400, 'Usuario y contraseña obligatorios');
        }
        Db::init();
        $pdo = Db::connect();
        $stmt = $pdo->prepare(
            Db::adaptSql(
                'SELECT id, username, email, display_name, password_hash, role, property_id
             FROM users WHERE username = ? COLLATE NOCASE'
            )
        );
        $stmt->execute([$username]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new ApiError('invalid_credentials', 401, 'Usuario o contraseña incorrectos');
        }
        $stored = (string) $row['password_hash'];
        if (!Passwords::verify($password, $stored)) {
            throw new ApiError('invalid_credentials', 401, 'Usuario o contraseña incorrectos');
        }
        // Upgrade silencioso a bcrypt si el hash es legado o débil.
        if (Passwords::needsRehash($stored)) {
            $rehash = Passwords::hash($password);
            $fixHash = $pdo->prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?');
            $fixHash->execute([$rehash, Db::utcNow(), $row['id']]);
        }
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $issuedAt = Db::utcNow();
        $ins = $pdo->prepare(
            'INSERT INTO sessions (token, user_id, created_at, expires_at, revoked_at)
             VALUES (?, ?, ?, NULL, NULL)'
        );
        $ins->execute([$token, $row['id'], $issuedAt]);
        $upd = $pdo->prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?');
        $upd->execute([$issuedAt, $issuedAt, $row['id']]);
        return self::sessionPayload(self::userPayload($row), $token, $issuedAt, null);
    }

    public static function loginWithGoogle(string $idToken): array
    {
        require_once __DIR__ . '/GoogleOAuth.php';
        $info = GoogleOAuth::verifyIdToken($idToken);
        $email = strtolower(trim((string) ($info['email'] ?? '')));
        Db::init();
        $pdo = Db::connect();
        $stmt = $pdo->prepare(
            'SELECT id, username, email, display_name, password_hash, role, property_id
             FROM users WHERE lower(email) = ?'
        );
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        if (!$row) {
            throw new ApiError(
                'google_not_registered',
                403,
                'Esta cuenta de Google no está registrada en la intranet.'
            );
        }
        $token = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $issuedAt = Db::utcNow();
        $pdo->prepare(
            'INSERT INTO sessions (token, user_id, created_at, expires_at, revoked_at)
             VALUES (?, ?, ?, NULL, NULL)'
        )->execute([$token, $row['id'], $issuedAt]);
        $pdo->prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?')
            ->execute([$issuedAt, $issuedAt, $row['id']]);
        return self::sessionPayload(self::userPayload($row), $token, $issuedAt, null);
    }

    public static function logout(?string $token): void
    {
        if ($token === null || $token === '') {
            return;
        }
        Db::init();
        $pdo = Db::connect();
        $stmt = $pdo->prepare(
            'UPDATE sessions SET revoked_at = ? WHERE token = ? AND revoked_at IS NULL'
        );
        $stmt->execute([Db::utcNow(), $token]);
    }

    public static function getSession(?string $token): array
    {
        if ($token === null || $token === '') {
            throw new ApiError('missing_token', 401, 'Sesión no encontrada');
        }
        Db::init();
        $pdo = Db::connect();
        $stmt = $pdo->prepare(
            'SELECT s.token, s.created_at, s.expires_at, s.revoked_at,
                    u.id, u.username, u.email, u.display_name, u.role, u.property_id
             FROM sessions s
             JOIN users u ON u.id = s.user_id
             WHERE s.token = ?'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row || !empty($row['revoked_at'])) {
            throw new ApiError('invalid_token', 401, 'Sesión no válida');
        }
        if (!empty($row['expires_at']) && (string) $row['expires_at'] < Db::utcNow()) {
            throw new ApiError('expired_token', 401, 'Sesión caducada');
        }
        return self::sessionPayload(
            self::userPayload($row),
            (string) $row['token'],
            (string) $row['created_at'],
            $row['expires_at'] !== null ? (string) $row['expires_at'] : null
        );
    }

    public static function requireAuth(): array
    {
        return self::getSession(Http::bearerToken());
    }

    public static function requireAdmin(): array
    {
        $session = self::requireAuth();
        $role = $session['user']['role'] ?? '';
        if (!self::isStaffRole($role)) {
            throw new ApiError('forbidden', 403, 'Solo el administrador puede gestionar usuarios');
        }
        return $session;
    }

    /** Admin o inquilino del inmueble indicado (lectura del libro). */
    public static function requirePropertyAccess(string $propertyId): array
    {
        $session = self::requireAuth();
        $user = $session['user'] ?? [];
        $role = (string) ($user['role'] ?? '');
        if (self::isStaffRole($role)) {
            return $session;
        }
        $own = (string) ($user['propertyId'] ?? '');
        // Si el token no trae propertyId, leerlo de la BD.
        if ($own === '' && !empty($user['id'])) {
            Db::init();
            $stmt = Db::connect()->prepare('SELECT property_id FROM users WHERE id = ?');
            $stmt->execute([(string) $user['id']]);
            $row = $stmt->fetch();
            $own = $row && $row['property_id'] !== null ? (string) $row['property_id'] : '';
        }
        if ($own === '' || $own !== $propertyId) {
            throw new ApiError('forbidden', 403, 'No tienes acceso a este inmueble');
        }
        return $session;
    }

    /** @param array<string,mixed> $row */
    private static function userPayload(array $row): array
    {
        $role = (string) ($row['role'] ?? 'user');
        return [
            'id' => (string) $row['id'],
            'name' => (string) $row['display_name'],
            'email' => $row['email'] !== null && $row['email'] !== ''
                ? (string) $row['email']
                : '',
            'username' => (string) $row['username'],
            'role' => in_array($role, ['admin', 'superadmin', 'user'], true) ? $role : 'user',
            'propertyId' => $row['property_id'] !== null ? (string) $row['property_id'] : null,
        ];
    }

    /** @param array<string,mixed> $user */
    private static function sessionPayload(array $user, string $token, string $issuedAt, ?string $expiresAt): array
    {
        return [
            'authenticated' => true,
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'username' => $user['username'] ?? null,
                'role' => $user['role'],
                'propertyId' => $user['propertyId'] ?? null,
            ],
            'issuedAt' => $issuedAt,
            'expiresAt' => $expiresAt,
        ];
    }
}
