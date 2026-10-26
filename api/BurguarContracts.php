<?php
declare(strict_types=1);

/**
 * Contratos de alquiler (importes mensuales) en SQLite.
 * NO llamar a este fichero Contracts.php: en Windows colisiona con contracts.php.
 */
final class Contracts
{
    /** @return list<array<string,mixed>> */
    private static function seeds(): array
    {
        return [
            [
                'id' => 'c1',
                'tenantId' => 'tenant-urgell',
                'propertyId' => 'prop-urgell',
                'reference' => 'CNT-UR-001',
                'address' => "Urgell — Comte d'Urgell 259, -2º 1ª",
                'tenant' => 'Emma y Sara',
                'startDate' => '2026-07-01',
                'endDate' => '2027-05-31',
                'status' => 'active',
                'monthlyRent' => null,
                'monthlyUtilities' => null,
                'finished' => false,
                'finishedLastSixMonths' => false,
                'documents' => [
                    ['id' => 'doc-c1-1', 'type' => 'contractPdf', 'available' => true],
                    ['id' => 'doc-c1-2', 'type' => 'annex', 'available' => true],
                ],
            ],
            [
                'id' => 'c2',
                'tenantId' => 'tenant-gran-via',
                'propertyId' => 'prop-gran-via',
                'reference' => 'CNT-GV-001',
                'address' => 'Gran Via — Gran Via 794, 1ª planta 2º',
                'tenant' => 'Punit',
                'startDate' => '2026-10-03',
                'endDate' => '2027-09-02',
                'status' => 'active',
                'monthlyRent' => null,
                'monthlyUtilities' => null,
                'finished' => false,
                'finishedLastSixMonths' => false,
                'documents' => [
                    ['id' => 'doc-c2-1', 'type' => 'contractPdf', 'available' => true],
                    ['id' => 'doc-c2-2', 'type' => 'annex', 'available' => true],
                ],
            ],
            [
                'id' => 'c3',
                'tenantId' => 'tenant-can-bruixa',
                'propertyId' => 'prop-can-bruixa',
                'reference' => 'CNT-CB-001',
                'address' => 'Can Bruixa — Carrer Can Bruixa 16, 1ª planta 1ª',
                'tenant' => 'Ostap y Arina',
                'startDate' => '2026-07-13',
                'endDate' => '2027-06-12',
                'status' => 'active',
                'monthlyRent' => null,
                'monthlyUtilities' => null,
                'finished' => false,
                'finishedLastSixMonths' => false,
                'documents' => [
                    ['id' => 'doc-c3-1', 'type' => 'contractPdf', 'available' => true],
                    ['id' => 'doc-c3-2', 'type' => 'inventory', 'available' => true],
                ],
            ],
            [
                'id' => 'c4',
                'tenantId' => 'tenant-valencia',
                'propertyId' => 'prop-valencia',
                'reference' => 'CNT-VA-001',
                'address' => 'València — Carrer València 178, 1ª planta 3ª',
                'tenant' => 'Aida Abuzaid',
                'startDate' => '2026-09-16',
                'endDate' => '2027-08-15',
                'status' => 'active',
                'monthlyRent' => null,
                'monthlyUtilities' => null,
                'finished' => false,
                'finishedLastSixMonths' => false,
                'documents' => [
                    ['id' => 'doc-c4-1', 'type' => 'contractPdf', 'available' => true],
                ],
            ],
        ];
    }

    private static function ensureSchema(PDO $pdo): void
    {
        if (Db::isPostgres()) {
            $count = (int) $pdo->query('SELECT COUNT(*) FROM rental_contracts')->fetchColumn();
            if ($count === 0) {
                self::seedContracts($pdo);
            }
            return;
        }
        $pdo->exec(
            <<<'SQL'
CREATE TABLE IF NOT EXISTS rental_contracts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  property_id TEXT,
  reference TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  tenant TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  monthly_rent REAL,
  monthly_utilities REAL,
  finished INTEGER NOT NULL DEFAULT 0,
  finished_last_six_months INTEGER NOT NULL DEFAULT 0,
  documents_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_tenant ON rental_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_contracts_property ON rental_contracts(property_id);
SQL
        );

        $count = (int) $pdo->query('SELECT COUNT(*) FROM rental_contracts')->fetchColumn();
        if ($count > 0) {
            return;
        }
        self::seedContracts($pdo);
    }

