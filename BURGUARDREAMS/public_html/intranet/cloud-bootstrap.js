const API_BASE = "https://api.rentiagent.com";
const APP_BUNDLE =
  document.querySelector('meta[name="rentia-bundle"]')?.getAttribute("content") ||
  "/assets/index-Ogejj988.js";
const TOKEN_KEY = "intranet.auth.token";
const LAST_USER_KEY = "rentia.cloud.last-user";
const CLOUD_KEYS = [
  "burguar.help.chats.v1",
  "burguar.copilot.chats.v1",
  "burguar.notifications.inbox.v1",
];

const cache = new Map();
const unavailableKeys = new Set();
let activeToken = "";
let activeUserId = "";
let syncing = false;
let appLoaded = false;

function token() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function localRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function headers(currentToken) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${currentToken}`,
    "X-Auth-Token": currentToken,
  };
}

async function currentUserId(currentToken) {
  const response = await fetch(`${API_BASE}/auth/session.php`, {
    headers: headers(currentToken),
    cache: "no-store",
  });
  if (!response.ok) return "";
  const payload = await response.json();
  return String(payload?.user?.id || "");
}

async function saveRemote(currentToken, key, value) {
  return fetch(`${API_BASE}/intranet/client-state`, {
    method: "POST",
    headers: headers(currentToken),
    body: JSON.stringify({ key, value }),
  });
}

async function pullAll(currentToken) {
  let changed = false;
  for (const key of CLOUD_KEYS) {
    try {
      const response = await fetch(
        `${API_BASE}/intranet/client-state?key=${encodeURIComponent(key)}`,
        { headers: headers(currentToken), cache: "no-store" },
      );
      if (!response.ok) {
        unavailableKeys.add(key);
        continue;
      }
      unavailableKeys.delete(key);
      const payload = await response.json();
      const local = localRaw(key);
      if (payload.value === null || payload.value === undefined) {
        if (local !== null && local !== "" && local !== "[]" && local !== "{}") {
          try {
            const upload = await saveRemote(currentToken, key, JSON.parse(local));
            if (upload.ok) {
              cache.set(key, local);
            } else {
              unavailableKeys.add(key);
            }
          } catch {
            unavailableKeys.add(key);
            // El contenido local se conserva para reintentar.
          }
        }
        continue;
      }
      const remoteRaw = JSON.stringify(payload.value);
      if (local !== remoteRaw) {
        localStorage.setItem(key, remoteRaw);
        changed = true;
      }
      cache.set(key, localRaw(key));
    } catch {
      unavailableKeys.add(key);
      // La app debe seguir abriendo aunque falle la sincronización.
    }
  }
  return changed;
}

async function pushChanges(currentToken) {
  if (!currentToken || syncing) return;
  syncing = true;
  try {
    for (const key of CLOUD_KEYS) {
      if (unavailableKeys.has(key)) continue;
      const raw = localRaw(key);
      if (raw === null || cache.get(key) === raw) continue;
      let value;
      try {
        value = JSON.parse(raw);
      } catch {
        continue;
      }
      const response = await saveRemote(currentToken, key, value);
      if (response.ok) cache.set(key, raw);
    }
  } finally {
    syncing = false;
  }
}

async function activate(currentToken) {
  if (!currentToken || currentToken === activeToken) return;
  const userId = await currentUserId(currentToken);
  if (!userId) return;
  const previousUserId = localStorage.getItem(LAST_USER_KEY) || "";
  const switchedUser = previousUserId !== "" && previousUserId !== userId;
  if (switchedUser) {
    for (const key of CLOUD_KEYS) localStorage.removeItem(key);
    cache.clear();
    unavailableKeys.clear();
  }
  activeToken = currentToken;
  activeUserId = userId;
  const changed = await pullAll(currentToken);
  localStorage.setItem(LAST_USER_KEY, userId);
  if (appLoaded && (changed || switchedUser)) {
    location.reload();
    return;
  }
}

const initialToken = token();
if (initialToken) await activate(initialToken);
await import(APP_BUNDLE);
appLoaded = true;

setInterval(async () => {
  const currentToken = token();
  if (!currentToken) {
    activeToken = "";
    activeUserId = "";
    return;
  }
  await activate(currentToken);
  if (unavailableKeys.size > 0) await pullAll(currentToken);
  await pushChanges(currentToken);
}, 2500);
