import { useCallback, useEffect, useState } from "react";

const KEY = "pothi.user.token";

export const getUserToken = () => localStorage.getItem(KEY);
export const setUserToken = (t: string) => { localStorage.setItem(KEY, t); ping(); };
export const clearUserToken = () => { localStorage.removeItem(KEY); ping(); };

// Sign-in happens inside a modal that any screen can open, so every screen has
// to hear about it. A plain event beats threading a callback through the tree.
const EVT = "pothi:auth";
const ping = () => window.dispatchEvent(new Event(EVT));

async function call(path: string, opts: RequestInit = {}) {
  const token = getUserToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...opts.headers
    }
  });
  const body = await res.json().catch(() => null);
  if (body === null) throw new Error(`Bad response from ${path} (HTTP ${res.status})`);
  if (!res.ok || body.success === false) {
    // A dead token should log the buyer out rather than leave them stuck on a
    // profile page that will never load.
    if (res.status === 401 || res.status === 403) clearUserToken();
    throw Object.assign(new Error(body.message || `HTTP ${res.status}`), { status: res.status, body });
  }
  return body.results;
}

export const userApi = {
  get: (p: string) => call(p),
  put: (p: string, b: unknown) => call(p, { method: "PUT", body: JSON.stringify(b) })
};

export type BuyerProfile = {
  id: string; phone: string; name: string; email: string;
  birth: { name?: string; dob?: string; tob?: string; pob?: string } | null;
  profile: {
    ishta_devta?: string; tradition?: string; gotra?: string; city?: string;
    languages?: string[]; interests?: string[]; practices?: string[];
    looking_for?: string; notes?: string;
  };
};
export type BuyerOrder = {
  public_id: string; status: string; report_type: string; design: string; palette: string;
  language: string; amount_paise: number; invoice_no: string | null; created_at: string;
  subject_name: string | null; pdf_url: string | null; page_count: number | null;
  pay_url: string | null;
};

/** Whether somebody is signed in, kept in step across every screen. */
export function useSignedIn() {
  const [on, setOn] = useState(() => !!getUserToken());
  useEffect(() => {
    const sync = () => setOn(!!getUserToken());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);   // and across tabs
    return () => { window.removeEventListener(EVT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return on;
}

export function useMe() {
  const signedIn = useSignedIn();
  const [data, setData] = useState<{ user: BuyerProfile; orders: BuyerOrder[] } | null>(null);
  const [err, setErr] = useState("");

  const reload = useCallback(() => {
    if (!getUserToken()) { setData(null); return; }
    userApi.get("/user-api/v1/me").then(setData).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => { setErr(""); reload(); }, [signedIn, reload]);
  return { signedIn, data, err, reload };
}
