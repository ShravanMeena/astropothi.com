import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";

export type Place = { display_name: string; place_id: string };

/**
 * Birth-place autocomplete. Backed by Google Places when a key is configured,
 * and by a bundled index of Indian cities and tirth towns otherwise.
 *
 * The chosen place_id is what gets submitted — the server resolves coordinates
 * and timezone from it. Editing the text clears the id, so a half-typed place
 * can never silently keep the previous location's coordinates.
 */
export default function PlaceInput({ value, placeId, onChange }: {
  value: string; placeId: string;
  onChange: (v: { pob: string; place_id: string }) => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState(value);
  const [list, setList] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => { setQ(value); }, [value]);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    if (q.trim().length < 2) { setList([]); return; }
    const id = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await api.get(`/noauth-api/v1/location/autocomplete?q=${encodeURIComponent(q)}`);
        setList(r || []); setHi(0); setOpen(true);
      } catch { setList([]); } finally { setBusy(false); }
    }, 260);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const pick = (p: Place) => {
    skip.current = true;
    setQ(p.display_name); setOpen(false); setList([]);
    onChange({ pob: p.display_name, place_id: p.place_id });
  };

  const type = (v: string) => {
    setQ(v);
    // Text no longer matches the confirmed place — drop the id.
    onChange({ pob: v, place_id: "" });
  };

  const keys = (e: React.KeyboardEvent) => {
    if (!open || !list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); pick(list[hi]); }
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative" ref={box}>
      <input className="field" value={q} onChange={(e) => type(e.target.value)}
             onFocus={() => list.length && setOpen(true)} onKeyDown={keys}
             placeholder={t.create.pobHint} autoComplete="off" spellCheck={false} />

      {busy && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                         border-2 border-line border-t-transparent animate-spin" />
      )}
      {!busy && placeId && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brass" title={t.create.pobOk}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
      )}

      {open && list.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-xl
                       border border-line bg-raised shadow-lift py-1">
          {list.map((p, i) => (
            <li key={p.place_id}>
              <button type="button" onMouseEnter={() => setHi(i)} onClick={() => pick(p)}
                className={`w-full text-left px-3.5 py-2.5 text-[14px] flex items-start gap-2.5
                  ${i === hi ? "bg-sunken" : ""}`}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                     strokeWidth="1.8" className="mt-0.5 shrink-0 text-faint">
                  <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11z" /><circle cx="12" cy="10" r="2.4" />
                </svg>
                <span className="min-w-0 deva">{p.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!placeId && q.trim().length >= 2 && !open && (
        <p className="mt-1.5 text-[11.5px] text-ember">{t.create.pobPick}</p>
      )}
    </div>
  );
}
