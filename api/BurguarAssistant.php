<?php
declare(strict_types=1);

/**
 * Asistente IA intranet: Groq (recomendado en Hostinger) → Gemini (local) → OpenAI.
 * El cliente envía el contexto operativo (contratos, recibos, tareas…).
 */
final class IntranetAssistant
{
    public static function chat(array $body): array
    {
        Auth::requireAdmin();

        $question = trim((string) ($body['question'] ?? ''));
        if ($question === '') {
            throw new ApiError('missing_question', 400, 'Pregunta obligatoria');
        }

        $locale = trim((string) ($body['locale'] ?? 'es'));
        $clientContext = $body['context'] ?? [];
        if (!is_array($clientContext)) {
            $clientContext = [];
        }

        $history = $body['history'] ?? [];
        if (!is_array($history)) {
            $history = [];
        }

        $merged = AssistantDbContext::mergeContext($clientContext);
        $order = self::providerOrder();
        $contextProfile = ($order !== [] && $order[0] === 'groq') ? 'groq' : 'default';
        if (Env::get('ASSISTANT_PROVIDER') === 'groq') {
            $contextProfile = 'groq';
        }
        $contextJson = AssistantDbContext::serializeContext($merged, $contextProfile);

        $system = self::systemPrompt($locale);

        return self::chatWithFallback($system, $contextJson, $history, $question);
    }

    /** @param list<array<string,mixed>> $history */
    private static function chatWithFallback(
        string $system,
        string $contextJson,
        array $history,
        string $question,
    ): array {
        $order = self::providerOrder();
        if ($order === []) {
            throw new ApiError(
                'assistant_not_configured',
                503,
                'Configura GROQ_API_KEY en public_html/.env (https://console.groq.com/keys) '
                . 'y ASSISTANT_PROVIDER=groq. Gemini ya no se usa en producción.',
            );
        }

        $lastError = null;
        foreach ($order as $name) {
            try {
                if ($name === 'gemini') {
                    $answer = self::chatGemini($system, $contextJson, $history, $question);
                    return ['ok' => true, 'answer' => $answer, 'source' => 'gemini'];
                }
                if ($name === 'groq') {
                    $answer = self::chatOpenAiCompatible(
                        Env::get('GROQ_API_KEY'),
                        'https://api.groq.com/openai/v1/chat/completions',
                        self::resolveGroqModel(),
                        $system,
                        $contextJson,
                        $history,
                        $question,
                    );
                    return ['ok' => true, 'answer' => $answer, 'source' => 'groq'];
                }
                $answer = self::chatOpenAiCompatible(
                    Env::get('OPENAI_API_KEY'),
                    'https://api.openai.com/v1/chat/completions',
                    Env::get('OPENAI_MODEL', 'gpt-4o-mini'),
                    $system,
                    $contextJson,
                    $history,
                    $question,
                );
                return ['ok' => true, 'answer' => $answer, 'source' => 'openai'];
            } catch (ApiError $e) {
                $lastError = $e;
                if (self::shouldTryNextProvider($e, $name, $order)) {
                    error_log('[Renti] ' . $name . ' falló, probando siguiente: ' . $e->getMessage());
                    continue;
                }
                throw $e;
            }
        }

        if ($lastError instanceof ApiError) {
            throw self::enrichHostingerGeminiBlockMessage($lastError);
        }
        throw new ApiError('assistant_not_configured', 503, 'Ningún proveedor IA respondió');
    }

    /** @param list<string> $order */
    private static function shouldTryNextProvider(ApiError $e, string $failed, array $order): bool
    {
        $pos = array_search($failed, $order, true);
        if ($pos === false || $pos >= count($order) - 1) {
            return false;
        }
        $retryable = ['assistant_upstream', 'assistant_transport', 'assistant_empty'];
        if (!in_array($e->errorCode, $retryable, true)) {
            return false;
        }
        $msg = strtolower($e->getMessage());
        if (str_contains($msg, 'no longer available') || str_contains($msg, 'not found')) {
            return true;
        }
        return str_contains($msg, 'timed out')
            || str_contains($msg, 'error de conexión')
            || str_contains($msg, 'connection')
            || str_contains($msg, 'could not resolve')
            || str_contains($msg, 'ssl');
    }

    private static function enrichHostingerGeminiBlockMessage(ApiError $e): ApiError
    {
        $msg = $e->getMessage();
        if (!str_contains(strtolower($msg), 'timed out') && !str_contains(strtolower($msg), 'error de conexión')) {
            return $e;
        }
        if (Env::get('GROQ_API_KEY') !== '') {
            return $e;
        }
        return new ApiError(
            'assistant_upstream',
            502,
            'Desde Hostinger no se puede conectar a Gemini (timeout). Añade **GROQ_API_KEY** gratis en public_html/.env '
            . '(console.groq.com) y opcionalmente ASSISTANT_PROVIDER=groq. Detalle: ' . $msg,
        );
    }

