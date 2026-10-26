<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';

final class GoogleOAuth
{
    public static function clientId(): string
    {
        Env::load();
        return Env::get('GOOGLE_OAUTH_CLIENT_ID', '');
    }

    /** @return array{enabled: bool, clientId: string} */
    public static function configPayload(): array
    {
        $clientId = self::clientId();
        return [
            'enabled' => $clientId !== '',
            'clientId' => $clientId,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function verifyIdToken(string $idToken): array
    {
        $token = trim($idToken);
        if ($token === '') {
            throw new ApiError('missing_google_token', 400, 'Token de Google obligatorio');
        }
        $clientId = self::clientId();
        if ($clientId === '') {
            throw new ApiError(
                'google_not_configured',
                503,
                'Inicio con Google no configurado (GOOGLE_OAUTH_CLIENT_ID).'
            );
        }

        $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . rawurlencode($token);
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 12,
                'ignore_errors' => true,
            ],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        if (($raw === false || $raw === '') && function_exists('curl_init')) {
            $ch = curl_init($url);
            if ($ch !== false) {
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => 12,
                    CURLOPT_FOLLOWLOCATION => true,
                ]);
                $raw = curl_exec($ch);
                curl_close($ch);
            }
        }
        if ($raw === false || $raw === '') {
            throw new ApiError('google_unreachable', 503, 'No se pudo verificar el token con Google.');
        }
        /** @var mixed $data */
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiError('invalid_google_token', 401, 'Respuesta de Google inválida.');
        }
        if (isset($data['error_description']) || isset($data['error'])) {
            throw new ApiError('invalid_google_token', 401, 'Token de Google no válido o caducado.');
        }

        $aud = (string) ($data['aud'] ?? $data['azp'] ?? '');
        if ($aud !== $clientId) {
            throw new ApiError('invalid_google_token', 401, 'Token de Google no válido para esta app.');
        }

        $verified = $data['email_verified'] ?? false;
        if ($verified !== true && $verified !== 'true' && $verified !== '1') {
            throw new ApiError('google_email_unverified', 403, 'El correo de Google no está verificado.');
        }

        $email = trim((string) ($data['email'] ?? ''));
        if ($email === '') {
            throw new ApiError('invalid_google_token', 401, 'Google no devolvió un correo.');
        }

        return $data;
    }
}
