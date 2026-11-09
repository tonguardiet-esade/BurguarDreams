<?php
declare(strict_types=1);

require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Http.php';

final class Utilities
{
    private const PROPERTY_IDS = [
        'prop-urgell',
        'prop-can-bruixa',
        'prop-valencia',
        'prop-gran-via',
    ];

    /** @var array<string, array{0:string,1:string}> */
    private const TENANCIES = [
        'prop-urgell' => ['2026-07-01', '2027-05-31'],
        'prop-can-bruixa' => ['2026-07-13', '2027-06-12'],
        'prop-valencia' => ['2026-09-16', '2027-08-15'],
        'prop-gran-via' => ['2026-10-03', '2027-09-02'],
    ];

    public static function syncDates(): array
    {
        Auth::requireAdmin();
        $result = self::postToSheets(['action' => 'syncTenancyDates']);
        return [
            'ok' => true,
            'message' => 'Fechas de entrada/salida sincronizadas en Google Sheets',
            'sheets' => $result,
        ];
    }

    public static function invoice(array $body): array
    {
        Auth::requireAdmin();
        $propertyId = trim((string) ($body['propertyId'] ?? ''));
        $month = trim((string) ($body['month'] ?? ''));
        $waterRaw = trim((string) ($body['water'] ?? ''));
        $electricityRaw = trim((string) ($body['electricity'] ?? ''));

        if (!in_array($propertyId, self::PROPERTY_IDS, true)) {
            throw new ApiError('invalid_property', 400, 'Apartamento no válido');
        }
        if (!isset(self::TENANCIES[$propertyId])) {
            throw new ApiError('invalid_tenancy', 400, 'Sin periodo de alquiler');
        }
        $parts = explode('-', $month);
        if (count($parts) !== 2) {
            throw new ApiError('invalid_month', 400, 'Selecciona un mes (YYYY-MM)');
        }
        $year = (int) $parts[0];
        $monthN = (int) $parts[1];
        if ($year < 2000 || $monthN < 1 || $monthN > 12) {
            throw new ApiError('invalid_month', 400, 'Mes inválido (YYYY-MM)');
        }

        $waterFull = self::parseAmount($waterRaw);
        $electricityFull = self::parseAmount($electricityRaw);
        if ($waterFull === null && $electricityFull === null) {
            throw new ApiError('missing_amounts', 400, 'Indica al menos gasto de agua o gasto de luz');
        }

        [$startS, $endS] = self::TENANCIES[$propertyId];
        $start = new DateTimeImmutable($startS);
        $end = new DateTimeImmutable($endS);
        [$daysInMonth, $occupied, $fullMonth] = self::occupancyForMonth($start, $end, $year, $monthN);
        if ($occupied <= 0) {
            throw new ApiError('outside_tenancy', 400, 'Ese mes está fuera del periodo de alquiler del inmueble');
        }

        $waterPay = $waterFull === null ? null : self::prorate($waterFull, $daysInMonth, $occupied);
        $electricityPay = $electricityFull === null
            ? null
            : self::prorate($electricityFull, $daysInMonth, $occupied);

        $result = self::postToSheets([
            'action' => 'invoice',
            'propertyId' => $propertyId,
            'month' => $month,
            'water' => $waterFull === null ? '' : number_format($waterFull, 2, '.', ''),
            'electricity' => $electricityFull === null ? '' : number_format($electricityFull, 2, '.', ''),
            'daysInMonth' => $daysInMonth,
            'occupiedDays' => $occupied,
        ]);

        $msg = $fullMonth
            ? 'Factura contabilizada (mes completo).'
            : "Factura prorrateada: {$occupied}/{$daysInMonth} días (importe/días×días ocupados).";

        return [
            'ok' => true,
            'message' => $msg,
            'propertyId' => $propertyId,
            'month' => $month,
            'daysInMonth' => $daysInMonth,
            'occupiedDays' => $occupied,
            'fullMonth' => $fullMonth,
            'waterFull' => $waterFull,
            'electricityFull' => $electricityFull,
            'water' => $waterPay,
            'electricity' => $electricityPay,
            'sheets' => $result,
        ];
    }

    private static function parseAmount(string $raw): ?float
    {
        $text = str_replace(['€', ' '], '', trim($raw));
        if ($text === '') {
            return null;
        }
        if (str_contains($text, ',') && str_contains($text, '.')) {
            $text = str_replace('.', '', $text);
            $text = str_replace(',', '.', $text);
        } elseif (str_contains($text, ',')) {
            $text = str_replace(',', '.', $text);
        }
        if (!is_numeric($text)) {
            throw new ApiError('invalid_amount', 400, 'Importe no válido: ' . $raw);
        }
        return (float) $text;
    }

    /** @return array{0:int,1:int,2:bool} */
    private static function occupancyForMonth(
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        int $year,
        int $month
    ): array {
        $daysInMonth = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month)))
            ->format('t');
        $monthStart = new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
        $monthEnd = new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $month, $daysInMonth));
        $occStart = $start > $monthStart ? $start : $monthStart;
        $occEnd = $end < $monthEnd ? $end : $monthEnd;
        if ($occStart > $occEnd) {
            return [$daysInMonth, 0, false];
        }
        $occupied = (int) $occStart->diff($occEnd)->days + 1;
        return [$daysInMonth, $occupied, $occupied === $daysInMonth];
    }

    private static function prorate(float $amount, int $daysInMonth, int $occupiedDays): float
    {
        if ($daysInMonth <= 0 || $occupiedDays <= 0) {
            return 0.0;
        }
        return round($amount / $daysInMonth * $occupiedDays, 2);
    }

    /** @param array<string,mixed> $payload */
    private static function postToSheets(array $payload): array
    {
        $url = Env::get('GOOGLE_SHEETS_WEBHOOK_URL');
        if ($url === '') {
            throw new ApiError(
                'sheets_not_configured',
                503,
                'Falta GOOGLE_SHEETS_WEBHOOK_URL en .env (despliega el Apps Script del Sheet)'
            );
        }
        $secret = Env::get('GOOGLE_SHEETS_WEBHOOK_SECRET');
        $body = $payload;
        if ($secret !== '') {
            $body['secret'] = $secret;
        }
        $json = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        [$status, $raw] = self::httpPostJson($url, (string) $json);
        if ($raw === null) {
            throw new ApiError('sheets_unreachable', 502, 'No se pudo contactar con Google Sheets');
        }
        if ($status >= 400) {
            throw new ApiError('sheets_http_error', 502, 'Google Sheets respondió ' . $status . ': ' . substr($raw, 0, 200));
        }
        $result = json_decode($raw, true);
        if (!is_array($result)) {
            throw new ApiError('sheets_invalid_response', 502, 'Respuesta inválida del webhook de Google Sheets');
        }
        if (empty($result['ok'])) {
            $message = (string) ($result['message'] ?? $result['error'] ?? 'Error en Google Sheets');
            throw new ApiError('sheets_write_failed', 502, $message);
        }
        return $result;
    }

    /** @return array{0:int,1:?string} */
    private static function httpPostJson(string $url, string $json): array
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
                CURLOPT_POSTFIELDS => $json,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_FOLLOWLOCATION => true,
            ]);
            $raw = curl_exec($ch);
            $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $err = curl_error($ch);
            curl_close($ch);
            if ($raw === false) {
                return [0, null];
            }
            if ($err !== '' && $status === 0) {
                return [0, null];
            }
            return [$status, (string) $raw];
        }

        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\n",
                'content' => $json,
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        if ($raw === false) {
            return [0, null];
        }
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int) $m[1];
        }
        return [$status, $raw];
    }
}
