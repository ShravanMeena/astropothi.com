// The admin token is stored under its own key, never alongside the pandit one.
//
// Same reason the server gives it its own `kind`: two tokens in one slot means
// one of them eventually gets sent to the wrong namespace, and the failure is
// silent — a 403 that looks like a bug rather than a boundary doing its job.
const ADMIN_KEY = "pothi.admin.token";

export const getAdminToken = () => localStorage.getItem(ADMIN_KEY);
export const setAdminToken = (t: string) => localStorage.setItem(ADMIN_KEY, t);
export const clearAdminToken = () => localStorage.removeItem(ADMIN_KEY);

async function call(path: string, opts: RequestInit = {}) {
  const token = getAdminToken();
  const res = await fetch(`/admin-api/v1${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...opts.headers
    }
  });
  const body = await res.json().catch(() => null);
  // A null body from this namespace almost always means the Vite proxy has no
  // entry for /admin-api and handed back index.html with a 200 — the exact bug
  // that once made the pandit console render blank. Say so instead of "HTTP 200".
  if (body === null)
    throw Object.assign(new Error(`No JSON from ${path} (HTTP ${res.status}) — is /admin-api proxied in vite.config.ts?`), { status: res.status });
  if (!res.ok || body.success === false)
    throw Object.assign(new Error(body.message || `HTTP ${res.status}`), { status: res.status, body });
  return body.results;
}

export const adminApi = {
  get:  (p: string) => call(p),
  post: (p: string, b?: unknown) => call(p, { method: "POST", body: JSON.stringify(b ?? {}) }),
  put:  (p: string, b?: unknown) => call(p, { method: "PUT",  body: JSON.stringify(b ?? {}) }),
  del:  (p: string) => call(p, { method: "DELETE" })
};

// ── Formatting ───────────────────────────────────────────────────────────────
// Paise are integers everywhere in this system. Dividing before formatting is
// the only place they can lose precision, so it happens once, here.
export const rupees = (paise: number | null | undefined) => {
  if (paise === null || paise === undefined) return "—";
  const n = paise / 100;
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2
  });
};

export const num = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n.toLocaleString("en-IN");

export const pct = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : `${n}%`;

export const ms = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : n >= 1000 ? `${(n / 1000).toFixed(2)}s` : `${n}ms`;

/**
 * A human duration from a number of SECONDS. "83738.00s" was unreadable; this
 * reads it back as 23h. Rounds to the largest sensible unit and drops the
 * decimals — a dwell table is a shape, not a stopwatch.
 */
export const dur = (seconds: number | null | undefined) => {
  if (seconds === null || seconds === undefined) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) { const h = Math.floor(s / 3600); const m = Math.round((s % 3600) / 60); return m ? `${h}h ${m}m` : `${h}h`; }
  return `${Math.round(s / 86400)}d`;
};

/** IST, because every date in this panel is an Indian business date. */
export const when = (iso: string | null | undefined, withTime = true) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "short", year: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {})
  });
};

export const ago = (iso: string | null | undefined) => {
  if (!iso) return "never";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return when(iso, false);
};
