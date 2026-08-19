import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PageTurner from "./PageTurner";

type Shot = { page: number; url: string };

/**
 * The finished report, read full-screen.
 *
 * It used to open as a section in the middle of the order page, which put a
 * book the height of the viewport into a scrolling document: the page could not
 * be scrolled past it on a phone, because every drag over the book was the
 * book's. A reader is a mode, not a section — so it takes the whole screen,
 * locks the page behind it, and gives the reader a way out.
 *
 * Turning: swipe, tap the left or right half, the arrows, or the arrow keys.
 * Zoom: a toggle rather than pinch, because pinch inside a scroll-locked
 * overlay fights the browser and loses on iOS. At 2× the page pans by drag.
 */
export default function BookReader({ open, onClose, shots, title, subtitle, pdfUrl }: {
  open: boolean; onClose: () => void; shots: Shot[];
  title: string; subtitle?: string; pdfUrl?: string | null;
}) {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!open) return;
    setZoom(false);
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex flex-col bg-[#0b0a08]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .2 }}
          role="dialog" aria-modal aria-label={title}>

          <header className="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-8
                             h-14 sm:h-16 shrink-0 border-b border-white/10"
                  style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <div className="min-w-0">
              <p className="caps text-brass">Reading</p>
              <p className="text-[14px] sm:text-[15px] text-white/90 truncate">{title}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setZoom((z) => !z)}
                      aria-label={zoom ? "Fit the page to the screen" : "Zoom in"}
                      aria-pressed={zoom}
                      className={`h-10 w-10 rounded-full grid place-items-center transition
                                  ${zoom ? "bg-brass text-surface" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
                <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
                     strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                  <circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" />
                  <path d="M11 8v6M8 11h6" opacity={zoom ? 0 : 1} /><path d="M8 11h6" opacity={zoom ? 1 : 0} />
                </svg>
              </button>
              {pdfUrl && (
                <a href={pdfUrl} download aria-label="Download the PDF"
                   className="hidden sm:inline-flex btn-line btn-sm border-white/25 text-white/80
                              hover:border-white/60 hover:text-white">Download</a>
              )}
              <button onClick={onClose} aria-label="Close the reader"
                className="h-10 w-10 rounded-full grid place-items-center text-white/70
                           hover:text-white hover:bg-white/10 transition text-[18px]">✕</button>
            </div>
          </header>

          {/* overflow-auto so a zoomed page can be panned by dragging it */}
          <div className={`relative flex-1 ${zoom ? "overflow-auto" : "overflow-hidden"}
                           px-3 sm:px-8 py-4 sm:py-8 flex items-start sm:items-center justify-center`}>
            <div className="w-full origin-top transition-transform duration-200"
                 style={{ maxWidth: zoom ? 1400 : 900, transform: zoom ? "scale(1.9)" : undefined,
                          transformOrigin: "top center" }}>
              <PageTurner shots={shots} maxW={900} keyboard single
                          showChrome={!zoom} caption={subtitle} />
            </div>
          </div>

          {!zoom && (
            <p className="relative z-10 shrink-0 pb-3 text-center text-[11.5px] text-white/35"
               style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
              Swipe, or tap either side of the page
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
