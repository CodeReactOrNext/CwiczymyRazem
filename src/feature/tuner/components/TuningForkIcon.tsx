/** A tuning fork — two prongs on a stem — the tuner's glyph everywhere it
 *  appears as a button. */
export function TuningForkIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox='0 0 16 16'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden>
      {/* two prongs */}
      <path d='M5 2 C5 2 5 7 5 8 C5 9.5 6.5 10.5 8 10.5 C9.5 10.5 11 9.5 11 8 C11 7 11 2 11 2' />
      {/* stem */}
      <line x1='8' y1='10.5' x2='8' y2='15' />
    </svg>
  );
}
