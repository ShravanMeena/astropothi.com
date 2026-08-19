import { useEffect, useState } from "react";
import { api, getToken, clearToken } from "./api";
import { I18n, STRINGS, loadLang, saveLang, type UiLang } from "./i18n";
import type { ReportType, Design, Palette } from "./types";
import Shell, { type Tab } from "./components/Shell";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Create from "./screens/Create";
import Library from "./screens/Library";
import BrandingScreen from "./screens/BrandingScreen";
import Billing from "./screens/Billing";
import Admin from "../admin/Admin";
import { getAdminToken, clearAdminToken } from "../admin/api";

export default function Dashboard({ onExit }: { onExit: () => void }) {
  const [lang, setLangState] = useState<UiLang>(loadLang());
  const setLang = (l: UiLang) => { saveLang(l); setLangState(l); document.documentElement.lang = l; };

  const [authed, setAuthed] = useState(!!getToken());
  // Set at sign-in from the is_admin flag on the row. Nothing in the UI can
  // turn this on; the server decides and hands over a token or it does not.
  const [isAdmin, setIsAdmin] = useState(!!getAdminToken());
  const [tab, setTab] = useState<Tab>("home");
  const [balance, setBalance] = useState(0);
  const [types, setTypes] = useState<ReportType[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [pilot, setPilot] = useState<{ on: boolean; seats: number; free_reports: number } | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    api.get("/noauth-api/v1/catalog/report-types").then(setTypes).catch(() => {});
    api.get("/noauth-api/v1/catalog/designs").then(setDesigns).catch(() => {});
    api.get("/noauth-api/v1/catalog/palettes").then(setPalettes).catch(() => {});
    api.get("/noauth-api/v1/pilot/status").then(setPilot).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authed) return;
    api.get("/api/v1/credits/balance").then((r) => setBalance(r.balance)).catch(() => {});
    // Adopt his saved UI language once, if he set one.
    api.get("/api/v1/branding").then((b) => {
      if (b?.ui_language && b.ui_language !== lang) setLang(b.ui_language as UiLang);
    }).catch(() => {});
  }, [authed]);

  const ctx = { lang, t: STRINGS[lang], setLang };

  if (!authed) return (
    <I18n.Provider value={ctx}>
      <Login onDone={() => { setIsAdmin(!!getAdminToken()); setAuthed(true); }} />
    </I18n.Provider>
  );

  // Staff see the panel, not the console. Deliberately not a toggle: an admin
  // who also wants his own console signs out and signs in without staff rights.
  if (isAdmin) return (
    <Admin onSignOut={() => {
      clearAdminToken(); clearToken(); setIsAdmin(false); setAuthed(false); onExit();
    }} />
  );

  return (
    <I18n.Provider value={ctx}>
      <Shell tab={tab} setTab={setTab} balance={balance} pilot={pilot}
             onSignOut={() => { clearToken(); clearAdminToken(); setAuthed(false); onExit(); }}>
        {tab === "home"    && <Home balance={balance} types={types} pilot={pilot} onTopup={() => setTab("billing")} onCreate={() => setTab("create")} />}
        {tab === "create"  && <Create types={types} designs={designs} palettes={palettes} balance={balance} onDone={setBalance} />}
        {tab === "library" && <Library onCreate={() => setTab("create")} />}
        {tab === "brand"   && <BrandingScreen designs={designs} palettes={palettes} onSaved={setBalance} />}
        {tab === "billing" && <Billing onCredited={setBalance} />}
      </Shell>
    </I18n.Provider>
  );
}
