const TOKEN_KEY = "pothi.token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function call(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(path, {
    ...opts,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...opts.headers
    }
  });
  const body = await res.json().catch(() => null);
  if (body === null) {
    throw Object.assign(new Error(`Bad response from ${path} (HTTP ${res.status})`), { status: res.status });
  }
  if (!res.ok || body.success === false) {
    throw Object.assign(new Error(body.message || `HTTP ${res.status}`), { status: res.status, body });
  }
  return body.results;
}

export const api = {
  get:  (p: string) => call(p),
  post: (p: string, b: unknown) => call(p, { method: "POST", body: JSON.stringify(b) }),
  put:  (p: string, b: unknown) => call(p, { method: "PUT",  body: JSON.stringify(b) })
};

export const rupees = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