    private static function seedContracts(PDO $pdo): void
    {
        $now = Db::utcNow();
        $ins = $pdo->prepare(
            'INSERT INTO rental_contracts (
              id, tenant_id, property_id, reference, address, tenant,
              start_date, end_date, status, monthly_rent, monthly_utilities,
              finished, finished_last_six_months, documents_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach (self::seeds() as $row) {
            $finished = (bool) $row['finished'];
            $finishedSix = (bool) $row['finishedLastSixMonths'];
            $ins->execute([
                $row['id'],
                $row['tenantId'],
                $row['propertyId'],
                $row['reference'],
                $row['address'],
                $row['tenant'],
                $row['startDate'],
                $row['endDate'],
                $row['status'],
                $row['monthlyRent'],
                $row['monthlyUtilities'],
                Db::isPostgres() ? $finished : ($finished ? 1 : 0),
                Db::isPostgres() ? $finishedSix : ($finishedSix ? 1 : 0),
                json_encode($row['documents'], JSON_UNESCAPED_UNICODE),
                $now,
            ]);
        }
    }

    private static function asBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }
        if ($value === 't' || $value === 'true' || $value === '1') {
            return true;
        }
        if ($value === 'f' || $value === 'false' || $value === '0' || $value === '') {
            return false;
        }
        return (int) $value === 1;
    }

    /** @param array<string,mixed> $row */
    private static function rowPayload(array $row): array
    {
        $documents = json_decode((string) ($row['documents_json'] ?? '[]'), true);
        if (!is_array($documents)) {
            $documents = [];
        }
        return [
            'id' => (string) $row['id'],
            'tenantId' => $row['tenant_id'],
            'propertyId' => $row['property_id'],
            'reference' => (string) ($row['reference'] ?? ''),
            'address' => (string) ($row['address'] ?? ''),
            'tenant' => (string) ($row['tenant'] ?? ''),
            'startDate' => (string) ($row['start_date'] ?? ''),
            'endDate' => (string) ($row['end_date'] ?? ''),
            'status' => (string) ($row['status'] ?? 'active'),
            'monthlyRent' => self::nullableFloatColumn($row['monthly_rent'] ?? null),
            'monthlyUtilities' => self::nullableFloatColumn($row['monthly_utilities'] ?? null),
            'finished' => self::asBool($row['finished'] ?? false),
            'finishedLastSixMonths' => self::asBool($row['finished_last_six_months'] ?? false),
            'documents' => $documents,
        ];
    }

    /** @return array{ok:bool,rows:list<array<string,mixed>>} */
    public static function listAll(): array
    {
        $session = Auth::requireAuth();
        $user = $session['user'] ?? [];
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);

        $rows = $pdo->query('SELECT * FROM rental_contracts ORDER BY address ASC')->fetchAll();
        $out = [];
        foreach ($rows as $row) {
            $payload = self::rowPayload($row);
            if (!Auth::isStaffRole((string) ($user['role'] ?? ''))) {
                $scoped = trim((string) ($user['propertyId'] ?? ''));
                if ($scoped !== '' && $scoped !== (string) ($payload['propertyId'] ?? '')) {
                    continue;
                }
            }
            $out[] = $payload;
        }
        return ['ok' => true, 'rows' => $out];
    }

    /** @param array<string,mixed> $body */
    public static function save(array $body): array
    {
        Auth::requireAdmin();
        $contractId = trim((string) ($body['id'] ?? ''));
        if ($contractId === '') {
            throw new ApiError('invalid_payload', 400, 'Falta id de contrato');
        }

        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);

        $stmt = $pdo->prepare('SELECT * FROM rental_contracts WHERE id = ?');
        $stmt->execute([$contractId]);
        $current = $stmt->fetch();

        if ($current) {
            $payload = self::rowPayload($current);
        } else {
            $payload = [
                'id' => $contractId,
                'tenantId' => null,
                'propertyId' => null,
                'reference' => '',
                'address' => '',
                'tenant' => '',
                'startDate' => '',
                'endDate' => '',
                'status' => 'active',
                'monthlyRent' => null,
                'monthlyUtilities' => null,
                'finished' => false,
                'finishedLastSixMonths' => false,
                'documents' => [],
            ];
        }

        foreach (
            [
                'tenantId',
                'propertyId',
                'reference',
                'address',
                'tenant',
                'startDate',
                'endDate',
                'status',
                'finished',
                'finishedLastSixMonths',
                'documents',
            ] as $key
        ) {
            if (array_key_exists($key, $body)) {
                $payload[$key] = $body[$key];
            }
        }
        if (array_key_exists('monthlyRent', $body)) {
            $payload['monthlyRent'] = self::nullableFloat($body['monthlyRent']);
        }
        if (array_key_exists('monthlyUtilities', $body)) {
            $payload['monthlyUtilities'] = self::nullableFloat($body['monthlyUtilities']);
        }
        if (($payload['status'] ?? '') === 'expired') {
            $payload['finished'] = true;
        }

        $finished = self::asBool($payload['finished'] ?? false);
        $finishedSix = self::asBool($payload['finishedLastSixMonths'] ?? false);
        if (Db::isPostgres()) {
            // PDO pgsql: bool PHP a veces se envía como "" y rompe el INSERT.
            $finishedDb = $finished ? 'true' : 'false';
            $finishedSixDb = $finishedSix ? 'true' : 'false';
        } else {
            $finishedDb = $finished ? 1 : 0;
            $finishedSixDb = $finishedSix ? 1 : 0;
        }

        $now = Db::utcNow();
        $upd = $pdo->prepare(
            'INSERT INTO rental_contracts (
              id, tenant_id, property_id, reference, address, tenant,
              start_date, end_date, status, monthly_rent, monthly_utilities,
              finished, finished_last_six_months, documents_json, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              tenant_id = excluded.tenant_id,
              property_id = excluded.property_id,
              reference = excluded.reference,
              address = excluded.address,
              tenant = excluded.tenant,
              start_date = excluded.start_date,
              end_date = excluded.end_date,
              status = excluded.status,
              monthly_rent = excluded.monthly_rent,
              monthly_utilities = excluded.monthly_utilities,
              finished = excluded.finished,
              finished_last_six_months = excluded.finished_last_six_months,
              documents_json = excluded.documents_json,
              updated_at = excluded.updated_at'
        );
        $upd->execute([
            $payload['id'],
            $payload['tenantId'] ?? null,
            $payload['propertyId'] ?? null,
            (string) ($payload['reference'] ?? ''),
            (string) ($payload['address'] ?? ''),
            (string) ($payload['tenant'] ?? ''),
            (string) ($payload['startDate'] ?? ''),
            (string) ($payload['endDate'] ?? ''),
            (string) ($payload['status'] ?? 'active'),
            $payload['monthlyRent'],
            $payload['monthlyUtilities'],
            $finishedDb,
            $finishedSixDb,
            json_encode($payload['documents'] ?? [], JSON_UNESCAPED_UNICODE),
            $now,
        ]);

        $reload = $pdo->prepare('SELECT * FROM rental_contracts WHERE id = ?');
        $reload->execute([$contractId]);
        $saved = $reload->fetch();
        if (!$saved) {
            throw new ApiError('server_error', 500, 'No se pudo leer el contrato guardado');
        }

        return ['ok' => true, 'row' => self::rowPayload($saved)];
    }

    /** Valor leído de BD (Postgres/SQLite) → JSON. */
    private static function nullableFloatColumn(mixed $raw): ?float
    {
        if ($raw === null || $raw === '') {
            return null;
        }
        if (!is_numeric($raw)) {
            return null;
        }
        return round((float) $raw, 2);
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
        if ($text === '') {
            return null;
        }
        $text = str_replace(['€', ' '], '', $text);
        if (str_contains($text, ',') && str_contains($text, '.')) {
            $text = str_replace('.', '', $text);
            $text = str_replace(',', '.', $text);
        } elseif (str_contains($text, ',')) {
            $text = str_replace(',', '.', $text);
        }
        if (!is_numeric($text)) {
            throw new ApiError('invalid_amount', 400, 'Importe no válido');
        }
        return round((float) $text, 2);
    }
}
