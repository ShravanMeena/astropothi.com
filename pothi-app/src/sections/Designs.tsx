import { useState } from "react";
import Reveal from "../components/Reveal";

const D = [
  { id: "classic",   name: "Classic",   line: "Traditional Vedic setting. Serif throughout, a fine ruled border, chapters running one after another.", img: "/covers/classic.png" },
  { id: "heritage",  name: "Heritage",  line: "A presentation edition. Gold frame, corner medallions, a title page for every long chapter.", img: "/covers/heritage.png" },
  { id: "editorial", name: "Editorial", line: "Modern and quiet. Two columns, generous margins, no ornament — a magazine rather than a manuscript.", img: "/covers/editorial.png" }
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
  return (
    <section id="designs" className="hidden sm:block shell py-12 sm:py-28">
      <Reveal>
        <p className="eyebrow">The designs</p>
        <h2 className="display text-[25px] sm:text-[44px] mt-3 max-w-prose2 leading-[1.08]">
          Three books, not three colours.
        </h2>
        <p className="lede mt-4 max-w-prose2">
          The same reading, laid out three different ways. The structure changes, not the palette —
          one runs to 53 pages, another to 135.
        </p>
      </Reveal>

      <div className="grid lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] gap-12 items-center mt-14">
        <div className="order-2 lg:order-1 space-y-2">
          {D.map((d, i) => (
            <button key={d.id} onClick={() => setActive(i)}
              className={`w-full text-left p-5 rounded-xl border transition-all
                ${i === active ? "border-fg bg-raised shadow-soft" : "border-transparent hover:bg-raised/60"}`}>
              <h3 className="display text-[21px]">{d.name}</h3>
              <p className="text-[14px] text-muted mt-1.5 leading-relaxed">{d.line}</p>
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
