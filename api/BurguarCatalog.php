<?php
declare(strict_types=1);

final class Catalog
{
    private const SECTIONS = [
        'properties',
        'receipts',
        'invoices',
        'settlements',
        'industrialContacts',
        'tenants',
    ];

    public static function ensureSchema(PDO $pdo): void
    {
        $pdo->exec(
            <<<'SQL'
CREATE TABLE IF NOT EXISTS intranet_catalog_snapshots (
  section TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);
SQL
        );
    }

    /** @return array<string, list<mixed>> */
    public static function loadAll(): array
    {
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);

        $out = [];
        foreach (self::SECTIONS as $section) {
            $out[$section] = [];
        }

        $stmt = $pdo->query('SELECT section, payload_json FROM intranet_catalog_snapshots');
        if ($stmt === false) {
            return $out;
        }
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $section = (string) ($row['section'] ?? '');
            if (!in_array($section, self::SECTIONS, true)) {
                continue;
            }
            $raw = (string) ($row['payload_json'] ?? '[]');
            $decoded = json_decode($raw, true);
            $out[$section] = is_array($decoded) ? $decoded : [];
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $body
     * @return array<string, list<mixed>>
     */
    public static function save(array $body): array
    {
        Auth::requireAdmin();
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);

        $catalog = $body['catalog'] ?? $body;
        if (!is_array($catalog)) {
            throw new ApiError('invalid_body', 400, 'Cuerpo inválido: se esperaba catalog');
        }

        $now = gmdate('Y-m-d\TH:i:s\Z');
        $saved = [];
        foreach (self::SECTIONS as $section) {
            $saved[$section] = [];
        }

        $stmt = $pdo->prepare(
            'INSERT INTO intranet_catalog_snapshots (section, payload_json, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT(section) DO UPDATE SET
               payload_json = excluded.payload_json,
               updated_at = excluded.updated_at'
        );

        foreach (self::SECTIONS as $section) {
            if (!array_key_exists($section, $catalog)) {
                continue;
            }
            $items = $catalog[$section];
            if (!is_array($items)) {
                continue;
            }
            $json = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json === false) {
                $json = '[]';
            }
            $stmt->execute([$section, $json, $now]);
            $saved[$section] = $items;
        }

        return $saved;
    }
}
