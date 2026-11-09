window.SUPABASE_URL = "https://vtwyqhxfuiwjvzgptecb.supabase.co";
window.SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d3lxaHhmdWl3anZ6Z3B0ZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzIzOTIsImV4cCI6MjA5Mzc0ODM5Mn0.EUW6HO9jS7EESbklym6qQe7kIRRZRbjCT_3O-nrH9q0";
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0d3lxaHhmdWl3anZ6Z3B0ZWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNzIzOTIsImV4cCI6MjA5Mzc0ODM5Mn0.EUW6HO9jS7EESbklym6qQe7kIRRZRbjCT_3O-nrH9q0";
window.RESEND_EMAIL_URL = "https://vtwyqhxfuiwjvzgptecb.supabase.co/functions/v1/resend-email";
window.GA_MEASUREMENT_ID = "";
/* Subir este valor tras sustituir imágenes, vídeos, CSS o JS estáticos.
   Se añade como ?v= a las URLs de assets para invalidar caché del navegador. */
window.ASSET_VERSION = "20261016a";
if (typeof supabase === "undefined") {
  console.error("[Burguar Dreams] No se cargó el SDK de Supabase (CDN bloqueado o sin conexión).");
} else {
  window.db = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
}
let currentPropertyId = null;
let currentPropertySlug = null;
