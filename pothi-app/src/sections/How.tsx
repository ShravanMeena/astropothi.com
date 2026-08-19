import Reveal from "../components/Reveal";
const STEPS = [
  { n: "01", t: "Your birth details", d: "Date, exact time, and place. The time matters more than anything else — it fixes the ascendant and every house cusp." },
  { n: "02", t: "Choose how it looks", d: "Three designs, seven colourways. Classic, Editorial or Heritage — a different book each time, not a recolour." },
  { n: "03", t: "Read it in a minute", d: "The chart is computed, the chapters written and the pages typeset. The PDF arrives before you have finished your tea." }
];

export default function How() {
  return (
    <section id="how" className="bg-sunken border-y border-line">
      <div className="shell py-12 sm:py-28">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="display text-[25px] sm:text-[44px] mt-3 leading-[1.08]">Three steps, no account.</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 mt-14">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * .09}>
              <div className="display text-[15px] text-brass">{s.n}</div>
              <div className="rule my-4" />
              <h3 className="display text-[21px]">{s.t}</h3>
              <p className="text-[14.5px] text-muted mt-2.5 leading-relaxed">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
