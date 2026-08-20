import Reveal from "../components/Reveal";
import { useLang } from "../lib/lang";
import { homeUi } from "../lib/homeStrings";

export default function How() {
  const [lang] = useLang();
  const h = homeUi(lang);
  const STEPS = h.howSteps;
  return (
    <section id="how" className="bg-sunken border-y border-line">
      <div className="shell py-12 sm:py-28">
        <Reveal>
          <p className="eyebrow">{h.howEyebrow}</p>
          <h2 className="display text-[25px] sm:text-[44px] mt-3 leading-[1.08]">{h.howTitle}</h2>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-10 sm:gap-8 mt-14">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * .09}>
              <div className="display text-[15px] text-brass">{String(i + 1).padStart(2, "0")}</div>
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
