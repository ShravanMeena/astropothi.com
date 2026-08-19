// The create form is long and a pandit fills it while a client reads out birth
// details on the phone. Losing it to a refresh or a tab switch is unacceptable,
// so every keystroke is persisted and restored.

const KEY = "pothi.draft.v1";

export type Draft = Record<string, string>;

export function loadDraft(fallback: Draft): Draft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const saved = JSON.parse(raw);
    // Only known keys survive, so a schema change can't inject stale fields.
    return Object.fromEntries(Object.keys(fallback).map((k) => [k, saved[k] ?? fallback[k]])) as Draft;
  } catch { return fallback; }
}

export function saveDraft(d: Draft) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* quota — ignore */ }
}

export function clearDraft() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

const STEP_KEY = "pothi.draft.step";
export const loadStep = () => Number(localStorage.getItem(STEP_KEY) || 1);
export const saveStep = (n: number) => { try { localStorage.setItem(STEP_KEY, String(n)); } catch {} };
