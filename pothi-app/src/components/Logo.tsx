/**
 * The astropothi mark.
 *
 * A pothi is a bound manuscript and the North Indian chart is the one diagram
 * nobody outside jyotish uses — so the mark is both: a closed book seen
 * end-on, with the chart's diamond set into its cover. It reads at 24px in a
 * header and at 200px on a cover, which is the only real test a mark has to
 * pass.
 *
 * Drawn rather than lettered, because the wordmark beside it already carries
 * the name and two typefaces competing in one lockup is how logos get muddy.
 */
export function LogoMark({ className = "", title, width, height }: {
  className?: string; title?: string; width?: number; height?: number;
}) {
  return (
    <svg viewBox="0 0 32 32" className={className} width={width} height={height} fill="none"
         aria-hidden={!title} role={title ? "img" : undefined}>
      {title && <title>{title}</title>}
      {/* the board: a manuscript seen from the front, taller than wide */}
      <rect x="5.5" y="3.5" width="21" height="25" rx="2.5"
            stroke="currentColor" strokeWidth="1.6" />
      {/* the binding cord, down the spine side */}
      <path d="M9.6 3.5v25" stroke="currentColor" strokeWidth="1.1" opacity=".5" />
      {/* the chart: a square on its point, with the cross that makes the
          twelve houses — the whole diagram abbreviated to its skeleton */}
      <path d="M13 16 18.8 10.2 24.6 16 18.8 21.8Z"
            stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M13 10.2h11.6M13 21.8h11.6M13 10.2v11.6M24.6 10.2v11.6"
            stroke="currentColor" strokeWidth="1.05" opacity=".55" />
    </svg>
  );
}

/**
 * Mark plus name. `astro` is set light and `pothi` solid, so the eye lands on
 * the half that is the product — and the two halves stay one word, which is
 * how it is spelled and how people will type it.
 */
export default function Logo({ className = "", size = 21, mark = true }: {
  className?: string; size?: number; mark?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark && (
        <LogoMark className="text-brass shrink-0"
                  width={Math.round(size * 1.18)} height={Math.round(size * 1.18)} />
      )}
      <span className="display leading-none tracking-tight" style={{ fontSize: size }}>
        <span className="text-muted font-normal">astro</span><span className="text-fg">pothi</span>
      </span>
    </span>
  );
}
