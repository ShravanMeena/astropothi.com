// Birth-place lookup.
//
// Google Places when a key is configured (accurate, worldwide, handles villages);
// a bundled index of 296 Indian cities and tirth towns otherwise, so the product
// works on day one with no key and no bill. Results are cached in-process, since
// birth places repeat heavily across a pandit's clients.

import { readFile } from "node:fs/promises";
import path from "node:path";
import axios from "axios";
import tzlookup from "tz-lookup";
import config from "../../config.js";

const REPORTABLE = new Set(["REQUEST_DENIED", "OVER_QUERY_LIMIT", "OVER_DAILY_LIMIT", "UNKNOWN_ERROR"]);
const hasKey = () => Boolean(config.googleMapsKey);

let CITIES = null;
async function cities() {
  if (!CITIES) {
    CITIES = JSON.parse(await readFile(path.join(import.meta.dirname, "cities.json"), "utf8"));
  }
  return CITIES;
}

// Small LRU-ish caches. Google charges per call; birth places repeat constantly.
const acCache = new Map(), geoCache = new Map();
const CACHE_MAX = 2000;
function put(map, k, v) { if (map.size >= CACHE_MAX) map.delete(map.keys().next().value); map.set(k, v); return v; }

/** Attach the IANA zone and the float offset the engine needs. */
export function withTimezone(lat, lon) {
  let timezone = "Asia/Kolkata";
  try { timezone = tzlookup(Number(lat), Number(lon)) || timezone; } catch { /* keep IST */ }
  let tzone = 5.5;
  try {
    const s = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "shortOffset" })
      .formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value || "";
    const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (m) tzone = (m[1] === "-" ? -1 : 1) * (Number(m[2]) + Number(m[3] || 0) / 60);
  } catch { /* keep 5.5 */ }
  return { timezone, tzone };
}

function offlineSearch(list, q) {
  const s = q.toLowerCase();
  const starts = [], contains = [];
  for (const c of list) {
    const n = c.name.toLowerCase();
    if (n.startsWith(s)) starts.push(c);
    else if (n.includes(s) || c.state.toLowerCase().includes(s)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, 8).map((c) => ({
    display_name: `${c.name}, ${c.state}${c.state === "Nepal" ? "" : ", India"}`,
    place_id: `local:${c.name}|${c.state}`,
    lat: c.lat, lon: c.lon, source: "offline"
  }));
}

export async function autocomplete(q) {
  const query = String(q || "").trim();
  if (query.length < 2) return [];
  const key = query.toLowerCase();
  if (acCache.has(key)) return acCache.get(key);

  if (!hasKey()) return put(acCache, key, offlineSearch(await cities(), query));

  try {
    const { data } = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
      params: { input: query, key: config.googleMapsKey, components: "country:in", types: "geocode" },
      timeout: 8000
    });
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      if (REPORTABLE.has(data.status)) console.warn(`[places] ${data.status}`);
      // A bad key or exhausted quota must not break the form.
      return put(acCache, key, offlineSearch(await cities(), query));
    }
    const results = (data.predictions || []).map((p) => ({
      display_name: p.description, place_id: p.place_id, source: "google"
    }));
    return put(acCache, key, results.length ? results : offlineSearch(await cities(), query));
  } catch (e) {
    console.warn("[places] request failed:", e.message);
    return put(acCache, key, offlineSearch(await cities(), query));
  }
}

/** placeId or free-text address → { lat, lon, timezone, tzone } */
export async function geocode({ placeId, address }) {
  const id = String(placeId || "").trim();
  const addr = String(address || "").trim();
  if (!id && !addr) return null;

  if (id.startsWith("local:")) {
    const [name, state] = id.slice(6).split("|");
    const hit = (await cities()).find((c) => c.name === name && c.state === state);
    return hit ? { lat: hit.lat, lon: hit.lon, ...withTimezone(hit.lat, hit.lon) } : null;
  }

  const key = id || addr.toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key);

  if (!hasKey()) {
    const hit = offlineSearch(await cities(), addr)[0];
    return hit ? put(geoCache, key, { lat: hit.lat, lon: hit.lon, ...withTimezone(hit.lat, hit.lon) }) : null;
  }

  try {
    const params = { key: config.googleMapsKey };
    if (id) params.place_id = id; else params.address = addr;
    const { data } = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", { params, timeout: 8000 });
    const loc = data.status === "OK" ? data.results?.[0]?.geometry?.location : null;
    if (!loc) {
      if (data.status && data.status !== "ZERO_RESULTS" && REPORTABLE.has(data.status))
        console.warn(`[geocode] ${data.status}`);
      const hit = offlineSearch(await cities(), addr)[0];
      return hit ? put(geoCache, key, { lat: hit.lat, lon: hit.lon, ...withTimezone(hit.lat, hit.lon) }) : null;
    }
    return put(geoCache, key, { lat: loc.lat, lon: loc.lng, ...withTimezone(loc.lat, loc.lng) });
  } catch (e) {
    console.warn("[geocode] request failed:", e.message);
    return null;
  }
}

export const mode = () => (hasKey() ? "google" : "offline");
