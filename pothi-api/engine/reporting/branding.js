import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Neutral by design. There is NO default logo and NO default brand: if the
// pandit has not uploaded one, the report simply carries no mark. Shipping a
// fallback logo on a white-label product means shipping someone else's brand
// to his customer.
export const DEFAULT_BRANDING = {
  companyName: "",
  companyInfo: "",
  logoPath: null,
  logoUrl: null,
  footerLink: "",
  domainUrl: "",
  email: "",
  landline: "",
  mobile: "",
  panditName: "",
  photoUrl: null,
  tagline: "",
  address: "",
  chartStyle: "NORTH_INDIAN"
};

// Merge partial overrides onto the default — any field left undefined falls back to default.
export function mergeBranding(overrides) {
  if (!overrides) return DEFAULT_BRANDING;
  return {
    ...DEFAULT_BRANDING,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([, v]) => v !== undefined && v !== null && v !== "")
    )
  };
}

// Load logo bytes synchronously at render time.
// PDFKit supports PNG and JPEG; SVG is not supported natively, so we skip it.
export async function loadLogoBuffer(branding) {
  // Prefer remote URL if supplied
  if (branding.logoUrl) {
    try {
      const res = await fetch(branding.logoUrl);
      if (!res.ok) return undefined;
      const ct = (res.headers.get("content-type") ?? "").toLowerCase();
      if (ct.includes("svg") || branding.logoUrl.toLowerCase().endsWith(".svg")) {
        // pdfkit cannot embed SVG without an extra library; fall back to default logo on disk.
        if (branding.logoPath) {
          try { return await readFile(branding.logoPath); } catch { return undefined; }
        }
        return undefined;
      }
      return Buffer.from(await res.arrayBuffer());
    } catch {
      // Fallback to local logo on network failure
      if (branding.logoPath) {
        try { return await readFile(branding.logoPath); } catch { return undefined; }
      }
      return undefined;
    }
  }
  if (branding.logoPath) {
    try { return await readFile(branding.logoPath); } catch { return undefined; }
  }
  return undefined;
}
