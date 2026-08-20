import { useState } from "react";
import { useLang } from "../lib/lang";
import { homeUi } from "../lib/homeStrings";
import Reveal from "../components/Reveal";

// The names are proper nouns and stay as they are in both languages; only the
// description is copy, and it lives with the rest of the page's copy.
const D = [
  { id: "classic",   name: "Classic",   img: "/covers/classic.png" },
  { id: "heritage",  name: "Heritage",  img: "/covers/heritage.png" },
  { id: "editorial", name: "Editorial", img: "/covers/editorial.png" }
];

/**
 * Desktop only.
 *
 * Choosing between three layouts is a considered decision made at a desk, and
 * on a phone it was 1,184px of scrolling for a choice almost nobody changes.
 * Mobile buyers get Heritage — the presentation edition, and the default the
 * checkout already carries — without being asked.
 */
export default function Designs() {
  const [active, setActive] = useState(1);
  const [lang] = useLang();
  const h = homeUi(lang);
  return (
    <section id="designs" className="hidden sm:block shell py-12 sm:py-28">
      <Reveal>
        <p className="eyebrow">{h.designsEyebrow}</p>
        <h2 className="display text-[25px] sm:text-[44px] mt-3 max-w-prose2 leading-[1.08]">
          {h.designsTitle}
        </h2>
        <p className="lede mt-4 max-w-prose2">
          {h.designsLede}
        </p>
      </Reveal>

      <div className="grid lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] gap-12 items-center mt-14">
        <div className="order-2 lg:order-1 space-y-2">
          {D.map((d, i) => (
            <button key={d.id} onClick={() => setActive(i)}
              className={`w-full text-left p-5 rounded-xl border transition-all
                ${i === active ? "border-fg bg-raised shadow-soft" : "border-transparent hover:bg-raised/60"}`}>
              <h3 className="display text-[21px]">{d.name}</h3>
              <p className="text-[14px] text-muted mt-1.5 leading-relaxed">{h.designLines[d.id]}</p>
            </button>
          ))}
        </div>
        <div className="order-1 lg:order-2 flex justify-center">
          <img key={D[active].id} src={D[active].img} alt={`${D[active].name} cover`}
               className="w-[74%] sm:w-[58%] lg:w-[76%] rounded-xl shadow-lift rise" />
        </div>
      </div>
    </section>
  );
}
