// Which reports are actually on sale right now.
//
// catalog.js `ready` is the default; report_status rows override it. Cached the
// same way and for the same reason as prices — this is read on every catalogue
// request and changes a few times a year.

import db from "../../database/index.js";
import { REPORT_TYPES } from "./catalog.js";

let cache = null, cachedAt = 0;
const TTL = 30_000;

export function bustStatusCache() { cache = null; }

/** { code → boolean }, the catalogue default unless an override says otherwise. */
export async function sellableMap() {
  if (cache && Date.now() - cachedAt < TTL) return cache;
  const rows = await db.ReportStatus.findAll();
  const map = Object.fromEntries(REPORT_TYPES.map((r) => [r.code, Boolean(r.ready)]));
  for (const r of rows) map[r.report_type] = Boolean(r.sellable);
  cache = map; cachedAt = Date.now();
  return map;
}

export async function isSellable(code) {
  return Boolean((await sellableMap())[code]);
}

/**
 * The catalogue as a buyer should see it.
 *
 * Async, unlike catalog.js's consumerCatalogue(), because it has to read the
 * overrides. Callers that used the synchronous one were only ever right when no
 * report had been pulled.
 */
export async function sellableReports() {
  const map = await sellableMap();
  return REPORT_TYPES.filter((r) => map[r.code]);
}
