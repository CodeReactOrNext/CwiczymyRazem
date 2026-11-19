import { cn } from "assets/lib/utils";
import { KostekStill } from "components/Mascot/Kostek";

import styles from "./SupportHeart.module.css";

// Fixed colours, not the theme's: the banner is a dark card in the light theme
// too (force-dark), so Kostek stays off-white on it.
const BODY = "#FBFBFA";
const BODY_SHADE = "#DCDCD6";
const CARD = "#27272a";
/**
 * The classic heart: two round lobes as wide as it is tall, a deep cleft and
 * a soft point. Drawn in a 24-unit box; `CENTRED` puts it around (0, 0) at
 * about 44 wide. (The first one here was hand-drawn with small lobes and a
 * long point, and looked pinched.)
 */
const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const CENTRED = "scale(2.2) translate(-12 -12.2)";

const Mitt = ({ x, y }: { x: number; y: number }) => (
  <>
    <circle cx={x + 1} cy={y + 1} r={8.5} fill={BODY_SHADE} />
    <circle cx={x} cy={y} r={7.5} fill={BODY} />
  </>
);

/**
 * The picture on the support banner: Kostek hugging a heart. The heart beats
 * (two quick pulses, a rest), Kostek's hands squeeze with it, and now and then
 * a small heart drifts up. CSS only, transform and opacity; still under
 * "reduce motion".
 */
export const SupportHeart = ({ className }: { className?: string }) => (
  <svg viewBox='0 0 120 112' aria-hidden className={cn("overflow-visible", className)}>
    {[styles.floatA, styles.floatB].map((side) => (
      <g key={side} className={cn(styles.float, side)}>
        <path d={HEART} transform={CENTRED} className='fill-orange-400' fill='#fb923c' />
      </g>
    ))}
    <svg x={7} y={0} width={106} height={104} viewBox='0 0 112 110' overflow='visible'>
      <KostekStill mood='celebrate' hands={false} fg={BODY} shade={BODY_SHADE} bg={CARD} />
    </svg>
    <g className={styles.beat}>
      <path d={HEART} transform={`translate(60 77.5) scale(1.16) ${CENTRED}`} className='fill-orange-600' fill='#ea580c' />
      <path d={HEART} transform={`translate(60 76) scale(1.08) ${CENTRED}`} className='fill-orange-500' fill='#f97316' />
      <path
        d='M-15.5 -6 C-15.5 -11 -12.5 -14.5 -8 -15'
        transform='translate(60 76) scale(1.08)'
        fill='none'
        stroke='#fed7aa'
        className='stroke-orange-200'
        strokeWidth={3}
        strokeLinecap='round'
      />
      <Mitt x={31} y={80} />
      <Mitt x={89} y={80} />
    </g>
  </svg>
);
