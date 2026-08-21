import { useEffect, useRef, useState } from "react";
import { PITCH_VIDEO as V } from "../content/video.generated";
import { track } from "../lib/track";
import { useLang } from "../lib/lang";

const T = {
  en: { tapForSound: "Tap for sound", soundOn: "Sound on", muted: "Muted" },
  hi: { tapForSound: "आवाज़ के लिए टैप करें", soundOn: "आवाज़ चालू", muted: "म्यूट" }
} as const;

/**
 * The pitch clip. Plays itself, silently, and only when someone can see it.
 *
 * Three constraints shape this:
 *
 *   · Browsers refuse to autoplay with sound, and they are right to. So it
 *     starts muted, and unmuting is one obvious tap rather than a hunt through
 *     native controls.
 *   · It is 775KB. Loading that for a visitor who never scrolls to it is a real
 *     cost on mobile data, so preload is "none" and both the fetch and the play
 *     wait for the element to actually enter the viewport.
 *   · It pauses when it scrolls out of view. A video playing to nobody is
 *     battery and bandwidth spent on nothing.
 *
 * The poster fills the box immediately, and width/height are set, so nothing
 * below it moves when the video arrives.
 */
export default function PitchVideo() {
  const [lang] = useLang();
  const t = T[lang === "hi" ? "hi" : "en"];
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [armed, setArmed] = useState(false);   // has it entered the viewport once
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          setArmed(true);
          // play() rejects on browsers that refuse autoplay; the poster and the
          // controls stay, so there is nothing to recover from.
          el.play().catch(() => {});
          if (!counted.current) { counted.current = true; track("video_played", { id: "pitch" }); }
        } else {
          el.pause();
        }
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggleSound = () => {
    const el = ref.current;
    if (!el) return;
    const next = !muted;
    el.muted = next;
    setMuted(next);
    if (!next) { el.play().catch(() => {}); track("video_unmuted", { id: "pitch" }); }
  };

  return (
    <section className="border-b border-line bg-sunken">
      <div className="shell py-4 sm:py-10">
        <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[340px]">
          <video
            ref={ref}
            // muted + playsInline are what make autoplay legal on iOS at all.
            muted
            playsInline
            loop
            preload="none"
            poster={V.poster}
            width={V.width}
            height={V.height}
            aria-label="astropothi — what the Dosh report tells you"
            className="w-full h-auto rounded-2xl border border-line bg-raised"
          >
            {armed && <source src={V.webm} type="video/webm" />}
            {armed && <source src={V.mp4} type="video/mp4" />}
          </video>

          <button type="button" onClick={toggleSound}
                  aria-pressed={!muted}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full
                             bg-black/55 backdrop-blur-sm px-3 py-1.5 text-[12px] text-white
                             hover:bg-black/70 transition">
            {muted ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="m22 9-6 6M16 9l6 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" />
              </svg>
            )}
            <span>{muted ? t.tapForSound : t.soundOn}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
