<?php
declare(strict_types=1);

/**
 * Volcado de tablas persistidas para Renti (sin password_hash ni tokens de sesión).
 */
final class AssistantDbContext
{
    /** Groq free/on_demand ~8k TPM: contexto pequeño (~5–6k tokens). */
    public const CONTEXT_MAX_CHARS_GROQ = 22000;

    /** Límite prudente para Gemini desde Hostinger (evita timeout). */
    public const CONTEXT_MAX_CHARS = 280000;

    public static function buildSnapshot(): array
    {
        Db::init();
        $pdo = Db::connect();

        $users = self::fetchAll(
            $pdo,
            'SELECT id, username, email, display_name, role, property_id, created_at, updated_at, last_login_at
             FROM users ORDER BY display_name ASC'
        );
        $contracts = self::normalizeContracts(
            self::fetchAll($pdo, 'SELECT * FROM rental_contracts ORDER BY address ASC')
        );
        $provisions = self::fetchAll(
            $pdo,
            'SELECT property_id, apartment_label, address_label, water, electricity, wifi,
                    monthly_amount, currency, updated_at
             FROM utility_provisions ORDER BY apartment_label ASC'
        );
        $ledger = self::fetchAll(
            $pdo,
            'SELECT property_id, year_month, month_label, entry_date, water, electricity, wifi,
                    a_compte, sort_order, updated_at
             FROM utility_ledger
             ORDER BY property_id ASC, sort_order ASC, year_month ASC'
        );
        $tenancy = self::fetchAll(
            $pdo,
            'SELECT property_id, start_date, end_date, updated_at FROM utility_tenancy ORDER BY property_id ASC'
        );
        $tickets = self::fetchAll(
            $pdo,
            'SELECT id, number, title, description, status, priority, category, property_id,
                    created_by_id, created_by_name, assignee_id, assignee_name,
                    created_at, updated_at, resolved_at
             FROM support_tickets ORDER BY updated_at DESC'
        );
        $comments = self::fetchAll(
            $pdo,
            'SELECT id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
             FROM support_ticket_comments ORDER BY created_at ASC'
        );

        Catalog::ensureSchema($pdo);
        $catalog = Catalog::loadAll();

        return [
            'snapshotAt' => gmdate('Y-m-d\TH:i:s\Z'),
            'users' => $users,
            'rentalContracts' => $contracts,
            'utilityProvisions' => $provisions,
            'utilityLedger' => $ledger,
            'utilityTenancy' => $tenancy,
            'supportTickets' => $tickets,
            'supportTicketComments' => $comments,
            'intranetCatalog' => $catalog,
            'counts' => [
                'users' => count($users),
                'rentalContracts' => count($contracts),
                'utilityLedgerRows' => count($ledger),
                'supportTickets' => count($tickets),
                'catalogProperties' => count($catalog['properties'] ?? []),
                'catalogReceipts' => count($catalog['receipts'] ?? []),
                'catalogInvoices' => count($catalog['invoices'] ?? []),
                'catalogSettlements' => count($catalog['settlements'] ?? []),
                'catalogTenants' => count($catalog['tenants'] ?? []),
                'catalogIndustrialContacts' => count($catalog['industrialContacts'] ?? []),
            ],
        ];
    }

    /** @param array<string, mixed> $clientContext */
    public static function mergeContext(array $clientContext): array
    {
        $intranet = $clientContext['intranet'] ?? null;
        if (!is_array($intranet)) {
            $intranet = isset($clientContext['database']) ? [] : $clientContext;
        }
        if (!is_array($intranet)) {
            $intranet = [];
        }

        $database = $clientContext['database'] ?? null;
        if (!self::isUsableDatabaseSnapshot($database)) {
            $database = self::buildSnapshot();
        }

        return [
            'generatedAt' => gmdate('Y-m-d\TH:i:s\Z'),
            'database' => $database,
            'intranet' => $intranet,
        ];
    }

    /** @param array<string, mixed> $merged */
    public static function compactForGemini(array $merged): array
    {
        $db = $merged['database'] ?? null;
        if (is_array($db)) {
            unset($db['supportTicketComments']);
            if (isset($db['supportTickets']) && is_array($db['supportTickets'])) {
                $db['supportTickets'] = array_slice($db['supportTickets'], 0, 12);
            }
            if (isset($db['intranetCatalog']) && is_array($db['intranetCatalog'])) {
                foreach (['receipts', 'invoices', 'settlements'] as $section) {
                    if (!isset($db['intranetCatalog'][$section]) || !is_array($db['intranetCatalog'][$section])) {
                        continue;
                    }
                    $total = count($db['intranetCatalog'][$section]);
                    if ($total > 35) {
                        $db['intranetCatalog'][$section] = array_slice($db['intranetCatalog'][$section], 0, 35);
                        $db['intranetCatalog'][$section . 'Truncated'] = $total;
                    }
                }
            }
            $merged['database'] = $db;
        }

        $intranet = $merged['intranet'] ?? null;
        if (is_array($intranet)) {
            foreach (['receipts', 'invoices', 'settlements', 'notifications', 'tasks'] as $section) {
                if (!isset($intranet[$section]) || !is_array($intranet[$section])) {
                    continue;
                }
                $total = count($intranet[$section]);
                if ($total > 40) {
                    $intranet[$section] = array_slice($intranet[$section], 0, 40);
                    $intranet[$section . 'Truncated'] = $total;
                }
            }
            $merged['intranet'] = $intranet;
        }

        return $merged;
    }

