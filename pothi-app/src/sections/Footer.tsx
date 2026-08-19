export default function Footer({ onAstrologers, onGo }: {
  onAstrologers: () => void; onGo: (path: string) => void;
}) {
  return (
    <footer className="shell py-14">
      <div className="flex flex-col sm:flex-row gap-8 sm:items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="display text-[20px]">Pothi</span>
            <span className="deva text-[13px] text-brass">पोथी</span>
          </div>
          <p className="text-[13.5px] text-muted mt-2 max-w-md leading-relaxed">
            Vedic reports computed from an astronomical ephemeris, written out in full.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-7 gap-y-2 text-[13.5px] text-muted">
          <button onClick={() => onGo("/reports")} className="hover:text-fg">Reports</button>
          <button onClick={() => onGo("/faq")} className="hover:text-fg">Questions</button>
          <button onClick={() => onGo("/profile")} className="hover:text-fg">Your reports</button>
          <a href="mailto:help@pothi.in" className="hover:text-fg">Contact</a>
          <button onClick={onAstrologers} className="hover:text-fg">For astrologers</button>
        </nav>
      </div>
      <div className="rule my-8" />
      <p className="text-[12px] text-faint leading-relaxed max-w-3xl">
        Reports are prepared for guidance and reflection. They are not a substitute for
        medical, legal, financial or psychiatric advice. Prices include GST. Reports are
        generated on payment and are non-refundable once delivered.
      </p>
      <p className="text-[12px] text-faint mt-4">© {new Date().getFullYear()} Pothi</p>
    </footer>
  );
}
