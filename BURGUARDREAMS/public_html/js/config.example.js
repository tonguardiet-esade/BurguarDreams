/* Copy to js/config.js or run: python3 scripts/generate_config.py */
window.SUPABASE_URL = "https://your-project.supabase.co";
window.SUPABASE_KEY = "your_publishable_key_here";
/* Google Analytics 4 (opcional): ID tipo G-XXXXXXXXXX; solo se carga si el usuario acepta cookies */
window.GA_MEASUREMENT_ID = "";
/* Opcional si resend-email exige JWT: window.SUPABASE_ANON_KEY = "eyJ..."; */
/* Solo trigger SQL (PEGAR-AHORA.sql), sin llamada desde el navegador: window.EMAIL_VIA_TRIGGER_ONLY = true; */
/* Forzar URL del correo (p. ej. proxy Netlify): window.RESEND_EMAIL_URL = "/api/resend-email"; */
if (typeof supabase === "undefined") {
  console.error("[Burguar Dreams] No se cargó el SDK de Supabase (CDN bloqueado o sin conexión).");
} else {
  window.db = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
}
let currentPropertyId = null;
let currentPropertySlug = null;
