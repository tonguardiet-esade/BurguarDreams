<?php
declare(strict_types=1);

require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/BurguarCatalog.php';

/** Importación idempotente de los snapshots JSON actuales a tablas consultables. */
final class CloudMigration
{
    /** @param array<string,mixed>|null $authorizedSession */
    public static function importCatalog(?array $authorizedSession = null): array
    {
        $session = $authorizedSession ?? Auth::requireAdmin();
        Db::init();
        if (!Db::isPostgres()) {
            throw new ApiError('supabase_required', 503, 'La importación requiere Supabase PostgreSQL');
        }
        $catalog = Catalog::loadAll();
        $pdo = Db::connect();
        $counts = [];
        $pdo->beginTransaction();
        try {
            $counts['properties'] = self::importProperties($pdo, $catalog['properties'] ?? []);
            $counts['industrialContacts'] = self::importContacts(
                $pdo,
                $catalog['industrialContacts'] ?? []
            );
            $counts['tenants'] = self::importTenants($pdo, $catalog['tenants'] ?? []);
            $counts['invoices'] = self::importFinancial(
                $pdo,
                'invoices',
                $catalog['invoices'] ?? []
            );
            $counts['receipts'] = self::importFinancial(
                $pdo,
                'receipts',
                $catalog['receipts'] ?? []
            );
            $counts['settlements'] = self::importFinancial(
                $pdo,
                'settlements',
                $catalog['settlements'] ?? []
            );
            $pdo->prepare(
                'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json, created_at)
                 VALUES (?, ?, ?, ?, CAST(? AS jsonb), ?)'
            )->execute([
                (string) ($session['user']['id'] ?? '') ?: null,
                'catalog_import',
                'migration',
                'catalog-to-normalized',
                json_encode($counts, JSON_UNESCAPED_SLASHES),
                Db::utcNow(),
            ]);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
        return ['ok' => true, 'imported' => $counts];
    }

    /** @param list<mixed> $items */
    private static function importProperties(PDO $pdo, array $items): int
    {
        $stmt = $pdo->prepare(
            'INSERT INTO properties (id, name, address, city, postal_code, status, details_json, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name, address = EXCLUDED.address, city = EXCLUDED.city,
               postal_code = EXCLUDED.postal_code, status = EXCLUDED.status,
               details_json = EXCLUDED.details_json, updated_at = EXCLUDED.updated_at'
        );
        $count = 0;
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = self::id($item, 'property', $index);
            $stmt->execute([
                $id,
                self::text($item, ['name', 'title', 'label'], $id),
                self::text($item, ['address', 'addressLabel', 'location'], ''),
                self::text($item, ['city'], 'Barcelona'),
                self::nullable(self::text($item, ['postalCode', 'zip'], '')),
                self::text($item, ['status'], 'active'),
                self::json($item),
                Db::utcNow(),
            ]);
            $count++;
        }
        return $count;
    }

