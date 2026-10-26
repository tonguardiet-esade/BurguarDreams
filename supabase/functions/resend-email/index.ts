const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function esc(s: unknown): string {
  if (s == null || s === "") return "—";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    const notifyEmail = Deno.env.get("NOTIFY_EMAIL");
    const from =
      Deno.env.get("RESEND_FROM") ?? "Burguar Dreams <onboarding@resend.dev>";

    if (!apiKey || !notifyEmail) {
      return jsonResponse({ error: "Faltan secretos en Supabase" }, 500);
    }

    const body = await req.json();
    const {
      nombre,
      telefono,
      property_name,
      email,
      apellidos,
      fecha_nacimiento,
      situacion_laboral,
      ingresos_mensuales,
      num_personas,
      mascotas,
    } = body;

    if (!nombre || !telefono) {
      return jsonResponse({ error: "nombre y telefono obligatorios" }, 400);
    }

    const html = `
      <h2>Nueva solicitud — Burguar Dreams</h2>
      <p><strong>Propiedad:</strong> ${esc(property_name)}</p>
      <p><strong>Nombre:</strong> ${esc(nombre)} ${esc(apellidos)}</p>
      <p><strong>Teléfono:</strong> ${esc(telefono)}</p>
      <p><strong>Email:</strong> ${esc(email)}</p>
      <p><strong>Fecha nacimiento:</strong> ${esc(fecha_nacimiento)}</p>
      <p><strong>Situación laboral:</strong> ${esc(situacion_laboral)}</p>
      <p><strong>Ingresos:</strong> ${esc(ingresos_mensuales)}</p>
      <p><strong>Personas:</strong> ${esc(num_personas)}</p>
      <p><strong>Mascotas:</strong> ${esc(mascotas)}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [notifyEmail],
        subject: `Nueva solicitud: ${nombre} — ${property_name ?? "web"}`,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return jsonResponse({ error: "Error enviando email" }, 502);
    }

    return jsonResponse({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonResponse({ error: "Error interno" }, 500);
  }
});
