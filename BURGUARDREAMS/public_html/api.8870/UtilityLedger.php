<?php
declare(strict_types=1);

require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/Http.php';
require_once __DIR__ . '/UtilityProvisions.php';

/**
 * Libro de suministros por finca.
 *
 * Las fechas de estancia (inicio/fin) definen qué meses aparecen.
 * Agua/luz: importe reguladora; Enter en fecha prorratea en la UI.
 */
final class UtilityLedger
{
    private const MONTH_ABBR = [
        1 => 'ene', 2 => 'feb', 3 => 'mar', 4 => 'abr', 5 => 'may', 6 => 'jun',
        7 => 'jul', 8 => 'ago', 9 => 'sep', 10 => 'oct', 11 => 'nov', 12 => 'dic',
    ];

    /** Metadatos por defecto (título, a compte). Las fechas se pueden sobrescribir en BD. */
    /** @var array<string, array{start:string,end:string,aCompte:float,title:string}> */
    private const TENANCIES = [
        'prop-urgell' => [
            'start' => '2026-07-01',
            'end' => '2027-05-31',
            'aCompte' => 140.0,
            'title' => 'Urgell (emma i Sara) (Llum i aigua)',
        ],
        'prop-can-bruixa' => [
            'start' => '2026-07-13',
            'end' => '2027-06-12',
            'aCompte' => 35.0,
            'title' => 'Can Bruixa (Solo agua)',
        ],
        'prop-valencia' => [
            'start' => '2026-09-16',
            'end' => '2027-08-15',
            'aCompte' => 100.0,
            'title' => 'València (Llum i aigua)',
        ],
        'prop-gran-via' => [
            'start' => '2026-10-03',
            'end' => '2027-09-02',
            'aCompte' => 100.0,
            'title' => 'Gran Via (Llum i aigua)',
        ],
    ];

    public static function ensureSchema(PDO $pdo): void
    {
        if (Db::isPostgres()) {
            return;
        }
        $pdo->exec(
            <<<'SQL'
CREATE TABLE IF NOT EXISTS utility_ledger (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  year_month TEXT NOT NULL,
  month_label TEXT NOT NULL,
  entry_date TEXT,
  water REAL,
  electricity REAL,
  wifi REAL,
  a_compte REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(property_id, year_month)
);
CREATE INDEX IF NOT EXISTS idx_utility_ledger_property ON utility_ledger(property_id, sort_order);
CREATE TABLE IF NOT EXISTS utility_tenancy (
  property_id TEXT PRIMARY KEY,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
SQL
        );
        // Migración suave: tablas antiguas sin columna wifi.
        $cols = $pdo->query('PRAGMA table_info(utility_ledger)')->fetchAll(PDO::FETCH_ASSOC);
        $names = array_map(static fn(array $c): string => (string) ($c['name'] ?? ''), $cols);
        if (!in_array('wifi', $names, true)) {
            $pdo->exec('ALTER TABLE utility_ledger ADD COLUMN wifi REAL');
        }
    }

    public static function get(string $propertyId): array
    {
        Auth::requirePropertyAccess($propertyId);
        if (!isset(self::TENANCIES[$propertyId])) {
            throw new ApiError('invalid_property', 400, 'Apartamento no válido');
        }

        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);
        self::seedIfEmpty($pdo, $propertyId);

        return self::buildResponse($pdo, $propertyId);
    }

    public static function save(array $body): array
    {
        Auth::requireAdmin();
        $propertyId = trim((string) ($body['propertyId'] ?? ''));
        if (!isset(self::TENANCIES[$propertyId])) {
            throw new ApiError('invalid_property', 400, 'Apartamento no válido');
        }
        $rowsIn = $body['rows'] ?? null;
        if (!is_array($rowsIn)) {
            throw new ApiError('invalid_payload', 400, 'Faltan filas del libro');
        }

        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);

        $defaults = self::TENANCIES[$propertyId];
        $tenancy = self::resolveTenancy($pdo, $propertyId);

        $startRaw = trim((string) ($body['tenancyStart'] ?? ''));
        $endRaw = trim((string) ($body['tenancyEnd'] ?? ''));
        if ($startRaw !== '' && $endRaw !== '') {
            $start = self::parseIsoDate($startRaw);
            $end = self::parseIsoDate($endRaw);
            if ($start > $end) {
                throw new ApiError('invalid_tenancy', 400, 'La fecha de inicio debe ser anterior a la de fin');
            }
            self::upsertTenancy($pdo, $propertyId, $start->format('Y-m-d'), $end->format('Y-m-d'));
            $tenancy['start'] = $start->format('Y-m-d');
            $tenancy['end'] = $end->format('Y-m-d');
        } else {
            $start = new DateTimeImmutable($tenancy['start']);
            $end = new DateTimeImmutable($tenancy['end']);
        }

