import { useEffect, useState } from "react";
import { api } from "../api";
import { useI18n } from "../i18n";
import type { Branding, Design, Palette } from "../types";
import { Select } from "../../components/Picker";

export default function BrandingScreen({ designs, palettes, onSaved }: {
  designs: Design[]; palettes: Palette[]; onSaved: (b: number) => void;
}) {
  const { t, lang } = useI18n();
  const dv = lang === "hi" ? "deva" : "";
  const nm = (o: { en: string; hi: string }) => o[lang] || o.en;
  const [b, setB] = useState<Branding>({ honorific: "Pt.", default_design: "classic", default_palette: "saffron" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { api.get("/api/v1/branding").then((r) => r && setB(r)).catch(() => {}); }, []);
  const set = (k: keyof Branding) => (e: any) => setB({ ...b, [k]: e.target.value });

  const save = async () => {
    setBusy(true); setMsg("");
    try { const r = await api.put("/api/v1/branding", b); setMsg(t.brandp.saved); onSaved(r.balance); }
    catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const complete = !!(b.display_name && (b.phone || b.whatsapp) && b.logo_url);

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-5 max-w-5xl">
      <div className="card p-5 sm:p-7">
        <h1 className={`display text-[24px] ${dv}`}>{t.brandp.title}</h1>
        <p className={`mt-1.5 text-[13.5px] text-muted ${dv}`}>{t.brandp.sub}</p>
        <div className="divider my-5" />

        <div className="grid gap-4">
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div><label className="label">{t.brandp.honorific}</label>
              <Select value={b.honorific || "Pt."} ariaLabel={t.brandp.honorific}
                      onChange={(v) => setB({ ...b, honorific: v })}
                      options={["Pt.", "Acharya", "Jyotishacharya", "Dr.", "Shri"]
                        .map((x) => ({ value: x, label: x }))} /></div>
            <div><label className="label">{t.brandp.displayName} *</label>
              <input className="field deva" value={b.display_name || ""} onChange={set("display_name")} /></div>
          </div>
          <div><label className="label">{t.brandp.shopName}</label>
            <input className="field deva" value={b.shop_name || ""} onChange={set("shop_name")} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">{t.brandp.phone} *</label>
              <input className="field" value={b.phone || ""} onChange={set("phone")} inputMode="numeric" /></div>
            <div><label className="label">{t.brandp.whatsapp}</label>
              <input className="field" value={b.whatsapp || ""} onChange={set("whatsapp")} inputMode="numeric" /></div>
          </div>
          <div><label className="label">{t.brandp.address}</label>
            <input className="field deva" value={b.address || ""} onChange={set("address")} /></div>
          <div>
            <label className="label">{t.brandp.logo} *</label>
            <div className="flex gap-2">
              <input className="field" value={b.logo_url || ""} onChange={set("logo_url")} placeholder="https://…" />
              <button className="btn-line shrink-0 px-3.5 text-[13px]"
                onClick={() => setB({ ...b, logo_url: "https://placehold.co/240x240/1A1714/C29A3C/png?text=OM" })}>
                {t.brandp.sample}
              </button>
            </div>
          </div>
          <div><label className="label">{t.brandp.tagline}</label>
            <input className="field deva" value={b.tagline || ""} onChange={set("tagline")} /></div>

          <div className="divider my-1" />
          <div className={`eyebrow ${dv}`}>{t.brandp.defaults}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">{t.create.chooseDesign}</label>
              <Select value={b.default_design || "classic"} ariaLabel={t.create.chooseDesign}
                      onChange={(v) => setB({ ...b, default_design: v })}
                      options={designs.map((d) => ({ value: d.id, label: nm(d.name) }))} /></div>
            <div><label className="label">{t.create.chooseColour}</label>
              <Select value={b.default_palette || "saffron"} ariaLabel={t.create.chooseColour}
                      onChange={(v) => setB({ ...b, default_palette: v })}
                      options={palettes.map((p) => ({ value: p.id, label: nm(p.name) }))} /></div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <button className="btn-brass px-8" onClick={save} disabled={busy}>{busy ? "…" : t.brandp.save}</button>
          {msg && <span className="text-[13.5px] text-muted">{msg}</span>}
        </div>
        {!complete && (
          <p className={`mt-4 text-[12.5px] text-brass bg-brassSoft/60 border border-brass/50 rounded-xl p-3 ${dv}`}>
            {t.brandp.trial}
          </p>
        )}
      </div>

      {/* Live footprint of what lands on the PDF */}
      <div className="card p-5 lg:sticky lg:top-6 lg:self-start">
        <div className="eyebrow mb-3">On every page</div>
        <div className="rounded-xl border border-line bg-raised p-4 aspect-[1/1.414] flex flex-col">
          <div className="flex-1 grid place-items-center">
            {b.logo_url
              ? <img src={b.logo_url} alt="" className="w-14 h-14 object-contain rounded" />
              : <div className="w-14 h-14 rounded border border-dashed border-line" />}
          </div>
          <div className="text-center">
            <div className="text-[13px] font-semibold text-brass deva">
              {[b.honorific, b.display_name].filter(Boolean).join(" ") || "—"}
            </div>
            {b.shop_name && <div className="text-[11px] deva text-muted mt-0.5">{b.shop_name}</div>}
            {b.tagline && <div className="text-[9.5px] text-faint mt-0.5 deva">{b.tagline}</div>}
            <div className="text-[10px] text-muted mt-1">{b.whatsapp || b.phone || ""}</div>
            {b.address && <div className="text-[9px] text-faint mt-0.5 deva">{b.address}</div>}
          </div>
          <div className="mt-3 pt-2 border-t border-line flex justify-between text-[7.5px] text-faint">
            <span className="deva truncate">{[b.honorific, b.display_name].filter(Boolean).join(" ")}</span>
            <span>1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
