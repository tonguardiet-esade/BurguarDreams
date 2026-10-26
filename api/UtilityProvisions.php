<?php
declare(strict_types=1);

require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/Http.php';

/**
 * Provisiones de suministros por finca (casillas + a compte mensual).
 * Persistidas en SQLite para sobrevivir a recargas.
 */
final class UtilityProvisions
{
    /** @var array<string, array{id:string,apartmentLabel:string,addressLabel:string,water:bool,electricity:bool,wifi:bool,monthlyAmount:float}> */
    private const DEFAULTS = [
        'prop-urgell' => [
            'id' => 'util-urgell',
            'apartmentLabel' => 'Urgell — Francesc Macià',
            'addressLabel' => "Carrer Comte d'Urgell 259, -2º 1ª, 08036 Barcelona",
            'water' => true,
            'electricity' => true,
            'wifi' => false,
            'monthlyAmount' => 140.0,
        ],
        'prop-gran-via' => [
            'id' => 'util-gran-via',
            'apartmentLabel' => 'Gran Via',
            'addressLabel' => 'Gran Via de les Corts Catalanes 794, 1ª planta 2º, 08013 Barcelona',
            'water' => true,
            'electricity' => true,
            'wifi' => false,
            'monthlyAmount' => 100.0,
        ],
        'prop-can-bruixa' => [
            'id' => 'util-can-bruixa',
            'apartmentLabel' => 'Can Bruixa',
            'addressLabel' => 'Carrer Can Bruixa 16, 1ª planta 1ª, 08028 Barcelona',
            'water' => true,
            'electricity' => false,
            'wifi' => false,
            'monthlyAmount' => 35.0,
        ],
        'prop-valencia' => [
            'id' => 'util-valencia',
            'apartmentLabel' => 'València',
            'addressLabel' => 'Carrer València 178, 1ª planta 3ª, 08011 Barcelona',
            'water' => true,
            'electricity' => true,
            'wifi' => false,
            'monthlyAmount' => 100.0,
        ],
    ];

    public static function ensureSchema(PDO $pdo): void
    {
        if (Db::isPostgres()) {
            self::seedIfEmpty($pdo);
            return;
        }
        $pdo->exec(
            <<<'SQL'
CREATE TABLE IF NOT EXISTS utility_provisions (
  property_id TEXT PRIMARY KEY,
  apartment_label TEXT NOT NULL,
  address_label TEXT NOT NULL,
  water INTEGER NOT NULL DEFAULT 1,
  electricity INTEGER NOT NULL DEFAULT 1,
  wifi INTEGER NOT NULL DEFAULT 0,
  monthly_amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  updated_at TEXT NOT NULL
);
SQL
        );
        self::seedIfEmpty($pdo);
    }