        $now = Db::utcNow();
        $keepYm = [];

        $pdo->beginTransaction();
        try {
            $upd = $pdo->prepare(
                'UPDATE utility_ledger
                 SET month_label = ?, entry_date = ?, water = ?, electricity = ?, wifi = ?, a_compte = ?, sort_order = ?, updated_at = ?
                 WHERE property_id = ? AND year_month = ?'
            );
            $ins = $pdo->prepare(
                'INSERT INTO utility_ledger
                 (id, property_id, year_month, month_label, entry_date, water, electricity, wifi, a_compte, sort_order, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $exists = $pdo->prepare(
                'SELECT 1 FROM utility_ledger WHERE property_id = ? AND year_month = ?'
            );

            $order = 0;
            foreach ($rowsIn as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $ym = trim((string) ($row['yearMonth'] ?? ''));
                if ($ym === '' || !preg_match('/^\d{4}-\d{2}$/', $ym)) {
                    continue;
                }
                [$y, $m] = array_map('intval', explode('-', $ym));
                $info = self::occupancy($start, $end, $y, $m);
                $label = trim((string) ($row['monthLabel'] ?? ''));
                if ($label === '') {
                    $label = self::MONTH_ABBR[$m] ?? $ym;
                }

                $entryDate = trim((string) ($row['entryDate'] ?? ''));
                if ($entryDate === '') {
                    $entryDate = self::defaultDateLabel($start, $end, $y, $m, $info);
                }
                $entryDate = $entryDate !== '' ? $entryDate : null;

                $water = self::nullableFloat($row['water'] ?? null);
                $electricity = self::nullableFloat($row['electricity'] ?? null);
                $wifi = self::nullableFloat($row['wifi'] ?? null);
                $aCompte = array_key_exists('aCompte', $row)
                    ? self::nullableFloat($row['aCompte'])
                    : self::prorate(-$defaults['aCompte'], $info['daysInMonth'], $info['occupiedDays']);

                $exists->execute([$propertyId, $ym]);
                if ($exists->fetchColumn()) {
                    $upd->execute([
                        $label,
                        $entryDate,
                        $water,
                        $electricity,
                        $wifi,
                        $aCompte,
                        $order,
                        $now,
                        $propertyId,
                        $ym,
                    ]);
                } else {
                    $ins->execute([
                        'ul-' . $propertyId . '-' . $ym,
                        $propertyId,
                        $ym,
                        $label,
                        $entryDate,
                        $water,
                        $electricity,
                        $wifi,
                        $aCompte,
                        $order,
                        $now,
                    ]);
                }
                $keepYm[] = $ym;
                $order++;
            }

            if ($keepYm !== []) {
                $placeholders = implode(',', array_fill(0, count($keepYm), '?'));
                $del = $pdo->prepare(
                    "DELETE FROM utility_ledger WHERE property_id = ? AND year_month NOT IN ($placeholders)"
                );
                $del->execute(array_merge([$propertyId], $keepYm));
            } else {
                $del = $pdo->prepare('DELETE FROM utility_ledger WHERE property_id = ?');
                $del->execute([$propertyId]);
            }

            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        $payload = self::buildResponse($pdo, $propertyId);
        $payload['ok'] = true;
        $payload['message'] = 'Cambios guardados';
        return $payload;
    }

    /** a_pagar = importe_mes / días_mes × días_ocupados */
    public static function prorate(float $fullAmount, int $daysInMonth, int $occupiedDays): float
    {
        if ($daysInMonth <= 0 || $occupiedDays <= 0) {
            return 0.0;
        }
        if ($occupiedDays >= $daysInMonth) {
            return round($fullAmount, 2);
        }
        return round($fullAmount / $daysInMonth * $occupiedDays, 2);
    }

    /** @return array{start:string,end:string,aCompte:float,title:string} */
    private static function resolveTenancy(PDO $pdo, string $propertyId): array
    {
        $base = self::TENANCIES[$propertyId];
        $stmt = $pdo->prepare('SELECT start_date, end_date FROM utility_tenancy WHERE property_id = ?');
        $stmt->execute([$propertyId]);
        $row = $stmt->fetch();
        if ($row) {
            $base['start'] = (string) $row['start_date'];
            $base['end'] = (string) $row['end_date'];
        }
        // A compte mensual desde provisiones persistidas (no el valor hardcodeado).
        try {
            $fromProvision = UtilityProvisions::monthlyAmountFor($propertyId);
            if ($fromProvision !== null && $fromProvision >= 0) {
                $base['aCompte'] = $fromProvision;
            }
        } catch (Throwable $e) {
            // Si falla el schema de provisiones, se mantiene el default.
        }
        return $base;
    }

    private static function upsertTenancy(PDO $pdo, string $propertyId, string $start, string $end): void
    {
        $now = Db::utcNow();
        $stmt = $pdo->prepare(
            'INSERT INTO utility_tenancy (property_id, start_date, end_date, updated_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(property_id) DO UPDATE SET
               start_date = excluded.start_date,
               end_date = excluded.end_date,
               updated_at = excluded.updated_at'
        );
        $stmt->execute([$propertyId, $start, $end, $now]);
    }

    private static function parseIsoDate(string $raw): DateTimeImmutable
    {
        $text = trim($raw);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $text) !== 1) {
            throw new ApiError('invalid_date', 400, 'Fecha no válida (usa AAAA-MM-DD)');
        }
        $dt = DateTimeImmutable::createFromFormat('Y-m-d', $text);
        if (!$dt || $dt->format('Y-m-d') !== $text) {
            throw new ApiError('invalid_date', 400, 'Fecha no válida: ' . $text);
        }
        return $dt;
    }

