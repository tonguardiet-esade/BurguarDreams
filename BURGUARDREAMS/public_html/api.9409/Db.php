<?php
declare(strict_types=1);

require_once __DIR__ . '/Env.php';
require_once __DIR__ . '/Passwords.php';

/**
 * SQLite local o PostgreSQL (Supabase) según DATABASE_URL en .env.
 */
final class Db
{
    private static ?PDO $pdo = null;

    private static ?bool $postgres = null;

    public static function isPostgres(): bool
    {
        if (self::$postgres !== null) {
            return self::$postgres;
        }
        Env::load();
        self::$postgres = Env::get('DATABASE_URL', '') !== '';
        return self::$postgres;
    }

    public static function label(): string
    {
        return self::isPostgres() ? 'postgresql (Supabase)' : self::path();
    }

    /** Quita sintaxis SQLite incompatible con Postgres (p. ej. COLLATE NOCASE). */
    public static function adaptSql(string $sql): string
    {
        if (!self::isPostgres()) {
            return $sql;
        }
        return str_replace(' COLLATE NOCASE', '', $sql);
    }

    public static function path(): string
    {
        return dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'burguar.db';
    }

    public static function connect(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        Env::load();
        $databaseUrl = Env::get('DATABASE_URL', '');
        if ($databaseUrl !== '') {
            if (!in_array('pgsql', PDO::getAvailableDrivers(), true)) {
                throw new RuntimeException(
                    'DATABASE_URL está definida pero PHP no tiene el driver pdo_pgsql. Actívalo en Hostinger o usa la API Python.'
                );
            }
            $parts = parse_url($databaseUrl);
            if ($parts === false || !isset($parts['host'])) {
                throw new RuntimeException('DATABASE_URL no válida');
            }
            $dbname = ltrim((string) ($parts['path'] ?? '/postgres'), '/');
            $port = (int) ($parts['port'] ?? 5432);
            $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s', $parts['host'], $port, $dbname);
            $user = isset($parts['user']) ? urldecode((string) $parts['user']) : '';
            $pass = isset($parts['pass']) ? urldecode((string) $parts['pass']) : '';
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                // Pooler Supabase (:6543): prepared statements nativos fallan en POST/UPSERT.
                PDO::ATTR_EMULATE_PREPARES => true,
            ]);
            self::$pdo = $pdo;
            self::$postgres = true;
            return $pdo;
        }

        $path = self::path();
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            throw new RuntimeException('No se pudo crear el directorio data/');
        }
        $pdo = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $pdo->exec('PRAGMA foreign_keys = ON');
        self::$pdo = $pdo;
        self::$postgres = false;
        return $pdo;
    }

    public static function utcNow(): string
    {
        return gmdate('Y-m-d\TH:i:sP');
    }

    public static function init(): void
    {
        $pdo = self::connect();
        if (self::isPostgres()) {
            self::runPostgresMigration($pdo);
            self::seedIfNeeded($pdo);
            return;
        }
        $pdo->exec(
            <<<'SQL'
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  property_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
SQL
        );
        self::migrateUsers($pdo);
        self::seedIfNeeded($pdo);
        // Tabla de suministros (libro editable web)
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
  a_compte REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  UNIQUE(property_id, year_month)
);
CREATE INDEX IF NOT EXISTS idx_utility_ledger_property ON utility_ledger(property_id, sort_order);
SQL
        );
    }

    private static function runPostgresMigration(PDO $pdo): void
    {
        $file = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'supabase' . DIRECTORY_SEPARATOR
            . 'migrations' . DIRECTORY_SEPARATOR . '001_initial_schema.sql';
        if (!is_file($file)) {
            throw new RuntimeException('Falta supabase/migrations/001_initial_schema.sql');
        }
        $pdo->exec((string) file_get_contents($file));
    }

    private static function migrateUsers(PDO $pdo): void
    {
        $cols = [];
        foreach ($pdo->query('PRAGMA table_info(users)') as $row) {
            $cols[$row['name']] = true;
        }
        if (!isset($cols['role'])) {
            $pdo->exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
        }
        if (!isset($cols['property_id'])) {
            $pdo->exec('ALTER TABLE users ADD COLUMN property_id TEXT');
        }
        if (!isset($cols['last_login_at'])) {
            $pdo->exec('ALTER TABLE users ADD COLUMN last_login_at TEXT');
        }
        self::migrateEmailNullable($pdo);
    }

    /** Permite varios usuarios sin correo (NULL); UNIQUE solo aplica a emails reales. */
    private static function migrateEmailNullable(PDO $pdo): void
    {
        $emailNotNull = false;
        foreach ($pdo->query('PRAGMA table_info(users)') as $row) {
            if (($row['name'] ?? '') === 'email') {
                $emailNotNull = (int) ($row['notnull'] ?? 0) === 1;
                break;
            }
        }
        if (!$emailNotNull) {
            return;
        }

        $pdo->exec('PRAGMA foreign_keys=OFF');
        $pdo->beginTransaction();
        try {
            $pdo->exec(
                <<<'SQL'
CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT UNIQUE COLLATE NOCASE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  property_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);
SQL
            );
            $pdo->exec(
                <<<'SQL'
INSERT INTO users_new (
  id, username, email, display_name, password_hash, role, property_id,
  created_at, updated_at, last_login_at
)
SELECT
  id,
  username,
  CASE
    WHEN id = 'user-burguar-001' THEN 'burguardreams@gmail.com'
    WHEN role = 'user' THEN NULL
    WHEN id = 'user-superadmin-001' THEN NULL
    WHEN trim(COALESCE(email, '')) = '' THEN NULL
    ELSE email
  END,
  display_name,
  password_hash,
  role,
  property_id,
  created_at,
  updated_at,
  last_login_at
FROM users;
SQL
            );
            $pdo->exec('DROP TABLE users');
            $pdo->exec('ALTER TABLE users_new RENAME TO users');
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        } finally {
            $pdo->exec('PRAGMA foreign_keys=ON');
        }
    }

    private static function shouldSyncSeedEmail(string $userId): bool
    {
        return $userId === 'user-burguar-001';
    }

    /** @return string|null */
    private static function normalizeSeedEmail(mixed $email): ?string
    {
        if ($email === null) {
            return null;
        }
        $value = trim((string) $email);
        return $value === '' ? null : $value;
    }

    /** Admin + inquilinos reales (idempotente; sustituye demos antiguos). */
    private static function seedIfNeeded(PDO $pdo): void
    {
        $seeds = [
            [
                'id' => 'user-burguar-001',
                'username' => 'Burguardreams',
                'email' => 'burguardreams@gmail.com',
                'display_name' => 'Burguar Dreams',
                'password' => 'BCNBurguar123++',
                'role' => 'admin',
                'property_id' => null,
            ],
            [
                'id' => 'user-superadmin-001',
                'username' => 'Superadmin',
                'email' => null,
                'display_name' => 'Superadmin',
                'password' => 'BCNBurguar123++',
                'role' => 'superadmin',
                'property_id' => null,
            ],
            [
                'id' => 'user-tenant-emma-sara',
                'username' => 'Emma y Sara',
                'email' => null,
                'display_name' => 'Emma y Sara',
                'password' => '1234',
                'role' => 'user',
                'property_id' => 'prop-urgell',
            ],
            [
                'id' => 'user-tenant-punit',
                'username' => 'Punit',
                'email' => null,
                'display_name' => 'Punit',
                'password' => '1234',
                'role' => 'user',
                'property_id' => 'prop-gran-via',
            ],
            [
                'id' => 'user-tenant-ostap-arina',
                'username' => 'Ostap y Arina',
                'email' => null,
                'display_name' => 'Ostap y Arina',
                'password' => '1234',
                'role' => 'user',
                'property_id' => 'prop-can-bruixa',
            ],
            [
                'id' => 'user-tenant-aida',
                'username' => 'Aida Abuzaid',
                'email' => null,
                'display_name' => 'Aida Abuzaid',
                'password' => '1234',
                'role' => 'user',
                'property_id' => 'prop-valencia',
            ],
        ];

        foreach ($seeds as $user) {
            self::ensureUser($pdo, $user);
        }

        $now = self::utcNow();
        $pdo->prepare(
            'UPDATE users SET email = ?, updated_at = ? WHERE id = ?'
        )->execute(['burguardreams@gmail.com', $now, 'user-burguar-001']);

        // Quitar demos antiguos si siguen en la BD.
        $obsolete = [
            'user-tenant-lucia',
            'user-tenant-marc',
            'user-tenant-sofia',
            'user-tenant-pau',
            'Lucía Mendoza',
            'Marc Vidal',
            'Sofía Navarro',
            'Pau Serra',
        ];
        $delById = $pdo->prepare('DELETE FROM users WHERE id = ? AND role = ?');
        $delByName = $pdo->prepare(self::adaptSql('DELETE FROM users WHERE username = ? COLLATE NOCASE AND role = ?'));
        foreach ($obsolete as $key) {
            if (str_starts_with($key, 'user-')) {
                $delById->execute([$key, 'user']);
            } else {
                $delByName->execute([$key, 'user']);
            }
        }
    }

    /**
     * Inserta si no existe. Si existe, solo sincroniza metadatos (sin PBKDF2).
     * Rehashear en cada request mataba el login en Hostinger (500 vacío).
     *
     * @param array{id:string,username:string,email:?string,display_name:string,password:string,role:string,property_id:?string} $user
     */
    private static function ensureUser(PDO $pdo, array $user): void
    {
        $now = self::utcNow();
        $seedEmail = self::normalizeSeedEmail($user['email'] ?? null);
        $syncEmail = self::shouldSyncSeedEmail($user['id']);
        $stmt = $pdo->prepare(
            self::adaptSql('SELECT id, password_hash FROM users WHERE username = ? COLLATE NOCASE')
        );
        $stmt->execute([$user['username']]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stored = (string) ($existing['password_hash'] ?? '');
            // Sincronizar contraseña de semilla si cambió (p. ej. superadmin).
            if (
                $user['id'] === 'user-superadmin-001'
                && ($stored === '' || !Passwords::verify($user['password'], $stored))
            ) {
                $hash = Passwords::hash($user['password']);
                self::updateExistingUser(
                    $pdo,
                    (string) $existing['id'],
                    $user,
                    $now,
                    $hash,
                    $syncEmail,
                    $seedEmail,
                );
                return;
            }
            // Migrar PBKDF2 legacy → bcrypt (Hostinger mata procesos con 260k iteraciones).
            if (str_starts_with($stored, 'pbkdf2_sha256$') || $stored === '') {
                $hash = Passwords::hash($user['password']);
                self::updateExistingUser(
                    $pdo,
                    (string) $existing['id'],
                    $user,
                    $now,
                    $hash,
                    $syncEmail,
                    $seedEmail,
                );
                return;
            }

            self::updateExistingUser(
                $pdo,
                (string) $existing['id'],
                $user,
                $now,
                null,
                $syncEmail,
                $seedEmail,
            );
            return;
        }

        $hash = Passwords::hash($user['password']);
        $ins = $pdo->prepare(
            'INSERT INTO users (id, username, email, display_name, password_hash, role, property_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $user['id'],
            $user['username'],
            $seedEmail,
            $user['display_name'],
            $hash,
            $user['role'],
            $user['property_id'],
            $now,
            $now,
        ]);
    }

    /**
     * @param array{display_name:string,role:string,property_id:?string} $user
     */
    private static function updateExistingUser(
        PDO $pdo,
        string $id,
        array $user,
        string $now,
        ?string $passwordHash,
        bool $syncEmail,
        ?string $seedEmail,
    ): void {
        if ($passwordHash !== null) {
            if ($syncEmail) {
                $upd = $pdo->prepare(
                    'UPDATE users SET password_hash = ?, email = ?, display_name = ?, role = ?, property_id = ?, updated_at = ? WHERE id = ?'
                );
                $upd->execute([
                    $passwordHash,
                    $seedEmail,
                    $user['display_name'],
                    $user['role'],
                    $user['property_id'],
                    $now,
                    $id,
                ]);
                return;
            }
            $upd = $pdo->prepare(
                'UPDATE users SET password_hash = ?, display_name = ?, role = ?, property_id = ?, updated_at = ? WHERE id = ?'
            );
            $upd->execute([
                $passwordHash,
                $user['display_name'],
                $user['role'],
                $user['property_id'],
                $now,
                $id,
            ]);
            return;
        }

        if ($syncEmail) {
            $upd = $pdo->prepare(
                'UPDATE users SET email = ?, display_name = ?, role = ?, property_id = ?, updated_at = ? WHERE id = ?'
            );
            $upd->execute([
                $seedEmail,
                $user['display_name'],
                $user['role'],
                $user['property_id'],
                $now,
                $id,
            ]);
            return;
        }

        $upd = $pdo->prepare(
            'UPDATE users SET display_name = ?, role = ?, property_id = ?, updated_at = ? WHERE id = ?'
        );
        $upd->execute([
            $user['display_name'],
            $user['role'],
            $user['property_id'],
            $now,
            $id,
        ]);
    }
}