    /** @param list<mixed> $items */
    private static function importContacts(PDO $pdo, array $items): int
    {
        $stmt = $pdo->prepare(
            'INSERT INTO industrial_contacts (
               id, name, company, category, email, phone, notes, details_json, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name, company = EXCLUDED.company, category = EXCLUDED.category,
               email = EXCLUDED.email, phone = EXCLUDED.phone, notes = EXCLUDED.notes,
               details_json = EXCLUDED.details_json, updated_at = EXCLUDED.updated_at'
        );
        $count = 0;
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = self::id($item, 'contact', $index);
            $stmt->execute([
                $id,
                self::text($item, ['name', 'displayName', 'company'], $id),
                self::nullable(self::text($item, ['company', 'business'], '')),
                self::text($item, ['category', 'trade', 'type'], 'other'),
                self::nullable(self::text($item, ['email'], '')),
                self::nullable(self::text($item, ['phone', 'telephone'], '')),
                self::nullable(self::text($item, ['notes', 'description'], '')),
                self::json($item),
                Db::utcNow(),
            ]);
            $count++;
        }
        return $count;
    }

    /** @param list<mixed> $items */
    private static function importTenants(PDO $pdo, array $items): int
    {
        $stmt = $pdo->prepare(
            'INSERT INTO tenancies (
               id, property_id, user_id, tenant_name, start_date, end_date,
               status, details_json, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
             ON CONFLICT (id) DO UPDATE SET
               property_id = EXCLUDED.property_id, user_id = EXCLUDED.user_id,
               tenant_name = EXCLUDED.tenant_name, start_date = EXCLUDED.start_date,
               end_date = EXCLUDED.end_date, status = EXCLUDED.status,
               details_json = EXCLUDED.details_json, updated_at = EXCLUDED.updated_at'
        );
        $count = 0;
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                continue;
            }
            $propertyId = self::text($item, ['propertyId', 'property_id'], '');
            if ($propertyId === '') {
                continue;
            }
            $id = self::id($item, 'tenancy', $index);
            $stmt->execute([
                $id,
                $propertyId,
                self::referenceOrNull($pdo, 'users', self::text($item, ['userId', 'user_id'], '')),
                self::text($item, ['name', 'displayName', 'tenant'], $id),
                self::dateOrNull(self::text($item, ['startDate', 'start_date'], '')),
                self::dateOrNull(self::text($item, ['endDate', 'end_date'], '')),
                self::text($item, ['status'], 'active'),
                self::json($item),
                Db::utcNow(),
            ]);
            $count++;
        }
        return $count;
    }

    /** @param list<mixed> $items */
    private static function importFinancial(PDO $pdo, string $table, array $items): int
    {
        $allowed = ['invoices', 'receipts', 'settlements'];
        if (!in_array($table, $allowed, true)) {
            throw new RuntimeException('Tabla financiera no permitida');
        }
        $count = 0;
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                continue;
            }
            $id = self::id($item, rtrim($table, 's'), $index);
            $json = self::json($item);
            $now = Db::utcNow();
            if ($table === 'invoices') {
                $pdo->prepare(
                    'INSERT INTO invoices (
                       id, property_id, tenant_id, number, concept, amount, currency,
                       status, issued_on, due_on, details_json, updated_at
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
                     ON CONFLICT (id) DO UPDATE SET
                       concept = EXCLUDED.concept, amount = EXCLUDED.amount,
                       status = EXCLUDED.status, details_json = EXCLUDED.details_json,
                       updated_at = EXCLUDED.updated_at'
                )->execute([
                    $id,
                    self::referenceOrNull($pdo, 'properties', self::text($item, ['propertyId'], '')),
                    self::referenceOrNull($pdo, 'users', self::text($item, ['tenantId', 'userId'], '')),
                    self::nullable(self::text($item, ['number', 'reference'], '')),
                    self::text($item, ['concept', 'description', 'title'], ''),
                    self::amount($item),
                    self::text($item, ['currency'], 'EUR'),
                    self::text($item, ['status'], 'pending'),
                    self::dateOrNull(self::text($item, ['issuedOn', 'date'], '')),
                    self::dateOrNull(self::text($item, ['dueOn', 'dueDate'], '')),
                    $json,
                    $now,
                ]);
            } elseif ($table === 'receipts') {
                $pdo->prepare(
                    'INSERT INTO receipts (
                       id, property_id, tenant_id, period, concept, amount, currency,
                       status, paid_at, details_json, updated_at
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
                     ON CONFLICT (id) DO UPDATE SET
                       concept = EXCLUDED.concept, amount = EXCLUDED.amount,
                       status = EXCLUDED.status, details_json = EXCLUDED.details_json,
                       updated_at = EXCLUDED.updated_at'
                )->execute([
                    $id,
                    self::referenceOrNull($pdo, 'properties', self::text($item, ['propertyId'], '')),
                    self::referenceOrNull($pdo, 'users', self::text($item, ['tenantId', 'userId'], '')),
                    self::nullable(self::text($item, ['period', 'month'], '')),
                    self::text($item, ['concept', 'description', 'title'], ''),
                    self::amount($item),
                    self::text($item, ['currency'], 'EUR'),
                    self::text($item, ['status'], 'pending'),
                    self::nullable(self::text($item, ['paidAt'], '')),
                    $json,
                    $now,
                ]);
            } else {
                $gross = self::number($item, ['grossAmount', 'gross', 'amount']);
                $expenses = self::number($item, ['expensesAmount', 'expenses']);
                $net = self::number($item, ['netAmount', 'net']);
                if ($net === 0.0 && ($gross !== 0.0 || $expenses !== 0.0)) {
                    $net = $gross - $expenses;
                }
                $pdo->prepare(
                    'INSERT INTO settlements (
                       id, property_id, period_start, period_end, gross_amount,
                       expenses_amount, net_amount, currency, status, details_json, updated_at
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?)
                     ON CONFLICT (id) DO UPDATE SET
                       gross_amount = EXCLUDED.gross_amount,
                       expenses_amount = EXCLUDED.expenses_amount,
                       net_amount = EXCLUDED.net_amount, status = EXCLUDED.status,
                       details_json = EXCLUDED.details_json, updated_at = EXCLUDED.updated_at'
                )->execute([
                    $id,
                    self::referenceOrNull($pdo, 'properties', self::text($item, ['propertyId'], '')),
                    self::dateOrNull(self::text($item, ['periodStart', 'startDate'], '')),
                    self::dateOrNull(self::text($item, ['periodEnd', 'endDate'], '')),
                    $gross,
                    $expenses,
                    $net,
                    self::text($item, ['currency'], 'EUR'),
                    self::text($item, ['status'], 'draft'),
                    $json,
                    $now,
                ]);
            }
            $count++;
        }
        return $count;
    }

    /** @param array<string,mixed> $item */
    private static function id(array $item, string $prefix, int $index): string
    {
        $raw = self::text($item, ['id', 'uuid', 'reference', 'number'], '');
        if ($raw === '') {
            $raw = $prefix . '-' . substr(hash('sha256', self::json($item) . ':' . $index), 0, 16);
        }
        $safe = preg_replace('/[^a-zA-Z0-9._-]/', '-', $raw);
        return substr((string) $safe, 0, 200);
    }

    /** @param array<string,mixed> $item @param list<string> $keys */
    private static function text(array $item, array $keys, string $default): string
    {
        foreach ($keys as $key) {
            if (isset($item[$key]) && !is_array($item[$key]) && !is_object($item[$key])) {
                $value = trim((string) $item[$key]);
                if ($value !== '') {
                    return $value;
                }
            }
        }
        return $default;
    }

    /** @param array<string,mixed> $item */
    private static function json(array $item): string
    {
        return json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
    }

    /** @param array<string,mixed> $item */
    private static function amount(array $item): float
    {
        return self::number($item, ['amount', 'total', 'value', 'netAmount']);
    }

    /** @param array<string,mixed> $item @param list<string> $keys */
    private static function number(array $item, array $keys): float
    {
        $text = self::text($item, $keys, '0');
        $text = str_replace(['€', ' '], '', $text);
        if (str_contains($text, ',') && !str_contains($text, '.')) {
            $text = str_replace(',', '.', $text);
        }
        return is_numeric($text) ? (float) $text : 0.0;
    }

    private static function nullable(string $value): ?string
    {
        return trim($value) !== '' ? trim($value) : null;
    }

    private static function referenceOrNull(PDO $pdo, string $table, string $id): ?string
    {
        $id = trim($id);
        if ($id === '' || !in_array($table, ['users', 'properties'], true)) {
            return null;
        }
        $stmt = $pdo->prepare('SELECT 1 FROM ' . $table . ' WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetchColumn() !== false ? $id : null;
    }

    private static function dateOrNull(string $value): ?string
    {
        if ($value === '') {
            return null;
        }
        $time = strtotime($value);
        return $time === false ? null : gmdate('Y-m-d', $time);
    }
}
