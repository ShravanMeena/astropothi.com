import { useCallback, useEffect, useState } from "react";
import { api, type ReportItem, type Design, type Palette } from "./lib/api";
import { useRoute } from "./lib/route";
import Nav from "./sections/Nav";
import BookHero from "./sections/BookHero";
import Reports from "./sections/Reports";
import How from "./sections/How";
import Designs from "./sections/Designs";
import Footer from "./sections/Footer";
import Engine from "./sections/Engine";
import ReportPage from "./pages/ReportPage";
import ReportsPage from "./pages/ReportsPage";
import FaqPage from "./pages/FaqPage";
import TermsPage from "./pages/legal/TermsPage";
import PrivacyPage from "./pages/legal/PrivacyPage";
import RefundsPage from "./pages/legal/RefundsPage";
import ContactPage from "./pages/legal/ContactPage";
import BuyPage from "./pages/BuyPage";
import OrderPage from "./pages/OrderPage";
import Dashboard from "./dashboard/Dashboard";
import Guide, { GuideButton } from "./components/Guide";
import SignIn from "./components/SignIn";
import ProfilePage from "./pages/ProfilePage";
import { useSignedIn } from "./lib/account";
import { useTheme } from "./lib/theme";
import Support from "./components/Support";
import { startTracking, pageView, track } from "./lib/track";

