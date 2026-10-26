function getDb() {
  if (window.db) return window.db;
  if (typeof supabase !== 'undefined' && window.SUPABASE_URL && window.SUPABASE_KEY) {
    window.db = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
    return window.db;
  }
  return null;
}

const FIELD_LIMITS = {
  nombre: 120,
  apellidos: 120,
  telefono: 30,
  email: 254,
  situacion_laboral: 80,
  ingresos_mensuales: 80,
  num_personas: 40,
  mascotas: 10,
  property_name: 200,
};

function clearFormErrors() {
  ['error-nombre', 'error-telefono', 'error-privacidad', 'form-global-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function showFormError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.textContent = message;
}

function trimField(id, maxLen) {
  const v = document.getElementById(id)?.value?.trim() || '';
  if (!maxLen) return v;
  return v.slice(0, maxLen);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15 && /^[\d\s+\-().]+$/.test(value);
}

/** Tablas creadas sin IDENTITY en id (bigint): el insert sin id devuelve 23502. */
function provisionalSolicitudId() {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

async function insertSolicitud(db, row) {
  let lastError = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const payload = { ...row, id: provisionalSolicitudId() };
    const { error } = await db.from('solicitudes').insert(payload);
    if (!error) return;
    lastError = error;
    if (error.code === '23505') continue;
    throw error;
  }
  throw lastError || new Error('No se pudo guardar la solicitud');
}

/** URL del correo: proxy same-origin en Netlify (_redirects) o Supabase directo. */
function getResendEmailUrl() {
  if (window.RESEND_EMAIL_URL) return window.RESEND_EMAIL_URL;
  const host = typeof location !== 'undefined' ? location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  const isGithubPages = host.endsWith('.github.io');
  const isNetlify = host.endsWith('.netlify.app');
  if (!isLocal && !isGithubPages && isNetlify && location?.protocol?.startsWith('http')) {
    return `${location.origin}/api/resend-email`;
  }
  return `${window.SUPABASE_URL}/functions/v1/resend-email`;
}

/** Llama a resend-email (Edge Function). Si usas trigger PEGAR-AHORA.sql, pon EMAIL_VIA_TRIGGER_ONLY en config. */
async function notifyResendEmail(row) {
  if (window.EMAIL_VIA_TRIGGER_ONLY) return;
  const key = window.SUPABASE_ANON_KEY || window.SUPABASE_KEY;
  if (!key || !window.SUPABASE_URL) return;
  try {
    const res = await fetch(getResendEmailUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        nombre: row.nombre,
        apellidos: row.apellidos,
        telefono: row.telefono,
        email: row.email,
        fecha_nacimiento: row.fecha_nacimiento,
        situacion_laboral: row.situacion_laboral,
        ingresos_mensuales: row.ingresos_mensuales,
        num_personas: row.num_personas,
        mascotas: row.mascotas,
        property_name: row.property_name,
      }),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { /* HTML u otro formato */ }
    if (!res.ok || !data?.ok) {
      console.warn('[Burguar Dreams] Email no enviado:', res.status, text.slice(0, 300));
    }
  } catch (err) {
    console.warn('[Burguar Dreams] Email no enviado:', err);
  }
}

async function submitForm() {
  clearFormErrors();
  const t = i18n[currentLang] || i18n.es;

  const nombre = trimField('f-nombre', FIELD_LIMITS.nombre);
  const telefono = trimField('f-telefono', FIELD_LIMITS.telefono);
  const email = trimField('f-email', FIELD_LIMITS.email);
  const privacyOk = document.getElementById('f-privacidad')?.checked;

  let hasError = false;
  if (!nombre || nombre.length < 2) {
    showFormError('error-nombre', t.form_error_required);
    hasError = true;
  }
  if (!telefono || !isValidPhone(telefono)) {
    showFormError('error-telefono', telefono ? t.form_error_phone : t.form_error_required);
    hasError = true;
  }
  if (email && !isValidEmail(email)) {
    showFormError('form-global-error', t.form_error_email);
    hasError = true;
  }
  if (!privacyOk) {
    showFormError('error-privacidad', t.form_error_privacy);
    hasError = true;
  }
  if (hasError) {
    if (!nombre || nombre.length < 2) document.getElementById('f-nombre').focus();
    else if (!telefono || !isValidPhone(telefono)) document.getElementById('f-telefono').focus();
    else if (!privacyOk) document.getElementById('f-privacidad').focus();
    return;
  }

  const db = getDb();
  if (!db) {
    showFormError('form-global-error', t.form_error_server);
    return;
  }

  const btn = document.getElementById('btn-send');
  btn.disabled = true;
  btn.textContent = '…';

  const p = currentPropertySlug ? properties.find(x => x.slug === currentPropertySlug) : null;
  const mascotas = document.querySelector('input[name="f-mascotas"]:checked')?.value || 'No';

  const opt = (id, maxLen) => {
    const v = trimField(id, maxLen);
    return v || null;
  };

  const propertyName = p ? `${p.city} — ${p.street}`.slice(0, FIELD_LIMITS.property_name) : null;

  const solicitud = {
    property_id: currentPropertyId || null,
    property_name: propertyName,
    nombre,
    apellidos: opt('f-apellidos', FIELD_LIMITS.apellidos),
    telefono,
    email: email || null,
    fecha_nacimiento: opt('f-nacimiento'),
    situacion_laboral: opt('f-laboral', FIELD_LIMITS.situacion_laboral),
    ingresos_mensuales: opt('f-ingresos', FIELD_LIMITS.ingresos_mensuales),
    num_personas: opt('f-personas', FIELD_LIMITS.num_personas),
    mascotas: mascotas.slice(0, FIELD_LIMITS.mascotas),
  };

  try {
    await insertSolicitud(db, solicitud);
    notifyResendEmail(solicitud);

    document.getElementById('f-privacidad').checked = false;
    document.getElementById('modal-form').classList.add('hidden');
    document.getElementById('modal-success').classList.add('active');
    setTimeout(closeModal, 3000);

  } catch (e) {
    const msg = e?.message || e?.error_description || String(e);
    const code = e?.code || '';
    console.error('[Burguar Dreams] Error guardando solicitud:', {
      code,
      message: msg,
      hint: e?.hint,
      details: e?.details,
    });
    const validationFailed = /invalid nombre|invalid telefono|invalid email/i.test(msg);
    const missingIdDefault = /null value in column "id"/i.test(msg);
    const needsDbSetup =
      !validationFailed &&
      (missingIdDefault ||
        code === '42501' ||
        code === '3F000' ||
        /row-level security/i.test(msg) ||
        /schema "net"/i.test(msg));
    if (needsDbSetup) {
      const sqlHint = missingIdDefault
        ? 'supabase/fix-solicitudes-id.sql (y opcionalmente fix-urgente.sql)'
        : 'supabase/fix-urgente.sql y supabase/validate-solicitudes.sql';
      console.error(
        `[Burguar Dreams] Ejecuta ${sqlHint} en SQL Editor:`,
        'https://supabase.com/dashboard/project/vtwyqhxfuiwjvzgptecb/sql/new'
      );
      showFormError(
        'form-global-error',
        t.form_error_db_setup || t.form_error_generic
      );
    } else {
      showFormError('form-global-error', t.form_error_generic);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = t.btn_send;
  }
}
