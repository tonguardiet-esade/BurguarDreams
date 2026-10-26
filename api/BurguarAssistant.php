<?php
declare(strict_types=1);

/**
 * Asistente IA intranet: Gemini (gratis) → Groq (gratis) → OpenAI.
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
        $context = $body['context'] ?? [];
        if (!is_array($context)) {
            $context = [];
        }

        $history = $body['history'] ?? [];
        if (!is_array($history)) {
            $history = [];
        }

        $contextJson = json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($contextJson === false) {
            $contextJson = '{}';
        }
        if (strlen($contextJson) > 32000) {
            $contextJson = substr($contextJson, 0, 32000) . '…';
        }

        $system = self::systemPrompt($locale);
        $provider = self::resolveProvider();

        if ($provider === null) {
            throw new ApiError('assistant_not_configured', 503, 'Configura GEMINI_API_KEY, GROQ_API_KEY u OPENAI_API_KEY en .env');
        }

        if ($provider === 'gemini') {
            $answer = self::chatGemini($system, $contextJson, $history, $question);
            return ['ok' => true, 'answer' => $answer, 'source' => 'gemini'];
        }
        if ($provider === 'groq') {
            $answer = self::chatOpenAiCompatible(
                Env::get('GROQ_API_KEY'),
                'https://api.groq.com/openai/v1/chat/completions',
                Env::get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
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
    }

    private static function resolveProvider(): ?string
    {
        if (Env::get('GEMINI_API_KEY') !== '') {
            return 'gemini';
        }
        if (Env::get('GROQ_API_KEY') !== '') {
            return 'groq';
        }
        if (Env::get('OPENAI_API_KEY') !== '') {
            return 'openai';
        }
        return null;
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

Datos:
- Usa **solo** el JSON de contexto que recibirás (contratos, recibos, facturas, agencyTasks con tenantName, inquilinos con lastLoginAt, portalUsers, propiedades, notificaciones).
- Si piden tareas de un inquilino concreto, filtra agencyTasks por tenantName/tenantId; no mezcles otros inquilinos.
- **Última conexión** al portal/intranet = tenants[].lastLoginAt o portalUsers[].lastLoginAt. **Fin de contrato** = contracts[].endDate. No mezcles ambos conceptos.
- **No inventes** importes, fechas ni nombres. Si falta un dato, dilo con claridad y sugiere dónde mirarlo en la intranet.
- Para preguntas numéricas (p. ej. «¿algún recibo supera X euros?»), **calcula** comparando importes del contexto y responde sí/no con cifras concretas.

Formato:
- Párrafos cortos; listas solo cuando ayuden.
- Usa **negrita** para cifras, nombres y fechas clave.
- No menciones JSON, APIs ni «contexto» al usuario.
- No repitas el manual de ayuda de la web; eres un asistente de datos y gestión, distinto del tutorial.

Cierre opcional: una sola frase formal de seguimiento solo si es útil (p. ej. «¿Desea que revise otro contrato?»).
SYS;
    }

    /** @param list<array<string,mixed>> $history */
    private static function chatGemini(
        string $system,
        string $contextJson,
        array $history,
        string $question,
    ): string {
        $apiKey = Env::get('GEMINI_API_KEY');
        $model = Env::get('GEMINI_MODEL', 'gemini-2.0-flash');
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
            'max_tokens' => 1400,
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

    /** @param list<string> $headers */
    /** @param array<string,mixed> $payload */
    private static function curlJson(string $method, string $url, array $headers, array $payload): array
    {
        if (!function_exists('curl_init')) {
            throw new ApiError('assistant_transport', 500, 'cURL no disponible en el servidor');
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 55,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        $response = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            throw new ApiError('assistant_upstream', 502, 'Error de conexión: ' . $error);
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