    /** @return list<string> */
    private static function providerOrder(): array
    {
        $pref = strtolower(trim(Env::get('ASSISTANT_PROVIDER', '')));
        if ($pref === '') {
            $pref = Env::get('GROQ_API_KEY') !== '' ? 'groq' : 'auto';
        }

        $groq = Env::get('GROQ_API_KEY') !== '';
        $gemini = Env::get('GEMINI_API_KEY') !== '';
        $openai = Env::get('OPENAI_API_KEY') !== '';

        if ($pref === 'groq') {
            return $groq ? ['groq'] : [];
        }
        if ($pref === 'gemini') {
            return $gemini ? ['gemini'] : [];
        }
        if ($pref === 'openai') {
            return $openai ? ['openai'] : [];
        }

        $order = [];
        if ($groq) {
            $order[] = 'groq';
        }
        if ($gemini) {
            $order[] = 'gemini';
        }
        if ($openai) {
            $order[] = 'openai';
        }
        return $order;
    }

    private static function resolveProvider(): ?string
    {
        $order = self::providerOrder();
        return $order[0] ?? null;
    }

    private static function systemPrompt(string $locale): string
    {
        return <<<SYS
Eres **Renti**, el asistente de gestión de la intranet Burguar Dreams (gestión de alquileres y propiedades).

Idioma de respuesta: el indicado por locale ({$locale}). Si el usuario escribe en catalán, responde en catalán; si en español, en español.

Personalidad y tono (copiloto de gestión, NO chatbot de ayuda):
- Profesional y ejecutivo (gestoría inmobiliaria). Trato formal o de usted.
- Sin emojis ni muletillas («Claro», «¡Genial!», «¿En qué puedo ayudarte?»).
- Primero el dato o la conclusión; después, una línea de contexto si aporta.
- No expliques menús ni pasos de la interfaz salvo que lo pidan; no sustituyas al manual de la web.
- Nunca des una plantilla genérica si puedes calcular la respuesta con los datos.

Datos (lee TODO el JSON antes de responder):
- database: volcado completo de la BD (users, rentalContracts, utilityProvisions, utilityLedger, utilityTenancy, supportTickets…).
- intranet: recibos, facturas, liquidaciones, propiedades, inquilinos, industriales, tareas, notificaciones.
- Prioriza database para contratos y suministros; intranet para finanzas y contactos aún no persistidos.
- Responde cualquier consulta operativa: cuántos contratos activos, qué contrato vence antes, inquilino de una dirección (p. ej. Gran Vía), importes de recibos, suministros de un apartamento, empresa de un contacto industrial, etc.
- **Calcula**: conteos, mínimos de fechas (endDate), sumas, filtros por nombre o dirección.
- **Última conexión** = tenants[].lastLoginAt o portalUsers[].lastLoginAt. **Fin de contrato** = contracts[].endDate.
- **No inventes**. Si falta un dato, dilo con claridad.

Formato:
- Párrafos cortos; listas solo cuando ayuden.
- Usa **negrita** para cifras, nombres y fechas clave.
- No menciones JSON, APIs ni «contexto» al usuario.
- No repitas el manual de ayuda de la web; eres un asistente de datos y gestión, distinto del tutorial.

Cierre opcional: una sola frase formal de seguimiento solo si es útil (p. ej. «¿Desea que revise otro contrato?»).
SYS;
    }

    private static function resolveGeminiModel(): string
    {
        $model = trim(Env::get('GEMINI_MODEL', 'gemini-3.8-flash'));
        if ($model === '') {
            $model = 'gemini-3.8-flash';
        }
        $deprecated = [
            'gemini-2.0-flash',
            'gemini-2.0-flash-001',
            'gemini-2.0-flash-lite',
            'gemini-3-flash-preview',
        ];
        if (in_array($model, $deprecated, true)) {
            return 'gemini-3.8-flash';
        }
        return $model;
    }

    public static function resolveGroqModel(): string
    {
        $model = trim(Env::get('GROQ_MODEL', 'openai/gpt-oss-20b'));
        if ($model === '') {
            $model = 'openai/gpt-oss-20b';
        }
        $legacy = [
            'llama-3.3-70b-versatile',
            'llama-3.3-70b-specdec',
            'llama-3.1-70b-versatile',
            'llama-3.1-70b-specdec',
            'llama3-70b-8192',
            'llama3-8b-8192',
        ];
        if (in_array($model, $legacy, true)) {
            return 'openai/gpt-oss-20b';
        }
        return $model;
    }

