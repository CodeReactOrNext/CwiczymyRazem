import { memo } from "react";

const CENTER = { x: 240, y: 172 } as const;
const SPOKES = 14;
const RINGS = 8;
const RING_START = 34;
const RING_STEP = 27;

interface Segment {
  d: string;
  /** 0…1 — the web tears in this order, the same every time. */
  tearAt: number;
}

const point = (spoke: number, radius: number) => {
  // A little irregularity so it reads as silk, not a dartboard.
  const angle = (spoke / SPOKES) * Math.PI * 2 + Math.sin(spoke * 2.3) * 0.06;
  const r = radius * (1 + Math.sin(spoke * 1.7 + radius) * 0.03);
  return { x: CENTER.x + Math.cos(angle) * r, y: CENTER.y + Math.sin(angle) * r };
};

const f = (n: number) => Math.round(n * 10) / 10;

/** Deterministic 0…1 scatter, so tears land all over rather than in a sweep. */
const scatter = (a: number, b: number) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const SPOKE_PATHS = Array.from({ length: SPOKES }, (_, i) => {
  const end = point(i, RING_START + RING_STEP * RINGS + 40);
  return `M${CENTER.x} ${CENTER.y} L${f(end.x)} ${f(end.y)}`;
});

const RING_SEGMENTS: Segment[] = Array.from({ length: RINGS }, (_ring, ring) =>
  Array.from({ length: SPOKES }, (_spoke, i) => {
    const radius = RING_START + RING_STEP * ring;
    const a = point(i, radius);
    const b = point((i + 1) % SPOKES, radius);
    // Silk sags toward the hub between two spokes.
    const mid = point(i + 0.5, radius * 0.9);
    return {
      d: `M${f(a.x)} ${f(a.y)} Q${f(mid.x)} ${f(mid.y)} ${f(b.x)} ${f(b.y)}`,
      tearAt: scatter(ring, i),
    };
  }),
).flat();

interface SpiderWebProps {
  /** 0 = whole, 1 = shredded. Follows the damage the boss has taken. */
  torn: number;
  /** Silk colour; the default sits quietly behind the spider. */
  stroke?: string;
}

/**
 * The Fretweaver's web, drawn in the art's own viewBox. Every hit that takes
 * HP off the boss tears silk out of it — the fight's progress, drawn.
 */
const SpiderWebImpl = ({ torn, stroke = "#3f3f46" }: SpiderWebProps) => {
  // The frame never fully goes: a shredded web still hangs from its spokes.
  const cut = Math.min(1, Math.max(0, torn)) * 0.92;
  return (
    <g aria-hidden>
      {SPOKE_PATHS.map((d, i) => (
        <path key={i} d={d} stroke={stroke} strokeWidth={1.2} fill='none' />
      ))}
      {RING_SEGMENTS.map((segment, i) => (
        <path
          key={i}
          d={segment.d}
          stroke={stroke}
          strokeWidth={1.1}
          fill='none'
          style={{
            opacity: segment.tearAt < cut ? 0 : 0.9,
            transition: "opacity 400ms",
          }}
        />
      ))}
    </g>
  );
};

export const SpiderWeb = memo(SpiderWebImpl);
