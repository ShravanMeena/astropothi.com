import { useEffect, useRef, useState } from "react";
import { useLang } from "../lib/lang";
import { buyUi } from "../lib/buyStrings";
import { api } from "../lib/api";

type Place = { display_name: string; place_id: string };

/** Birth place. The chosen place_id is submitted; the server resolves the
 *  coordinates and timezone, and editing the text clears the id so a half-typed
 *  place can never silently keep the previous location's chart. */
export default function PlaceInput({ value, placeId, onChange }: {
  value: string; placeId: string; onChange: (v: { pob: string; place_id: string }) => void;
}) {
  const [lang] = useLang();
  const t = buyUi(lang);
  const [q, setQ] = useState(value);
  const [list, setList] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const skip = useRef(false);

  useEffect(() => { setQ(value); }, [value]);
  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    if (q.trim().length < 2) { setList([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/noauth-api/v1/location/autocomplete?q=${encodeURIComponent(q)}`);
        setList(r || []); setHi(0); setOpen(true);
      } catch { setList([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    // pointerdown and a document-contains guard, for the same reason the date
    // picker needs them: on Android a synthetic mousedown from browser UI was
    // closing the list before the tap on a suggestion could land.
    const away = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t || !document.contains(t)) return;
      if (box.current && !box.current.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", away, true);
    return () => document.removeEventListener("pointerdown", away, true);
  }, []);

  const pick = (p: Place) => {
    skip.current = true; setQ(p.display_name); setOpen(false); setList([]);
    onChange({ pob: p.display_name, place_id: p.place_id });
  };

  return (
    <div className="relative" ref={box}>
      <input className="field" value={q} autoComplete="off" spellCheck={false}
             placeholder={t.placePh}
             onChange={(e) => { setQ(e.target.value); onChange({ pob: e.target.value, place_id: "" }); }}
             onFocus={() => list.length && setOpen(true)}
             onKeyDown={(e) => {
               if (!open || !list.length) return;
               if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, list.length - 1)); }
               if (e.key === "ArrowUp")   { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
               if (e.key === "Enter")     { e.preventDefault(); pick(list[hi]); }
               if (e.key === "Escape")    setOpen(false);
             }} />
      {placeId && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-brass">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
               strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </span>
      )}
      {open && !!list.length && (
        <ul className="absolute z-30 left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-xl
                       border border-line bg-raised shadow-lift py-1">
          {list.map((p, i) => (
            <li key={p.place_id}>
              <button type="button" onMouseEnter={() => setHi(i)} onClick={() => pick(p)}
                className={`w-full text-left px-4 py-2.5 text-[14.5px] deva ${i === hi ? "bg-sunken" : ""}`}>
                {p.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
