import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PageTurner from "./PageTurner";

type Shot = { page: number; url: string };

/**
 * The sample, read inside the site.
 *
 * Sending someone to a raw PDF tab hands them the browser's viewer, our design
 * disappears, and the back button is the only way home. Here the same pages
 * turn like a book, and the download stays available for anyone who wants it.
 */
export default function SampleModal({ open, onClose, shots, title, pdfUrl }: {
  open: boolean; onClose: () => void; shots: Shot[]; title: string; pdfUrl?: string | null;
}) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    // The page behind must not scroll while a full-screen reader is open.
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
        <motion.div className="fixed inset-0 z-50 flex flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: .2 }}
          role="dialog" aria-modal aria-label={`${title} — sample`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

          <div className="relative flex items-center justify-between gap-4 px-5 sm:px-8 h-16 shrink-0
                          border-b border-white/10">
            <div className="min-w-0">
              <p className="caps text-brass">Sample</p>
              <p className="text-[15px] text-white/90 truncate">{title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {pdfUrl && (
                <a href={pdfUrl} download
                   className="btn-line btn-sm border-white/25 text-white/80 hover:border-white/60 hover:text-white">
                  Download PDF
                </a>
              )}
              <button onClick={onClose} aria-label="Close sample"
                className="h-10 w-10 rounded-full grid place-items-center text-white/70
                           hover:text-white hover:bg-white/10 transition">✕</button>
            </div>
          </div>

          <motion.div className="relative flex-1 overflow-y-auto px-5 sm:px-8 py-8 sm:py-12"
            initial={{ y: 18 }} animate={{ y: 0 }} exit={{ y: 18 }}
            transition={{ duration: .24, ease: [0.22, 0.7, 0.2, 1] }}>
            <div className="max-w-[1000px] mx-auto">
              <PageTurner shots={shots} maxW={860} keyboard caption={`${title} · sample pages`} />
              <p className="mt-10 text-center text-[13px] text-white/45">
                These are real pages from this edition. The full book runs to many more.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
