<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';

final class Mail
{
    public static function sendWelcome(
        string $toEmail,
        string $tenantName,
        string $username,
        string $password,
        ?string $apartmentLabel = null
    ): void {
        $host = Env::get('SMTP_HOST', 'smtp.hostinger.com');
        $port = (int) Env::get('SMTP_PORT', '465');
        $user = Env::get('SMTP_USER');
        $smtpPassword = Env::get('SMTP_PASSWORD');
        $fromAddr = Env::get('SMTP_FROM') ?: $user;
        $fromName = Env::get('SMTP_FROM_NAME', 'Burguar Dreams');
        $loginUrl = Env::get('INTRANET_LOGIN_URL', 'https://burguardreams.com/intranet/login');

        if ($user === '' || $smtpPassword === '' || $fromAddr === '') {
            throw new ApiError(
                'mail_error',
                502,
                'Falta configuración SMTP. Revisa SMTP_USER / SMTP_PASSWORD en el archivo .env'
            );
        }

        $apartmentLine = $apartmentLabel ? "Inmueble: {$apartmentLabel}\n" : '';
        $textBody =
            "Hola {$tenantName},\n\n" .
            "Te damos la bienvenida a la intranet de Burguar Dreams.\n" .
            "Ya puedes acceder con estas credenciales:\n\n" .
            "Usuario: {$username}\n" .
            "Contraseña: {$password}\n" .
            $apartmentLine .
            "\nAcceso: {$loginUrl}\n\n" .
            "Te recomendamos cambiar la contraseña tras el primer acceso " .
            "cuando esa opción esté disponible.\n\n" .
            "Un saludo,\nBurguar Dreams\n";

        $apartmentHtml = $apartmentLabel
            ? "<li><strong>Inmueble:</strong> " . htmlspecialchars($apartmentLabel, ENT_QUOTES, 'UTF-8') . "</li>"
            : '';
        $htmlBody =
            '<html><body style="font-family: Georgia, \'Times New Roman\', serif; color: #1c1c1c; line-height: 1.5;">' .
            '<p>Hola ' . htmlspecialchars($tenantName, ENT_QUOTES, 'UTF-8') . ',</p>' .
            '<p>Te damos la bienvenida a la intranet de <strong>Burguar Dreams</strong>.</p>' .
            '<p>Ya puedes acceder con estas credenciales:</p><ul>' .
            '<li><strong>Usuario:</strong> ' . htmlspecialchars($username, ENT_QUOTES, 'UTF-8') . '</li>' .
            '<li><strong>Contraseña:</strong> ' . htmlspecialchars($password, ENT_QUOTES, 'UTF-8') . '</li>' .
            $apartmentHtml .
            '</ul><p><a href="' . htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8') . '">Entrar en la intranet</a></p>' .
            '<p>Un saludo,<br/>Burguar Dreams</p></body></html>';

        $boundary = 'b_' . bin2hex(random_bytes(8));
        $subject = 'Bienvenida a la intranet Burguar Dreams';
        $headers =
            'From: ' . self::encodeAddress($fromName, $fromAddr) . "\r\n" .
            'MIME-Version: 1.0' . "\r\n" .
            'Content-Type: multipart/alternative; boundary="' . $boundary . '"' . "\r\n";

        $body =
            '--' . $boundary . "\r\n" .
            'Content-Type: text/plain; charset=UTF-8' . "\r\n\r\n" .
            $textBody . "\r\n" .
            '--' . $boundary . "\r\n" .
            'Content-Type: text/html; charset=UTF-8' . "\r\n\r\n" .
            $htmlBody . "\r\n" .
            '--' . $boundary . "--\r\n";

        try {
            self::smtpSend($host, $port, $user, $smtpPassword, $fromAddr, $toEmail, $subject, $headers, $body);
        } catch (Throwable $e) {
            throw new ApiError('mail_error', 502, 'No se pudo enviar el correo: ' . $e->getMessage());
        }
    }

    private static function encodeAddress(string $name, string $email): string
    {
        return sprintf('"%s" <%s>', addcslashes($name, '"\\'), $email);
    }

    private static function smtpSend(
        string $host,
        int $port,
        string $user,
        string $password,
        string $from,
        string $to,
        string $subject,
        string $headers,
        string $body
    ): void {
        $remote = ($port === 465 ? 'ssl://' : '') . $host . ':' . $port;
        $fp = @stream_socket_client($remote, $errno, $errstr, 30, STREAM_CLIENT_CONNECT);
        if (!$fp) {
            throw new RuntimeException("SMTP connect failed: {$errstr}");
        }
        stream_set_timeout($fp, 30);
        self::smtpExpect($fp, 220);
        self::smtpCmd($fp, 'EHLO burguardreams.com', 250);
        if ($port === 587) {
            self::smtpCmd($fp, 'STARTTLS', 220);
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('STARTTLS falló');
            }
            self::smtpCmd($fp, 'EHLO burguardreams.com', 250);
        }
        self::smtpCmd($fp, 'AUTH LOGIN', 334);
        self::smtpCmd($fp, base64_encode($user), 334);
        self::smtpCmd($fp, base64_encode($password), 235);
        self::smtpCmd($fp, 'MAIL FROM:<' . $from . '>', 250);
        self::smtpCmd($fp, 'RCPT TO:<' . $to . '>', 250);
        self::smtpCmd($fp, 'DATA', 354);
        $message =
            'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=' . "\r\n" .
            'To: <' . $to . '>' . "\r\n" .
            $headers . "\r\n" .
            $body . "\r\n.";
        fwrite($fp, $message . "\r\n");
        self::smtpExpect($fp, 250);
        self::smtpCmd($fp, 'QUIT', 221);
        fclose($fp);
    }

    /** @param resource $fp */
    private static function smtpCmd($fp, string $cmd, int $expect): void
    {
        fwrite($fp, $cmd . "\r\n");
        self::smtpExpect($fp, $expect);
    }

    /** @param resource $fp */
    private static function smtpExpect($fp, int $code): void
    {
        $line = '';
        while (($chunk = fgets($fp, 512)) !== false) {
            $line = $chunk;
            if (isset($chunk[3]) && $chunk[3] === ' ') {
                break;
            }
        }
        if ((int) substr($line, 0, 3) !== $code) {
            throw new RuntimeException('SMTP unexpected: ' . trim($line));
        }
    }
}