    /** @param list<array<string,mixed>> $history */
    private static function chatGemini(
        string $system,
        string $contextJson,
        array $history,
        string $question,
    ): string {
        $apiKey = Env::get('GEMINI_API_KEY');
        $model = self::resolveGeminiModel();
        $url = 'https://generativelanguage.googleapis.com/v1beta/models/'
            . rawurlencode($model)
            . ':generateContent';

        $contents = [];
        $contents[] = [
            'role' => 'user',
            'parts' => [[
                'text' => "Datos actuales de la intranet (úsalos como única fuente de verdad):\n```json\n{$contextJson}\n```",
            ]],
        ];
        $contents[] = [
            'role' => 'model',
            'parts' => [['text' => 'Entendido. Usaré solo esos datos para responder con tono profesional y cercano.']],
        ];

        foreach ($history as $turn) {
            if (!is_array($turn)) {
                continue;
            }
            $role = (string) ($turn['role'] ?? '');
            $content = trim((string) ($turn['content'] ?? ''));
            if ($content === '') {
                continue;
            }
            $geminiRole = $role === 'assistant' ? 'model' : 'user';
            $contents[] = ['role' => $geminiRole, 'parts' => [['text' => $content]]];
        }

        $contents[] = ['role' => 'user', 'parts' => [['text' => $question]]];

        $payload = [
            'system_instruction' => ['parts' => [['text' => $system]]],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.45,
                'maxOutputTokens' => 1400,
            ],
        ];

        $decoded = self::curlJson('POST', $url, [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $apiKey,
        ], $payload);

        $parts = $decoded['candidates'][0]['content']['parts'] ?? [];
        $text = '';
        if (is_array($parts)) {
            foreach ($parts as $part) {
                if (is_array($part) && isset($part['text'])) {
                    $text .= (string) $part['text'];
                }
            }
        }
        $text = trim($text);
        if ($text === '') {
            throw new ApiError('assistant_empty', 502, 'Respuesta vacía de Gemini');
        }
        return $text;
    }

    /** @param list<array<string,mixed>> $history */
    private static function chatOpenAiCompatible(
        string $apiKey,
        string $endpoint,
        string $model,
        string $system,
        string $contextJson,
        array $history,
        string $question,
    ): string {
        $messages = [
            ['role' => 'system', 'content' => $system],
            [
                'role' => 'user',
                'content' => "Datos actuales de la intranet:\n```json\n{$contextJson}\n```",
            ],
            [
                'role' => 'assistant',
                'content' => 'De acuerdo. Responderé solo con esos datos, de forma clara y humana.',
            ],
        ];

        foreach ($history as $turn) {
            if (!is_array($turn)) {
                continue;
            }
            $role = (string) ($turn['role'] ?? '');
            $content = trim((string) ($turn['content'] ?? ''));
            if ($content === '' || ($role !== 'user' && $role !== 'assistant')) {
                continue;
            }
            $messages[] = ['role' => $role, 'content' => $content];
        }

        $messages[] = ['role' => 'user', 'content' => $question];

        $payload = [
            'model' => $model,
            'temperature' => 0.45,
            'max_tokens' => str_contains($endpoint, 'groq.com') ? 900 : 1400,
            'messages' => $messages,
        ];

        $decoded = self::curlJson('POST', $endpoint, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ], $payload);

        $answer = trim((string) ($decoded['choices'][0]['message']['content'] ?? ''));
        if ($answer === '') {
            throw new ApiError('assistant_empty', 502, 'Respuesta vacía del modelo');
        }
        return $answer;
    }

    private static function curlTimeoutSeconds(): int
    {
        // Si hay Groq, no esperar 2 min a Gemini bloqueado en Hostinger.
        if (Env::get('GROQ_API_KEY') !== '') {
            return 28;
        }
        return 120;
    }

    /** @param list<string> $headers */
    /** @param array<string,mixed> $payload */
    private static function curlJson(string $method, string $url, array $headers, array $payload): array
    {
        if (!function_exists('curl_init')) {
            throw new ApiError('assistant_transport', 500, 'cURL no disponible en el servidor');
        }

        $ch = curl_init($url);
        $opts = [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 20,
            CURLOPT_TIMEOUT => self::curlTimeoutSeconds(),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            CURLOPT_ENCODING => '',
        ];
        if (defined('CURLOPT_TCP_KEEPALIVE')) {
            $opts[CURLOPT_TCP_KEEPALIVE] = 1;
        }
        if (defined('CURLOPT_IPRESOLVE') && defined('CURL_IPRESOLVE_V4')) {
            $opts[CURLOPT_IPRESOLVE] = CURL_IPRESOLVE_V4;
        }
        curl_setopt_array($ch, $opts);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            $hint = str_contains($error, 'timed out')
                ? ' (contexto grande o red lenta hacia Google; reintenta en unos segundos)'
                : '';
            throw new ApiError('assistant_upstream', 502, 'Error de conexión: ' . $error . $hint);
        }

        $decoded = json_decode($response, true);
        if (!is_array($decoded)) {
            throw new ApiError('assistant_upstream', 502, 'Respuesta inválida del proveedor IA');
        }

        if ($status < 200 || $status >= 300) {
            $message = (string) ($decoded['error']['message'] ?? $decoded['error']['status'] ?? 'Error del proveedor IA');
            throw new ApiError('assistant_upstream', 502, $message);
        }

        return $decoded;
    }
}
