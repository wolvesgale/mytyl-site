/** Eight-pointed star (khatam) — two overlapping squares. */
export function Star8({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg className={`star8 ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <polygon points="12.00,2.00 14.93,4.93 19.07,4.93 19.07,9.07 22.00,12.00 19.07,14.93 19.07,19.07 14.93,19.07 12.00,22.00 9.07,19.07 4.93,19.07 4.93,14.93 2.00,12.00 4.93,9.07 4.93,4.93 9.07,4.93" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="miter" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </svg>
  );
}

/** Thin gold divider: line — star — line. */
export function Divider() {
  return (
    <div className="divider" aria-hidden>
      <span className="divider__line" />
      <Star8 size={16} />
      <span className="divider__line" />
    </div>
  );
}

/** Pointed (ogee-like) double arch that frames the crystal in the hero, like a mihrab window. */
export function HeroArch() {
  const outer = 'M1,200 L1,78 C1,46 24,24 50,1 C76,24 99,46 99,78 L99,200';
  const inner = 'M6,200 L6,80 C6,52 27,31 50,10 C73,31 94,52 94,80 L94,200';
  return (
    <div className="hero__arch" aria-hidden>
      <svg viewBox="0 0 100 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="archGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9cf96" stopOpacity="0.9" />
            <stop offset="0.6" stopColor="#c9a45c" stopOpacity="0.45" />
            <stop offset="1" stopColor="#c9a45c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={outer} fill="none" stroke="url(#archGold)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={inner} fill="none" stroke="url(#archGold)" strokeWidth="1" strokeDasharray="2 5" vectorEffect="non-scaling-stroke" opacity="0.7" />
      </svg>
      <Star8 size={18} className="hero__arch-star" />
    </div>
  );
}

/** Arch outline drawn over a work card visual. */
export function ArchFrame() {
  return (
    <svg className="arch-frame" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden>
      <path
        d="M4,125 L4,52 C4,30 22,14 50,4 C78,14 96,30 96,52 L96,125"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