    /** Recorte fuerte para Groq (límite TPM ~8k en plan gratuito). */
    public static function compactForGroq(array $merged): array
    {
        $merged = self::compactForGemini($merged);
        $db = $merged['database'] ?? null;
        if (is_array($db)) {
            unset($db['supportTickets'], $db['supportTicketComments']);
            if (isset($db['users']) && is_array($db['users'])) {
                $db['users'] = array_map(static function ($u): array {
                    if (!is_array($u)) {
                        return [];
                    }
                    return [
                        'id' => $u['id'] ?? '',
                        'display_name' => $u['display_name'] ?? $u['displayName'] ?? '',
                        'role' => $u['role'] ?? '',
                    ];
                }, array_slice($db['users'], 0, 40));
            }
            if (isset($db['rentalContracts']) && is_array($db['rentalContracts'])) {
                $slim = [];
                foreach ($db['rentalContracts'] as $c) {
                    if (!is_array($c)) {
                        continue;
                    }
                    $slim[] = [
                        'id' => $c['id'] ?? '',
                        'address' => $c['address'] ?? '',
                        'tenant' => $c['tenant'] ?? '',
                        'propertyId' => $c['propertyId'] ?? $c['property_id'] ?? '',
                        'monthlyRent' => $c['monthlyRent'] ?? $c['monthly_rent'] ?? null,
                        'endDate' => $c['endDate'] ?? $c['end_date'] ?? null,
                    ];
                }
                $db['rentalContracts'] = $slim;
            }
            if (isset($db['utilityLedger']) && is_array($db['utilityLedger'])) {
                $byProp = [];
                foreach ($db['utilityLedger'] as $row) {
                    if (!is_array($row)) {
                        continue;
                    }
                    $pid = (string) ($row['property_id'] ?? '');
                    $byProp[$pid][] = [
                        'property_id' => $pid,
                        'year_month' => $row['year_month'] ?? '',
                        'electricity' => $row['electricity'] ?? null,
                        'water' => $row['water'] ?? null,
                    ];
                }
                $trimmed = [];
                foreach ($byProp as $rows) {
                    $trimmed = array_merge($trimmed, array_slice($rows, -18));
                }
                $db['utilityLedger'] = $trimmed;
            }
            if (isset($db['intranetCatalog']) && is_array($db['intranetCatalog'])) {
                $cat = $db['intranetCatalog'];
                $db['intranetCatalog'] = [
                    'properties' => array_slice($cat['properties'] ?? [], 0, 20),
                    'tenants' => array_slice($cat['tenants'] ?? [], 0, 25),
                ];
            }
            $merged['database'] = $db;
        }

        $intranet = $merged['intranet'] ?? null;
        if (is_array($intranet)) {
            $keep = [];
            foreach (['properties', 'tenants', 'utilityProvisions'] as $key) {
                if (isset($intranet[$key])) {
                    $keep[$key] = is_array($intranet[$key])
                        ? array_slice($intranet[$key], 0, 25)
                        : $intranet[$key];
                }
            }
            $merged['intranet'] = $keep;
        }

        return $merged;
    }

    /** @param mixed $database */
    private static function isUsableDatabaseSnapshot(mixed $database): bool
    {
        if (!is_array($database)) {
            return false;
        }
        return isset($database['utilityLedger'])
            || isset($database['rentalContracts'])
            || isset($database['counts']);
    }

    /** @param array<string, mixed> $merged */
    public static function serializeContext(array $merged, string $provider = 'default'): string
    {
        $forGroq = $provider === 'groq';
        $maxChars = $forGroq ? self::CONTEXT_MAX_CHARS_GROQ : self::CONTEXT_MAX_CHARS;
        $merged = $forGroq ? self::compactForGroq($merged) : self::compactForGemini($merged);
        $json = json_encode($merged, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return '{}';
        }
        if (strlen($json) <= $maxChars) {
            return $json;
        }

        $shrunk = json_decode($json, true);
        if (!is_array($shrunk)) {
            return substr($json, 0, $maxChars) . '…';
        }
        $db = $shrunk['database'] ?? null;
        if (is_array($db) && isset($db['utilityLedger']) && is_array($db['utilityLedger'])) {
            $byProp = [];
            foreach ($db['utilityLedger'] as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $pid = (string) ($row['property_id'] ?? '');
                $byProp[$pid][] = $row;
            }
            $trimmed = [];
            $tail = $forGroq ? 12 : 36;
            foreach ($byProp as $rows) {
                $trimmed = array_merge($trimmed, array_slice($rows, -$tail));
            }
            $db['utilityLedger'] = $trimmed;
            $db['utilityLedgerTruncated'] = true;
            $shrunk['database'] = $db;
            $json2 = json_encode($shrunk, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json2 !== false && strlen($json2) <= $maxChars) {
                return $json2;
            }
            if ($json2 !== false) {
                $json = $json2;
            }
        }

        return substr($json, 0, $maxChars) . '…';
    }

    /** @return list<array<string, mixed>> */
    private static function fetchAll(PDO $pdo, string $sql): array
    {
        try {
            $stmt = $pdo->query($sql);
            if ($stmt === false) {
                return [];
            }
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return is_array($rows) ? $rows : [];
        } catch (Throwable) {
            return [];
        }
    }

    /** @param list<array<string, mixed>> $rows */
    private static function normalizeContracts(array $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $docs = $row['documents_json'] ?? null;
            unset($row['documents_json']);
            if (is_string($docs) && $docs !== '') {
                $decoded = json_decode($docs, true);
                $row['documents'] = is_array($decoded) ? $decoded : [];
            } else {
                $row['documents'] = [];
            }
            $out[] = $row;
        }
        return $out;
    }
}
