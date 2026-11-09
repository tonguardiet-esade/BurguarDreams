<?php
declare(strict_types=1);

require_once __DIR__ . '/Db.php';
require_once __DIR__ . '/BurguarAuth.php';
require_once __DIR__ . '/Http.php';

/** Datos que antes solo vivían en memoria/localStorage. */
final class CloudData
{
    private const CLIENT_STATE_KEYS = [
        'burguar.help.chats.v1',
        'burguar.copilot.chats.v1',
        'burguar.notifications.inbox.v1',
    ];

    public static function listTasks(): array
    {
        Auth::requireAdmin();
        self::requirePostgres();
        $pdo = Db::connect();
        $rows = $pdo->query(
            'SELECT * FROM agency_tasks ORDER BY
             CASE status WHEN \'todo\' THEN 1 WHEN \'investigating\' THEN 2 WHEN \'waiting_user\' THEN 3 ELSE 4 END,
             updated_at DESC'
        )->fetchAll(PDO::FETCH_ASSOC);
        return ['ok' => true, 'tasks' => array_map([self::class, 'taskToApi'], $rows)];
    }

    /** @param array<string,mixed> $body */
    public static function saveTask(array $body): array
    {
        $session = Auth::requireAdmin();
        self::requirePostgres();
        $pdo = Db::connect();
        $id = trim((string) ($body['id'] ?? ''));
        if ($id === '') {
            $id = 'task-' . bin2hex(random_bytes(8));
        }
        if (!preg_match('/^[a-zA-Z0-9._-]{1,200}$/', $id)) {
            throw new ApiError('invalid_id', 400, 'Identificador de tarea no válido');
        }
        $title = trim((string) ($body['title'] ?? ''));
        if ($title === '') {
            throw new ApiError('invalid_title', 400, 'La tarea necesita un título');
        }
        $now = Db::utcNow();
        $details = $body;
        foreach (['id', 'title', 'description', 'status', 'priority', 'propertyId', 'assignedContactId', 'dueAt'] as $key) {
            unset($details[$key]);
        }
        $detailsJson = json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: '{}';
        $status = trim((string) ($body['status'] ?? 'todo')) ?: 'todo';
        $completedAt = in_array($status, ['done', 'resolved', 'completed'], true) ? $now : null;
        $userId = (string) ($session['user']['id'] ?? '');

        $stmt = $pdo->prepare(
            'INSERT INTO agency_tasks (
               id, title, description, status, priority, property_id, assigned_contact_id,
               created_by_id, due_at, details_json, created_at, updated_at, completed_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS jsonb), ?, ?, ?)
             ON CONFLICT (id) DO UPDATE SET
               title = EXCLUDED.title,
               description = EXCLUDED.description,
               status = EXCLUDED.status,
               priority = EXCLUDED.priority,
               property_id = EXCLUDED.property_id,
               assigned_contact_id = EXCLUDED.assigned_contact_id,
               due_at = EXCLUDED.due_at,
               details_json = EXCLUDED.details_json,
               updated_at = EXCLUDED.updated_at,
               completed_at = EXCLUDED.completed_at'
        );
        $stmt->execute([
            $id,
            $title,
            (string) ($body['description'] ?? ''),
            $status,
            (string) ($body['priority'] ?? 'normal'),
            self::nullable($body['propertyId'] ?? null),
            self::nullable($body['assignedContactId'] ?? null),
            $userId !== '' ? $userId : null,
            self::nullable($body['dueAt'] ?? null),
            $detailsJson,
            $now,
            $now,
            $completedAt,
        ]);
        self::audit($pdo, $userId, 'upsert', 'agency_task', $id, $body);
        return self::getTask($id);
    }

    public static function deleteTask(string $id): array
    {
        $session = Auth::requireAdmin();
        self::requirePostgres();
        $pdo = Db::connect();
        $stmt = $pdo->prepare('DELETE FROM agency_tasks WHERE id = ?');
        $stmt->execute([$id]);
        self::audit(
            $pdo,
            (string) ($session['user']['id'] ?? ''),
            'delete',
            'agency_task',
            $id,
            null
        );
        return ['ok' => true, 'deleted' => $stmt->rowCount() > 0, 'id' => $id];
    }

    /** @param array<string,mixed> $body */
    public static function addTaskComment(array $body): array
    {
        $session = Auth::requireAdmin();
        self::requirePostgres();
        $taskId = trim((string) ($body['taskId'] ?? ''));
        $text = trim((string) ($body['body'] ?? ''));
        if ($taskId === '' || $text === '') {
            throw new ApiError('invalid_comment', 400, 'Comentario vacío');
        }
        $pdo = Db::connect();
        $user = $session['user'] ?? [];
        $id = 'task-comment-' . bin2hex(random_bytes(8));
        $pdo->prepare(
            'INSERT INTO agency_task_comments (id, task_id, author_id, author_name, body, created_at)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([
            $id,
            $taskId,
            self::nullable($user['id'] ?? null),
            (string) ($user['name'] ?? $user['username'] ?? ''),
            $text,
            Db::utcNow(),
        ]);
        $pdo->prepare('UPDATE agency_tasks SET updated_at = ? WHERE id = ?')
            ->execute([Db::utcNow(), $taskId]);
        return self::getTask($taskId);
    }

    public static function getClientState(string $key): array
    {
        $session = Auth::requireAuth();
        self::assertStateKey($key);
        self::requirePostgres();
        $userId = (string) ($session['user']['id'] ?? '');
        $stmt = Db::connect()->prepare(
            'SELECT payload_json, updated_at FROM user_client_state WHERE user_id = ? AND state_key = ?'
        );
        $stmt->execute([$userId, $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return [
            'ok' => true,
            'key' => $key,
            'value' => $row ? json_decode((string) $row['payload_json'], true) : null,
            'updatedAt' => $row['updated_at'] ?? null,
        ];
    }

    /** @param array<string,mixed> $body */
    public static function saveClientState(array $body): array
    {
        $session = Auth::requireAuth();
        self::requirePostgres();
        $key = trim((string) ($body['key'] ?? ''));
        self::assertStateKey($key);
        $value = $body['value'] ?? null;
        $json = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || strlen($json) > 1024 * 1024) {
            throw new ApiError('invalid_state', 400, 'Estado no válido o demasiado grande');
        }
        $userId = (string) ($session['user']['id'] ?? '');
        $now = Db::utcNow();
        Db::connect()->prepare(
            'INSERT INTO user_client_state (user_id, state_key, payload_json, updated_at)
             VALUES (?, ?, CAST(? AS jsonb), ?)
             ON CONFLICT (user_id, state_key) DO UPDATE SET
               payload_json = EXCLUDED.payload_json,
               updated_at = EXCLUDED.updated_at'
        )->execute([$userId, $key, $json, $now]);
        return ['ok' => true, 'key' => $key, 'value' => $value, 'updatedAt' => $now];
    }

    private static function getTask(string $id): array
    {
        $stmt = Db::connect()->prepare('SELECT * FROM agency_tasks WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiError('not_found', 404, 'Tarea no encontrada');
        }
        $task = self::taskToApi($row);
        $comments = Db::connect()->prepare(
            'SELECT id, task_id, author_id, author_name, body, created_at
             FROM agency_task_comments WHERE task_id = ? ORDER BY created_at'
        );
        $comments->execute([$id]);
        $task['comments'] = $comments->fetchAll(PDO::FETCH_ASSOC);
        return ['ok' => true, 'task' => $task];
    }

    /** @param array<string,mixed> $row @return array<string,mixed> */
    private static function taskToApi(array $row): array
    {
        $details = json_decode((string) ($row['details_json'] ?? '{}'), true);
        return array_merge(is_array($details) ? $details : [], [
            'id' => (string) $row['id'],
            'title' => (string) $row['title'],
            'description' => (string) $row['description'],
            'status' => (string) $row['status'],
            'priority' => (string) $row['priority'],
            'propertyId' => $row['property_id'],
            'assignedContactId' => $row['assigned_contact_id'],
            'dueAt' => $row['due_at'],
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
            'completedAt' => $row['completed_at'],
        ]);
    }

    private static function assertStateKey(string $key): void
    {
        if (!in_array($key, self::CLIENT_STATE_KEYS, true)) {
            throw new ApiError('invalid_state_key', 400, 'Clave de estado no permitida');
        }
    }

    private static function requirePostgres(): void
    {
        Db::init();
        if (!Db::isPostgres()) {
            throw new ApiError('supabase_required', 503, 'Esta función necesita Supabase PostgreSQL');
        }
    }

    private static function nullable(mixed $value): ?string
    {
        $text = trim((string) ($value ?? ''));
        return $text !== '' ? $text : null;
    }

    /** @param array<string,mixed>|null $after */
    private static function audit(
        PDO $pdo,
        string $actorId,
        string $action,
        string $entityType,
        string $entityId,
        ?array $after
    ): void {
        $json = $after === null
            ? null
            : json_encode($after, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $pdo->prepare(
            'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json, created_at)
             VALUES (?, ?, ?, ?, CAST(? AS jsonb), ?)'
        )->execute([
            $actorId !== '' ? $actorId : null,
            $action,
            $entityType,
            $entityId,
            $json,
            Db::utcNow(),
        ]);
    }
}
