import { api } from "./api";

/**
 * The free check's answer, and the birth details that produced it.
 *
 * Stashed in sessionStorage so checkout can prefill from it. Somebody who has
 * just typed their date, time and place to get an answer should not be asked
 * for the same three fields again two clicks later — that re-entry is where the
 * funnel currently loses people: nine devices reached checkout in thirty days
 * and three pressed pay.
 *
 * sessionStorage, not localStorage: a birth time is not something to leave on a
 * shared phone after the tab closes.
 */
const KEY = "pothi.chartcheck";

export type ChartCheckResult = {
  /** False when the visitor said they do not know their birth time. */
  time_known: boolean;
  chart: { moon_sign: string | null; nakshatra: string | null; ascendant: string | null; place: string };
  /** Only present when the time is unknown — the numbers that explain why. */
  why?: { ascendant_signs_in_a_day: number; manglik_flips_in_a_day: number };
  /** Null when the birth time is unknown: the verdict would be a coin toss. */
  manglik: null | {
    present: boolean; severity: string; score: number;
    mars_house: number | null; mars_sign: string | null; mars_house_label: string | null;
    cancellations: string[]; mitigators: string[]; verdict: string | null;
  };
  checks_in_report: number;
};

export type ChartCheckInput = {
  dob: string; tob: string; pob: string; place_id: string; name?: string;
  /** Set when the visitor ticked "I don't know my birth time". */
  tob_unknown?: boolean;
};

export async function runChartCheck(input: ChartCheckInput): Promise<ChartCheckResult> {
  const r = await api.post("/noauth-api/v1/shop/chart-check", input);
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ input, at: Date.now() }));
  } catch { /* private mode — the answer still shows, checkout just won't prefill */ }
  return r as ChartCheckResult;
}

/** What checkout should start with, if this visitor already ran a check. */
export function savedBirthDetails(): ChartCheckInput | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const { input } = JSON.parse(raw);
    return input?.dob && input?.tob ? input : null;
  } catch { return null; }
}
