async function call(path: string, opts: RequestInit = {}) {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...opts });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false)
    throw Object.assign(new Error(body.message || `HTTP ${res.status}`), { status: res.status, body });
  return body.results;
}
export const api = {
  get:  (p: string) => call(p),
  post: (p: string, b: unknown) => call(p, { method: "POST", body: JSON.stringify(b) })
};
export const rupees = (paise: number) =>
  "₹" + (paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export type ReportItem = {
  code: string; name_en: string; name_hi: string; chapters: number; price_paise: number;
  /** "person" wants birth details; "property" wants a facing and a room layout. */
  subject?: "person" | "property";
  /** The colourway the shop shows this report in. Server-owned so the boot
   *  warmer pre-renders exactly the cover the storefront will request. */
  cover_palette?: string;
};
export type Design = {
  id: string; name: { en: string; hi: string }; tagline: { en: string; hi: string };
  traits: { chapterOpen: string; columns: number; ornament: boolean; density: string };
};
export type Palette = { id: string; name: { en: string; hi: string }; swatch: string[] };
export type OrderStatus = {
  public_id: string; status: string; report_type: string;
  report_name_en?: string; design: string; palette: string;
  language: string; amount_paise: number; invoice_no: string | null;
  pdf_url: string | null; page_count: number | null;
};
