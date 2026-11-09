<?php
declare(strict_types=1);

/**
 * Tickets de soporte (PostgreSQL / Supabase). Paridad con tickets_api.py.
 */
final class SupportTickets
{
    private const STATUSES = ['todo', 'investigating', 'waiting_user', 'resolved'];
    private const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
    private const CATEGORIES = ['general', 'technical', 'billing', 'property', 'access', 'other'];

    /** @var array<string, string> */
    private const PROPERTY_LABELS = [
        'prop-urgell' => 'Urgell — Francesc Macià',
        'prop-gran-via' => 'Gran Via',
        'prop-can-bruixa' => 'Can Bruixa',
        'prop-valencia' => 'València',
    ];

    private static function ensureSchema(PDO $pdo): void
    {
        $pdo->exec(
            <<<'SQL'
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  category TEXT NOT NULL DEFAULT 'general',
  property_id TEXT,
  created_by_id TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  assignee_id TEXT,
  assignee_name TEXT,
  attachments_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  is_internal INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_support_comments_ticket ON support_ticket_comments(ticket_id);
SQL
        );
    }

    public static function listAll(array $viewer): array
    {
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);
        self::seedIfEmpty($pdo);
        $stmt = $pdo->query('SELECT * FROM support_tickets ORDER BY updated_at DESC');

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $tickets = [];
        foreach ($rows as $row) {
            $tickets[] = self::rowToTicket($pdo, $row, $viewer);
        }
        return ['ok' => true, 'tickets' => $tickets];
    }

    public static function getById(string $id, array $viewer): array
    {
        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);
        self::seedIfEmpty($pdo);
        $stmt = $pdo->prepare('SELECT * FROM support_tickets WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiError('not_found', 404, 'Ticket no encontrado');
        }
        return ['ok' => true, 'ticket' => self::rowToTicket($pdo, $row, $viewer)];
    }

    /** @param array<string, mixed> $body */
    public static function create(array $body, array $viewer): array
    {
        $user = $viewer['user'] ?? [];
        $title = trim((string) ($body['title'] ?? ''));
        $description = trim((string) ($body['description'] ?? ''));
        if (strlen($title) < 3) {
            throw new ApiError('invalid_title', 400, 'Indica un título (mín. 3 caracteres)');
        }
        if (strlen($description) < 10) {
            throw new ApiError('invalid_description', 400, 'Describe el problema (mín. 10 caracteres)');
        }
        $priority = (string) ($body['priority'] ?? 'normal');
        $category = (string) ($body['category'] ?? 'general');
        if (!in_array($priority, self::PRIORITIES, true)) {
            $priority = 'normal';
        }
        if (!in_array($category, self::CATEGORIES, true)) {
            $category = 'general';
        }
        $propertyId = isset($body['propertyId']) ? trim((string) $body['propertyId']) : '';
        if ($propertyId !== '' && !isset(self::PROPERTY_LABELS[$propertyId])) {
            $propertyId = '';
        }
        $attachments = self::attachmentsFromBody($body['attachments'] ?? null);

        Db::init();
        $pdo = Db::connect();
        self::ensureSchema($pdo);
        self::seedIfEmpty($pdo);
        $now = Db::utcNow();
        $id = 'ticket-' . bin2hex(random_bytes(8));
        $number = self::nextNumber($pdo);
        $createdByName = (string) ($user['name'] ?? $user['username'] ?? 'Admin');

        $ins = $pdo->prepare(
            'INSERT INTO support_tickets (
              id, number, title, description, status, priority, category,
              property_id, created_by_id, created_by_name, assignee_id, assignee_name,
              attachments_json, created_at, updated_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, NULL)',
        );
        $ins->execute([
            $id,
            $number,
            $title,
            $description,
            'todo',
            $priority,
            $category,
            $propertyId !== '' ? $propertyId : null,
            (string) ($user['id'] ?? ''),
            $createdByName,
            json_encode($attachments, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            $now,
            $now,
        ]);

        return self::getById($id, $viewer);
    }

    /** @param array<string, mixed> $body */
    public static function updateStatus(array $body, array $viewer): array
    {
        self::requireSuperadmin($viewer);
        $id = trim((string) ($body['id'] ?? ''));
        $status = trim((string) ($body['status'] ?? ''));
        if ($id === '' || !in_array($status, self::STATUSES, true)) {
            throw new ApiError('invalid_payload', 400, 'Datos de ticket no válidos');
        }
        Db::init();
        $pdo = Db::connect();
        $now = Db::utcNow();
        $resolvedAt = $status === 'resolved' ? $now : null;
        $upd = $pdo->prepare(
            'UPDATE support_tickets SET status = ?, updated_at = ?, resolved_at = ? WHERE id = ?',
        );
        $upd->execute([$status, $now, $resolvedAt, $id]);
        if ($upd->rowCount() === 0) {
            throw new ApiError('not_found', 404, 'Ticket no encontrado');
        }
        return self::getById($id, $viewer);
    }

    public static function delete(string $id, array $viewer): array
    {
        self::requireSuperadmin($viewer);
        $id = trim($id);
        if ($id === '') {
            throw new ApiError('invalid_payload', 400, 'Indica el ticket a eliminar');
        }
        Db::init();
        $pdo = Db::connect();
        $del = $pdo->prepare('DELETE FROM support_tickets WHERE id = ?');
        $del->execute([$id]);
        if ($del->rowCount() === 0) {
            throw new ApiError('not_found', 404, 'Ticket no encontrado');
        }
        return ['ok' => true, 'deletedId' => $id];
    }

    /** @param array<string, mixed> $body */
    public static function addComment(array $body, array $viewer): array
    {
        $user = $viewer['user'] ?? [];
        $ticketId = trim((string) ($body['ticketId'] ?? ''));
        $text = trim((string) ($body['body'] ?? ''));
        $isInternal = (bool) ($body['isInternal'] ?? false);
        if ($ticketId === '' || $text === '') {
            throw new ApiError('invalid_payload', 400, 'Comentario vacío');
        }
        if ($isInternal && !self::isSuperadmin($viewer)) {
            throw new ApiError('forbidden', 403, 'Notas internas solo para superadmin');
        }
        Db::init();
        $pdo = Db::connect();
        $exists = $pdo->prepare('SELECT id FROM support_tickets WHERE id = ?');
        $exists->execute([$ticketId]);
        if (!$exists->fetch()) {
            throw new ApiError('not_found', 404, 'Ticket no encontrado');
        }
        $now = Db::utcNow();
        $cid = 'comment-' . bin2hex(random_bytes(8));
        $ins = $pdo->prepare(
            'INSERT INTO support_ticket_comments (
              id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        );
        $ins->execute([
            $cid,
            $ticketId,
            (string) ($user['id'] ?? ''),
            (string) ($user['name'] ?? $user['username'] ?? ''),
            (string) ($user['role'] ?? 'admin'),
            $text,
            Db::isPostgres() ? $isInternal : ($isInternal ? 1 : 0),
            $now,
        ]);
        $pdo->prepare('UPDATE support_tickets SET updated_at = ? WHERE id = ?')->execute([$now, $ticketId]);
        return self::getById($ticketId, $viewer);
    }

    private static function requireSuperadmin(array $session): void
    {
        if (!self::isSuperadmin($session)) {
            throw new ApiError('forbidden', 403, 'Solo el superadmin puede realizar esta acción');
        }
    }

    private static function isSuperadmin(array $session): bool
    {
        $user = $session['user'] ?? [];
        $role = (string) ($user['role'] ?? '');
        if ($role === 'superadmin') {
            return true;
        }
        return (string) ($user['id'] ?? '') === 'user-superadmin-001';
    }

    private static function seedIfEmpty(PDO $pdo): void
    {
        $count = (int) $pdo->query('SELECT COUNT(*) FROM support_tickets')->fetchColumn();
        if ($count > 0) {
            return;
        }
        $now = Db::utcNow();
        $ticketId = 'ticket-seed-1';
        $pdo->prepare(
            'INSERT INTO support_tickets (
              id, number, title, description, status, priority, category,
              property_id, created_by_id, created_by_name, assignee_id, assignee_name,
              attachments_json, created_at, updated_at, resolved_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, NULL)',
        )->execute([
            $ticketId,
            'SUP-001',
            'Acceso al panel de suministros',
            'Al entrar en Suministros desde móvil la tabla no se ve completa.',
            'investigating',
            'normal',
            'technical',
            'user-burguar-001',
            'Burguardreams',
            'user-superadmin-001',
            'Superadmin',
            '[]',
            $now,
            $now,
        ]);
        $pdo->prepare(
            'INSERT INTO support_ticket_comments (
              id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            'comment-seed-1',
            $ticketId,
            'user-superadmin-001',
            'Superadmin',
            'superadmin',
            'Reproducido en iPhone. Probando scroll horizontal.',
            1,
            $now,
        ]);
    }

    private static function nextNumber(PDO $pdo): string
    {
        $row = $pdo->query('SELECT number FROM support_tickets ORDER BY created_at DESC LIMIT 1')->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            return 'SUP-001';
        }
        $text = (string) $row['number'];
        $parts = explode('-', $text);
        $seq = (int) ($parts[count($parts) - 1] ?? 0);
        return sprintf('SUP-%03d', $seq + 1);
    }

    /** @param array<string, mixed> $row */
    private static function rowToTicket(PDO $pdo, array $row, array $viewer): array
    {
        $propertyId = $row['property_id'] !== null ? (string) $row['property_id'] : null;
        $attachments = json_decode((string) ($row['attachments_json'] ?? '[]'), true);
        if (!is_array($attachments)) {
            $attachments = [];
        }
        return [
            'id' => (string) $row['id'],
            'number' => (string) $row['number'],
            'title' => (string) $row['title'],
            'description' => (string) $row['description'],
            'status' => (string) $row['status'],
            'priority' => (string) $row['priority'],
            'category' => (string) $row['category'],
            'propertyId' => $propertyId,
            'propertyLabel' => $propertyId !== null ? (self::PROPERTY_LABELS[$propertyId] ?? null) : null,
            'createdById' => (string) $row['created_by_id'],
            'createdByName' => (string) $row['created_by_name'],
            'assigneeId' => $row['assignee_id'] !== null ? (string) $row['assignee_id'] : null,
            'assigneeName' => $row['assignee_name'] !== null ? (string) $row['assignee_name'] : null,
            'attachments' => $attachments,
            'comments' => self::loadComments($pdo, (string) $row['id'], $viewer),
            'createdAt' => (string) $row['created_at'],
            'updatedAt' => (string) $row['updated_at'],
            'resolvedAt' => $row['resolved_at'] !== null ? (string) $row['resolved_at'] : null,
        ];
    }

    /** @return list<array<string, mixed>> */
    private static function loadComments(PDO $pdo, string $ticketId, array $viewer): array
    {
        $stmt = $pdo->prepare(
            'SELECT id, ticket_id, author_id, author_name, author_role, body, is_internal, created_at
             FROM support_ticket_comments
             WHERE ticket_id = ?
             ORDER BY created_at ASC',
        );
        $stmt->execute([$ticketId]);
        $superadmin = self::isSuperadmin($viewer);
        $comments = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $internal = (bool) $row['is_internal'];
            if ($internal && !$superadmin) {
                continue;
            }
            $comments[] = [
                'id' => (string) $row['id'],
                'ticketId' => (string) $row['ticket_id'],
                'authorId' => (string) $row['author_id'],
                'authorName' => (string) $row['author_name'],
                'authorRole' => (string) $row['author_role'],
                'body' => (string) $row['body'],
                'isInternal' => $internal,
                'createdAt' => (string) $row['created_at'],
            ];
        }
        return $comments;
    }

    /** @return list<array<string, mixed>> */
    private static function attachmentsFromBody(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }
        $out = [];
        $total = 0;
        foreach ($raw as $item) {
            if (!is_array($item)) {
                continue;
            }
            $name = substr(trim((string) ($item['name'] ?? 'archivo')), 0, 200);
            $mime = substr(trim((string) ($item['mimeType'] ?? 'application/octet-stream')), 0, 120);
            $dataB64 = trim((string) ($item['dataBase64'] ?? ''));
            if ($dataB64 === '') {
                continue;
            }
            $rawBytes = base64_decode($dataB64, true);
            if ($rawBytes === false) {
                throw new ApiError('invalid_attachment', 400, 'Adjunto no válido');
            }
            if (strlen($rawBytes) > 2 * 1024 * 1024) {
                throw new ApiError('attachment_too_large', 400, 'Cada adjunto máximo 2 MB');
            }
            $total += strlen($rawBytes);
            if ($total > 6 * 1024 * 1024) {
                throw new ApiError('attachment_too_large', 400, 'Adjuntos demasiado grandes en total');
            }
            $out[] = [
                'id' => 'att-' . bin2hex(random_bytes(6)),
                'name' => $name,
                'mimeType' => $mime,
                'size' => strlen($rawBytes),
                'url' => 'data:' . $mime . ';base64,' . base64_encode($rawBytes),
            ];
            if (count($out) >= 8) {
                break;
            }
        }
        return $out;
    }
}
