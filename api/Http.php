<?php
declare(strict_types=1);

final class Http
{
    public static function json(int $status, array $payload): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiError('invalid_json', 400, 'JSON inválido');
        }
        return $data;
    }

    public static function bearerToken(): ?string
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';
        if ($auth === '' && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $key => $value) {
                if (strcasecmp((string) $key, 'Authorization') === 0) {
                    $auth = (string) $value;
                    break;
                }
            }
        }
        if (stripos($auth, 'Bearer ') === 0) {
            $token = trim(substr($auth, 7));
            return $token !== '' ? $token : null;
        }
        // Fallback Hostinger/LiteSpeed (Authorization a veces se pierde)
        $alt = $_SERVER['HTTP_X_AUTH_TOKEN']
            ?? $_SERVER['REDIRECT_HTTP_X_AUTH_TOKEN']
            ?? '';
        $alt = trim((string) $alt);
        return $alt !== '' ? $alt : null;
    }

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public static function path(): string
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            return '/';
        }
        // Hostinger/LiteSpeed: /api/utilities/ledger.php → /api/utilities/ledger
        if (str_ends_with($path, '.php')) {
            $path = substr($path, 0, -4);
        }
        $path = rtrim($path, '/');
        return $path !== '' ? $path : '/';
    }
}

final class ApiError extends Exception
{
    /** Código de error de la API (no usar $code: colisiona con Exception en PHP 8+). */
    public string $errorCode;
    public int $status;

    public function __construct(string $errorCode, int $status = 400, string $message = '')
    {
        parent::__construct($message !== '' ? $message : $errorCode, $status);
        $this->errorCode = $errorCode;
        $this->status = $status;
    }
}
