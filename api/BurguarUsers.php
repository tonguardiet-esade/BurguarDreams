<?php
declare(strict_types=1);

require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/Mail.php';

final class Users
{
    public static function listTenants(): array
    {
        Auth::requireAdmin();
        Db::init();
        $pdo = Db::connect();
        $rows = $pdo->query(
            Db::adaptSql(
                "SELECT id, username, display_name, email, property_id, last_login_at
             FROM users WHERE role = 'user'
             ORDER BY display_name COLLATE NOCASE"
            )
        )->fetchAll();
        $tenants = [];
        foreach ($rows as $row) {
            $tenants[] = [
                'userId' => $row['id'],
                'username' => $row['username'],
                'displayName' => $row['display_name'],
                'email' => $row['email'] !== null && $row['email'] !== ''
                    ? (string) $row['email']
                    : '',
                'propertyId' => $row['property_id'],
                'lastLoginAt' => $row['last_login_at'],
            ];
        }
        return ['tenants' => $tenants];
    }

    public static function notifyWelcome(array $body): array
    {
        Auth::requireAdmin();
        $toEmail = trim((string) ($body['toEmail'] ?? $body['email'] ?? ''));
        $tenantName = trim((string) ($body['tenantName'] ?? $body['name'] ?? ''));
        $username = trim((string) ($body['username'] ?? ''));
        $apartment = trim((string) ($body['apartmentLabel'] ?? $body['apartment'] ?? ''));
        $apartment = $apartment !== '' ? $apartment : null;

        if ($toEmail === '' || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
            throw new ApiError('invalid_email', 400, 'Indica un correo válido');
        }
        if ($tenantName === '' || $username === '') {
            throw new ApiError('invalid_payload', 400, 'Faltan datos del inquilino');
        }

        $password = Env::get('TENANT_DEFAULT_PASSWORD', '1234') ?: '1234';
        Mail::sendWelcome($toEmail, $tenantName, $username, $password, $apartment);

        Db::init();
        $pdo = Db::connect();
        $userId = trim((string) ($body['userId'] ?? ''));
        $now = Db::utcNow();
        if ($userId !== '') {
            $upd = $pdo->prepare(
                'UPDATE users SET email = ?, updated_at = ? WHERE id = ? AND role = ?'
            );
            $upd->execute([$toEmail, $now, $userId, 'user']);
            if ($upd->rowCount() === 0) {
                $upd = $pdo->prepare(
                    'UPDATE users SET email = ?, updated_at = ? WHERE username = ? COLLATE NOCASE AND role = ?'
                );
                $upd->execute([$toEmail, $now, $username, 'user']);
            }
        } else {
            $upd = $pdo->prepare(
                'UPDATE users SET email = ?, updated_at = ? WHERE username = ? COLLATE NOCASE AND role = ?'
            );
            $upd->execute([$toEmail, $now, $username, 'user']);
        }

        return [
            'ok' => true,
            'message' => 'Correo de bienvenida enviado',
            'toEmail' => $toEmail,
            'username' => $username,
        ];
    }
}