    private static function seedIfEmpty(PDO $pdo, string $propertyId): void
    {
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM utility_ledger WHERE property_id = ?');
        $stmt->execute([$propertyId]);
        if ((int) $stmt->fetchColumn() > 0) {
            return;
        }

        $tenancy = self::resolveTenancy($pdo, $propertyId);
        $start = new DateTimeImmutable($tenancy['start']);
        $end = new DateTimeImmutable($tenancy['end']);
        self::upsertTenancy($pdo, $propertyId, $tenancy['start'], $tenancy['end']);

        $cursor = new DateTimeImmutable($start->format('Y-m-01'));
        $last = new DateTimeImmutable($end->format('Y-m-01'));
        $now = Db::utcNow();
        $order = 0;
        $ins = $pdo->prepare(
            'INSERT INTO utility_ledger
             (id, property_id, year_month, month_label, entry_date, water, electricity, wifi, a_compte, sort_order, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        while ($cursor <= $last) {
            $y = (int) $cursor->format('Y');
            $m = (int) $cursor->format('n');
            $ym = $cursor->format('Y-m');
            $label = self::MONTH_ABBR[$m];
            $info = self::occupancy($start, $end, $y, $m);
            $aCompte = self::prorate(-$tenancy['aCompte'], $info['daysInMonth'], $info['occupiedDays']);
            $entryDate = self::defaultDateLabel($start, $end, $y, $m, $info);

            $water = null;
            $electricity = null;
            $wifi = null;
            if ($propertyId === 'prop-urgell' && $ym === '2026-07') {
                $water = 100.0;
                $electricity = 50.0;
            }

            $ins->execute([
                'ul-' . $propertyId . '-' . $ym,
                $propertyId,
                $ym,
                $label,
                $entryDate !== '' ? $entryDate : null,
                $water,
                $electricity,
                $wifi,
                $aCompte,
                $order,
                $now,
            ]);
            $order++;
            $cursor = $cursor->modify('+1 month');
        }
    }

    /**
     * @param array{daysInMonth:int,occupiedDays:int,fullMonth:bool} $info
     */
    private static function defaultDateLabel(
        DateTimeImmutable $start,
        DateTimeImmutable $end,
        int $year,
        int $month,
        array $info
    ): string {
        if ($info['fullMonth'] || $info['occupiedDays'] <= 0) {
            return '';
        }
        $isStart = $year === (int) $start->format('Y') && $month === (int) $start->format('n');
        $isEnd = $year === (int) $end->format('Y') && $month === (int) $end->format('n');
        if ($isStart) {
            return $start->format('j/n/Y');
        }
        if ($isEnd) {
            return $end->format('j/n/Y');
        }
        return '';
    }

    private static function buildResponse(PDO $pdo, string $propertyId): array
    {
        $tenancy = self::resolveTenancy($pdo, $propertyId);
        $start = new DateTimeImmutable($tenancy['start']);
        $end = new DateTimeImmutable($tenancy['end']);
        $stmt = $pdo->prepare(
            'SELECT year_month, month_label, entry_date, water, electricity, wifi, a_compte, sort_order
             FROM utility_ledger
             WHERE property_id = ?
             ORDER BY sort_order ASC, year_month ASC'
        );
        $stmt->execute([$propertyId]);
        $raw = $stmt->fetchAll();

        $rows = [];
        $saldo = 0.0;
        $totWaterFull = 0.0;
        $totLightFull = 0.0;
        $totWifiFull = 0.0;
        $totWaterPay = 0.0;
        $totLightPay = 0.0;
        $totWifiPay = 0.0;
        $totACompte = 0.0;

        foreach ($raw as $row) {
            $ym = (string) $row['year_month'];
            [$y, $m] = array_map('intval', explode('-', $ym));
            $info = self::occupancy($start, $end, $y, $m);

            $water = $row['water'] !== null ? (float) $row['water'] : null;
            $light = $row['electricity'] !== null ? (float) $row['electricity'] : null;
            $wifi = array_key_exists('wifi', $row) && $row['wifi'] !== null ? (float) $row['wifi'] : null;
            $aCompte = $row['a_compte'] !== null ? (float) $row['a_compte'] : null;

            $saldo = round(
                $saldo + ($water ?? 0.0) + ($light ?? 0.0) + ($wifi ?? 0.0) + ($aCompte ?? 0.0),
                2
            );

            if ($water !== null) {
                $totWaterFull += $water;
                $totWaterPay += $water;
            }
            if ($light !== null) {
                $totLightFull += $light;
                $totLightPay += $light;
            }
            if ($wifi !== null) {
                $totWifiFull += $wifi;
                $totWifiPay += $wifi;
            }
            if ($aCompte !== null) {
                $totACompte += $aCompte;
            }

            $entryDate = $row['entry_date'] !== null ? (string) $row['entry_date'] : '';
            if ($entryDate === '') {
                $entryDate = self::defaultDateLabel($start, $end, $y, $m, $info);
            }

            $rows[] = [
                'yearMonth' => $ym,
                'monthLabel' => (string) $row['month_label'],
                'entryDate' => $entryDate,
                'water' => $water,
                'electricity' => $light,
                'wifi' => $wifi,
                'waterPay' => $water,
                'electricityPay' => $light,
                'wifiPay' => $wifi,
                'aCompte' => $aCompte,
                'saldo' => $saldo,
                'daysInMonth' => $info['daysInMonth'],
                'occupiedDays' => $info['occupiedDays'],
                'fullMonth' => $info['fullMonth'],
            ];
        }

        return [
            'propertyId' => $propertyId,
            'title' => $tenancy['title'],
            'aCompteFull' => $tenancy['aCompte'],
            'tenancyStart' => $tenancy['start'],
            'tenancyEnd' => $tenancy['end'],
            'proration' => 'Enter en fecha: a_pagar = factura / dias_mes * dias_ocupados (celdas agua/luz/wifi)',
            'rows' => $rows,
            'totals' => [
                'water' => round($totWaterFull, 2),
                'electricity' => round($totLightFull, 2),
                'wifi' => round($totWifiFull, 2),
                'waterPay' => round($totWaterPay, 2),
                'electricityPay' => round($totLightPay, 2),
                'wifiPay' => round($totWifiPay, 2),
                'aCompte' => round($totACompte, 2),
                'saldo' => $saldo,
            ],
        ];
    }

    /** @return array{daysInMonth:int,occupiedDays:int,fullMonth:bool} */
    private static function occupancy(DateTimeImmutable $start, DateTimeImmutable $end, int $year, int $month): array
    {
        $daysInMonth = (int) (new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month)))->format('t');
        $monthStart = new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
        $monthEnd = new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $month, $daysInMonth));
        $occStart = $start > $monthStart ? $start : $monthStart;
        $occEnd = $end < $monthEnd ? $end : $monthEnd;
        if ($occStart > $occEnd) {
            return ['daysInMonth' => $daysInMonth, 'occupiedDays' => 0, 'fullMonth' => false];
        }
        $occupied = (int) $occStart->diff($occEnd)->days + 1;
        return [
            'daysInMonth' => $daysInMonth,
            'occupiedDays' => $occupied,
            'fullMonth' => $occupied === $daysInMonth,
        ];
    }

    private static function nullableFloat(mixed $raw): ?float
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        if (is_int($raw) || is_float($raw)) {
            return round((float) $raw, 2);
        }
        $text = trim((string) $raw);
        $text = str_replace(['€', ' '], '', $text);
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
            throw new ApiError('invalid_amount', 400, 'Importe no válido: ' . (string) $raw);
        }
        return round((float) $text, 2);
    }
}