    private static function seedIfEmpty(PDO $pdo): void
    {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM utility_provisions')->fetchColumn();
        if ($count > 0) {
            return;
        }
        $now = Db::utcNow();
        $ins = $pdo->prepare(
            'INSERT INTO utility_provisions
             (property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        foreach (self::DEFAULTS as $propertyId => $row) {
            $ins->execute([
                $propertyId,
                $row['apartmentLabel'],
                $row['addressLabel'],
                $row['water'] ? 1 : 0,
                $row['electricity'] ? 1 : 0,
                $row['wifi'] ? 1 : 0,
                $row['monthlyAmount'],
                'EUR',
                $now,
            ]);
        }
    }

    /** @return list<array<string, mixed>> */
    public static function listAll(): array
    {
        $session = Auth::requireAuth();
        $user = $session['user'] ?? [];
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);
        $stmt = $pdo->query(
            'SELECT property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency
             FROM utility_provisions
             ORDER BY apartment_label ASC'
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $out = [];
        foreach ($rows as $row) {
            $propertyId = (string) $row['property_id'];
            if (!Auth::isStaffRole((string) ($user['role'] ?? ''))) {
                $scoped = (string) ($user['propertyId'] ?? $user['property_id'] ?? '');
                if ($scoped !== '' && $scoped !== $propertyId) {
                    continue;
                }
            }
            $defaults = self::DEFAULTS[$propertyId] ?? null;
            $out[] = [
                'id' => $defaults['id'] ?? ('util-' . $propertyId),
                'propertyId' => $propertyId,
                'apartmentLabel' => (string) $row['apartment_label'],
                'addressLabel' => (string) $row['address_label'],
                'services' => [
                    'water' => ((int) $row['water']) === 1,
                    'electricity' => ((int) $row['electricity']) === 1,
                    'wifi' => ((int) $row['wifi']) === 1,
                ],
                'monthlyAmount' => round((float) $row['monthly_amount'], 2),
                'currency' => (string) ($row['currency'] ?: 'EUR'),
                'negotiableNote' => true,
            ];
        }
        return ['ok' => true, 'rows' => $out];
    }

    /** @param array<string, mixed> $body */
    public static function save(array $body): array
    {
        Auth::requireAdmin();
        $propertyId = trim((string) ($body['propertyId'] ?? ''));
        if ($propertyId === '' || !isset(self::DEFAULTS[$propertyId])) {
            throw new ApiError('invalid_property', 400, 'Apartamento no válido');
        }

        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);

        $current = self::getRow($pdo, $propertyId);
        $defaults = self::DEFAULTS[$propertyId];

        $services = is_array($body['services'] ?? null) ? $body['services'] : [];
        $water = array_key_exists('water', $services)
            ? (bool) $services['water']
            : (bool) $current['water'];
        $electricity = array_key_exists('electricity', $services)
            ? (bool) $services['electricity']
            : (bool) $current['electricity'];
        $wifi = array_key_exists('wifi', $services)
            ? (bool) $services['wifi']
            : (bool) $current['wifi'];

        $monthlyAmount = $current['monthly_amount'];
        if (array_key_exists('monthlyAmount', $body)) {
            $raw = $body['monthlyAmount'];
            if (!is_numeric($raw)) {
                throw new ApiError('invalid_amount', 400, 'Importe no válido');
            }
            $monthlyAmount = round((float) $raw, 2);
            if ($monthlyAmount < 0) {
                throw new ApiError('invalid_amount', 400, 'Importe no válido');
            }
        }

        $now = Db::utcNow();
        $stmt = $pdo->prepare(
            'INSERT INTO utility_provisions
             (property_id, apartment_label, address_label, water, electricity, wifi, monthly_amount, currency, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT(property_id) DO UPDATE SET
               water = excluded.water,
               electricity = excluded.electricity,
               wifi = excluded.wifi,
               monthly_amount = excluded.monthly_amount,
               updated_at = excluded.updated_at'
        );
        $stmt->execute([
            $propertyId,
            $current['apartment_label'] ?: $defaults['apartmentLabel'],
            $current['address_label'] ?: $defaults['addressLabel'],
            $water ? 1 : 0,
            $electricity ? 1 : 0,
            $wifi ? 1 : 0,
            $monthlyAmount,
            'EUR',
            $now,
        ]);

        $saved = self::getRow($pdo, $propertyId);
        return [
            'ok' => true,
            'row' => [
                'id' => $defaults['id'],
                'propertyId' => $propertyId,
                'apartmentLabel' => (string) $saved['apartment_label'],
                'addressLabel' => (string) $saved['address_label'],
                'services' => [
                    'water' => ((int) $saved['water']) === 1,
                    'electricity' => ((int) $saved['electricity']) === 1,
                    'wifi' => ((int) $saved['wifi']) === 1,
                ],
                'monthlyAmount' => round((float) $saved['monthly_amount'], 2),
                'currency' => 'EUR',
                'negotiableNote' => true,
            ],
        ];
    }

    /** @return array{apartment_label:string,address_label:string,water:int,electricity:int,wifi:int,monthly_amount:float} */
    private static function getRow(PDO $pdo, string $propertyId): array
    {
        $stmt = $pdo->prepare(
            'SELECT apartment_label, address_label, water, electricity, wifi, monthly_amount
             FROM utility_provisions WHERE property_id = ?'
        );
        $stmt->execute([$propertyId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            return [
                'apartment_label' => (string) $row['apartment_label'],
                'address_label' => (string) $row['address_label'],
                'water' => (int) $row['water'],
                'electricity' => (int) $row['electricity'],
                'wifi' => (int) $row['wifi'],
                'monthly_amount' => (float) $row['monthly_amount'],
            ];
        }
        $defaults = self::DEFAULTS[$propertyId];
        return [
            'apartment_label' => $defaults['apartmentLabel'],
            'address_label' => $defaults['addressLabel'],
            'water' => $defaults['water'] ? 1 : 0,
            'electricity' => $defaults['electricity'] ? 1 : 0,
            'wifi' => $defaults['wifi'] ? 1 : 0,
            'monthly_amount' => $defaults['monthlyAmount'],
        ];
    }

    public static function monthlyAmountFor(string $propertyId): ?float
    {
        if (!isset(self::DEFAULTS[$propertyId])) {
            return null;
        }
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);
        return self::getRow($pdo, $propertyId)['monthly_amount'];
    }
}