export default function App() {
  const { route, go } = useRoute();
  const { theme, setTheme } = useTheme();
  const [items, setItems] = useState<ReportItem[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [guide, setGuide] = useState(false);
  const [signIn, setSignIn] = useState(false);
  const signedIn = useSignedIn();
  // Design chosen on the report page is carried into checkout.
  const [pick, setPick] = useState({ design: "heritage", palette: "gold" });

  // Behaviour tracking starts before anything else so the very first page view
  // of a session is recorded, including for a visitor who bounces in 3 seconds.
  useEffect(() => { startTracking(); }, []);

  // Every route change is a page view. Recorded here rather than in each page
  // so a new screen cannot be added and quietly go unmeasured.
  useEffect(() => {
    const fresh = pageView({
      route: route.name,
      ...("code" in route ? { code: route.code } : {}),
      ...("page" in route ? { page: route.page } : {}),
      ...("id" in route ? { order_id: route.id } : {})
    });
    // Fired from the arrival, not the click, so an ad landing straight on
    // /report/kundli counts the same as a click from the grid. Gated on `fresh`
    // so React's development double-invoke does not double-count.
    if (!fresh) return;
    if (route.name === "report")  track("report_viewed", { code: route.code });
    if (route.name === "buy")     track("checkout_started", { code: route.code });
    if (route.name === "order")   track("payment_returned", { order_id: route.id });
  }, [route]);

  useEffect(() => {
    api.get("/noauth-api/v1/shop/catalogue")
      .then((r) => { setItems(r.reports); setDesigns(r.designs); setPalettes(r.palettes); })
      .catch(() => {});
  }, []);

  // "/path#anchor" means: go to the page, then scroll to the section on it.
  const nav = useCallback((to: string) => {
    const [path, hash] = to.split("#");
    go(path || "/");
    if (hash) {
      let tries = 0;
      const seek = () => {
        const el = document.getElementById(hash);
        if (el) return el.scrollIntoView({ behavior: "smooth", block: "start" });
        if (++tries < 30) requestAnimationFrame(seek);
      };
      requestAnimationFrame(seek);
    }
  }, [go]);

  // The console is its own world — no storefront chrome around it.
  if (route.name === "dashboard") return <Dashboard onExit={() => go("/")} />;

  const openReport = (code: string) => go(`/report/${code}`);
  const openBuy = (code: string) => { track("buy_clicked", { code, from: route.name }); go(`/buy/${code}`); };
  // The guide belongs where someone is still choosing, not mid-checkout.
  const guideWelcome = route.name === "home" || route.name === "reports" || route.name === "faq";

  return (
    <>
      <Nav onBuy={() => go("/reports")} onAstrologers={() => go("/astrologers")} onGo={nav}
           signedIn={signedIn} onSignIn={() => { track("signin_opened", { from: route.name }); setSignIn(true); }} onProfile={() => go("/profile")}
           theme={theme} setTheme={setTheme} />
      <main>
        {route.name === "home" && (
          <>
            <BookHero onOpen={() => go("/reports")} />
            <Reports items={items} onPick={openReport} onAll={() => go("/reports")}
                     onAskGuide={() => setGuide(true)} />
            <Engine />
            <How />
            <Designs />
            <section className="relative overflow-hidden grain lamp border-t border-line">
              <div className="shell relative z-10 py-20 sm:py-28 text-center">
                <span className="mx-auto mb-8 block h-8 w-px bg-gradient-to-b from-transparent to-brass" />
                <h2 className="display text-[34px] sm:text-[48px] max-w-[17ch] mx-auto leading-[1.05]">
                  Read what your chart actually says.
                </h2>
                <p className="lede mt-5 max-w-prose2 mx-auto">
                  Computed from your exact birth time, written out in full, delivered in under a minute.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                  <button className="btn-brass h-[52px] px-8 text-[16px]" onClick={() => go("/reports")}>
                    Browse all {items.length} reports
                  </button>
                  <button className="btn-line h-[52px]" onClick={() => go("/faq")}>Read the questions</button>
                </div>
              </div>
            </section>
          </>
        )}

        {route.name === "reports" && (
          <ReportsPage items={items} onPick={openReport} onAskGuide={() => setGuide(true)} />
        )}

        {route.name === "faq" && (
          <FaqPage onBuy={() => go("/reports")} onAskGuide={() => setGuide(true)} />
        )}

        {route.name === "legal" && (
          route.page === "terms"   ? <TermsPage onGo={nav} />
          : route.page === "privacy" ? <PrivacyPage onGo={nav} />
          : route.page === "refunds" ? <RefundsPage onGo={nav} />
          :                            <ContactPage onGo={nav} />
        )}

        {route.name === "report" && (
          <ReportPage code={route.code} designs={designs} palettes={palettes}
            onHome={() => go("/reports")}
            onBuy={(code, design, palette) => {
              track("buy_clicked", { code, design, palette, from: "report" });
              setPick({ design, palette }); go(`/buy/${code}`);
            }} />
        )}

        {route.name === "buy" && (
          <BuyPage item={items.find((i) => i.code === route.code)}
            design={pick.design} palette={pick.palette}
            onBack={() => go(`/report/${route.code}`)}
            onDone={(publicId) => go(`/order/${publicId}`)} />
        )}

        {route.name === "order" && (
          <OrderPage id={route.id} onHome={() => go("/")} onProfile={() => go("/profile")} />
        )}

        {route.name === "profile" && (
          <ProfilePage onOpenOrder={(pid) => go(`/order/${pid}`)} onHome={() => go("/")}
                       onSignIn={() => setSignIn(true)} />
        )}
        {/* Reachable from wherever someone gets stuck, not only from a
            "Contact" link nobody clicks. */}
        {/* Order and profile place it themselves, with the order number in the
            message — a second copy here would be the same panel twice. */}
        {route.name !== "order" && route.name !== "profile" && route.name !== "legal" && (
          <div className="shell pb-16"><Support where={route.name} /></div>
        )}
      </main>
      <Footer onAstrologers={() => go("/astrologers")} onGo={nav} />

      <GuideButton onClick={() => { track("guide_opened", { from: route.name }); setGuide(true); }} hidden={!guideWelcome || guide} />
      <Guide items={items} open={guide} onClose={() => setGuide(false)}
             onReport={openReport} onBuy={openBuy} />
      <SignIn open={signIn} onClose={() => setSignIn(false)} onDone={() => go("/profile")} />
    </>
  );
}
