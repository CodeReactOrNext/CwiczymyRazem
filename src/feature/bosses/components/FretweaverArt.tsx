import { cn } from "assets/lib/utils";
import { memo, useEffect, useId, useRef } from "react";

import { SpiderWeb } from "./SpiderWeb";

export type SpiderMood = "idle" | "defeated" | "victorious";

/** The fight's phase, 0-based: each a bigger, faster, angrier form. */
export type SpiderPhase = 0 | 1 | 2;

interface FretweaverArtProps {
  mood?: SpiderMood;
  /** Bumped on every sword strike — a slash, a flash and a hard flinch. */
  strikeTick?: number;
  /** Bumped on every bite (a missed note) — a short snap forward. */
  biteTick?: number;
  /** Bumped when a slam lands — a full lunge. */
  slamTick?: number;
  /** A slam is coming: the spider rears up with its front legs raised. */
  windup?: boolean;
  /**
   * Which form it is in. Each phase brings its colours, size, fangs and pace;
   * from phase 2 on it also wears the markings of a later level.
   */
  phase?: SpiderPhase;
  /** Between phases: curled up and shaking while it changes form. */
  molting?: boolean;
  /** A weak spot is open: the pattern on its abdomen pulses white. */
  exposed?: boolean;
  /** Legs knocked off so far (0–8), back pair first; a molt grows them back. */
  legsLost?: number;
  /** 1–3: more markings, banded legs and a crown as the levels climb. */
  tier?: 1 | 2 | 3;
  /**
   * Finger order the legs tap in, front leg = finger 1 — the spider plays the
   * permutation the level is built on.
   */
  pattern?: readonly number[];
  /** Descend on the thread when first shown. */
  intro?: boolean;
  /** Draw the web behind the spider, torn by this share (0–1). */
  webTorn?: number;
  className?: string;
}

type Point = readonly [number, number];

interface LegGeometry {
  base: Point;
  knee: Point;
  ankle: Point;
  tip: Point;
}

/**
 * Left-side legs, front to back, in viewBox units. The right side is the same
 * set mirrored around x = 240, so the two halves always match.
 */
const LEGS: readonly LegGeometry[] = [
  { base: [198, 192], knee: [150, 106], ankle: [94, 124], tip: [62, 186] },
  { base: [190, 204], knee: [122, 138], ankle: [62, 180], tip: [40, 264] },
  { base: [190, 218], knee: [126, 182], ankle: [74, 238], tip: [62, 324] },
  { base: [198, 231], knee: [154, 228], ankle: [120, 288], tip: [122, 352] },
];

/** Back pair first, the front legs last — side by side. */
const LEG_LOSS_ORDER = ["L3", "R3", "L2", "R2", "L1", "R1", "L0", "R0"] as const;

/** How long the idle loops freeze when a strike lands. */
const HIT_STOP_MS = 80;

const BODY_RIM = "#52525b";
const BODY_FILL = "#27272a";
const BODY_DEEP = "#18181b";
const BONE = "#d4d4d8";

const CSS = `
.fw-anim { transform-box: view-box; transform-origin: 0 0; }
.fw-bob { animation: fw-bob var(--fw-bob) ease-in-out infinite; }
.fw-sway { animation: fw-sway var(--fw-sway) ease-in-out infinite; animation-delay: var(--fw-d); }
.fw-tap { animation: fw-tap var(--fw-tap) ease-in-out infinite; animation-delay: var(--fw-t); }
.fw-blink { animation: fw-blink 5.2s ease-in-out infinite; animation-delay: var(--fw-d); }
.fw-fang { animation: fw-fang var(--fw-fang) ease-in-out infinite; }
.fw-mark { transition: fill 400ms; }
.fw-thread { transform-box: view-box; transform-origin: 240px 0; transition: transform 300ms, opacity 300ms; }
.fw-body { transform-box: view-box; transform-origin: 240px 210px; transition: transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms; }
.fw-intro { animation: fw-intro 1100ms cubic-bezier(0.22,1,0.36,1) both; }
.fw-defeated .fw-sway { animation: none; transform: rotate(38deg); transition: transform 600ms; }
.fw-defeated .fw-tap { animation: none; transform: rotate(52deg); transition: transform 600ms; }
.fw-defeated .fw-bob, .fw-defeated .fw-blink, .fw-defeated .fw-fang { animation: none; }
.fw-defeated .fw-blink { transform: scaleY(0.12); }
.fw-defeated .fw-thread { transform: scaleY(0.25); opacity: 0; }
.fw-defeated .fw-body { transform: translateY(26px); opacity: 0.45; }
.fw-windup .fw-body { transform: translateY(-14px) scale(1.05); transition-duration: 300ms; }
.fw-windup .fw-leg-0 .fw-sway { animation: none; transform: rotate(28deg); transition: transform 300ms; }
.fw-windup .fw-fang { animation-duration: 0.25s; }
.fw-grow { transform-box: view-box; transform-origin: 240px 210px; transform: scale(var(--fw-scale)); transition: transform 600ms cubic-bezier(0.22,1,0.36,1); }
.fw-molting .fw-sway { animation: none; transform: rotate(38deg); transition: transform 500ms; }
.fw-molting .fw-tap { animation: none; transform: rotate(52deg); transition: transform 500ms; }
.fw-molting .fw-bob { animation: fw-molt 0.14s linear infinite; }
.fw-molting .fw-body { transform: scale(0.9); opacity: 0.55; transition-duration: 500ms; }
.fw-drop { transition: transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 500ms; }
.fw-lost { transform: translateY(80px); opacity: 0; }
.fw-hitstop, .fw-hitstop * { animation-play-state: paused !important; }
.fw-exposed .fw-folium { animation: fw-expose 0.45s ease-in-out infinite alternate; }
@keyframes fw-expose { from { fill: var(--fw-mark); stroke: var(--fw-mark); } to { fill: #f4f4f5; stroke: #f4f4f5; } }
@keyframes fw-molt { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-3px, 1px); } 50% { transform: translate(2px, -1px); } 75% { transform: translate(-1px, 2px); } }
@keyframes fw-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
@keyframes fw-sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3.5deg); } }
@keyframes fw-tap { 0%, 62%, 100% { transform: rotate(0deg); } 72% { transform: rotate(16deg); } 82% { transform: rotate(-3deg); } }
@keyframes fw-blink { 0%, 93%, 100% { transform: scaleY(1); } 96% { transform: scaleY(0.12); } }
@keyframes fw-fang { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-7deg); } }
@keyframes fw-intro { from { transform: translateY(-300px); } to { transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .fw-bob, .fw-sway, .fw-tap, .fw-blink, .fw-fang, .fw-intro { animation: none !important; }
  .fw-grow { transition: none; }
  .fw-folium { animation: none !important; }
}
`;

interface PhaseLook {
  eye: string;
  mark: string;
  /** How much faster its idle loops run. */
  pace: number;
  scale: number;
  fang: number;
}

/** Purple, then amber, then the orange of its enraged last form. */
const PHASE_LOOKS: readonly PhaseLook[] = [
  { eye: "#c084fc", mark: "#7e22ce", pace: 1, scale: 1, fang: 1 },
  { eye: "#fcd34d", mark: "#d97706", pace: 1.4, scale: 1.05, fang: 1.15 },
  { eye: "#fb923c", mark: "#ea580c", pace: 2.2, scale: 1.1, fang: 1.3 },
];

/** Loop lengths in seconds: body bob, leg sway, foot tap, fang twitch. */
const IDLE_LOOPS = [3.4, 2.6, 1.8, 2.4] as const;
const GLOAT_LOOPS = [0.7, 1.4, 0.7, 0.35] as const;

const lookStyle = (mood: SpiderMood, phase: SpiderPhase): React.CSSProperties => {
  const look = PHASE_LOOKS[phase];
  const defeated = mood === "defeated";
  const loops = mood === "victorious" ? GLOAT_LOOPS : IDLE_LOOPS.map((sec) => sec / look.pace);
  const [bob, sway, tap, fang] = loops.map((sec) => `${sec.toFixed(2)}s`);
  return {
    ["--fw-eye" as string]: defeated ? "#52525b" : look.eye,
    ["--fw-mark" as string]: defeated ? "#3f3f46" : look.mark,
    ["--fw-scale" as string]: look.scale,
    ["--fw-bob" as string]: bob,
    ["--fw-sway" as string]: sway,
    ["--fw-tap" as string]: tap,
    ["--fw-fang" as string]: fang,
  };
};

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1]];

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * A tapered limb segment from (0,0) to `to`, rounded at both ends and bowed by
 * `bend` px. Each segment is drawn over the one before it, so the rim of
 * the next one reads as the joint.
 */
const segmentPath = (to: Point, w1: number, w2: number, bend: number) => {
  const len = Math.hypot(to[0], to[1]) || 1;
  const d: Point = [to[0] / len, to[1] / len];
  const n: Point = [-d[1], d[0]];
  const r1 = w1 / 2;
  const r2 = w2 / 2;
  const rm = (r1 + r2) / 2;
  const c: Point = [to[0] / 2 + n[0] * bend, to[1] / 2 + n[1] * bend];
  const f = (x: number) => Math.round(x * 10) / 10;
  const pt = (p: Point, k: number) => `${f(p[0] + n[0] * k)} ${f(p[1] + n[1] * k)}`;
  return [
    `M${pt([0, 0], r1)}`,
    `Q${pt(c, rm)} ${pt(to, r2)}`,
    `A${f(r2)} ${f(r2)} 0 0 0 ${pt(to, -r2)}`,
    `Q${pt(c, -rm)} ${pt([0, 0], -r1)}`,
    `A${f(r1)} ${f(r1)} 0 0 0 ${pt([0, 0], r1)}`,
    "Z",
  ].join(" ");
};

const Segment = ({
  to,
  w1,
  w2,
  bend = 0,
  bristles = 0,
}: {
  to: Point;
  w1: number;
  w2: number;
  bend?: number;
  bristles?: number;
}) => {
  const len = Math.hypot(to[0], to[1]) || 1;
  const d: Point = [to[0] / len, to[1] / len];
  // Bristles stand off the outer (convex) edge and lean toward the tip.
  const side = bend >= 0 ? 1 : -1;
  const n: Point = [-d[1] * side, d[0] * side];
  const hairs = Array.from({ length: bristles }, (_, i) => {
    const t = (i + 1) / (bristles + 1);
    const w = w1 + (w2 - w1) * t;
    const bow = 4 * t * (1 - t) * Math.abs(bend);
    const bx = to[0] * t + n[0] * (w / 2 + bow - 0.5);
    const by = to[1] * t + n[1] * (w / 2 + bow - 0.5);
    return (
      <line
        key={i}
        x1={bx}
        y1={by}
        x2={bx + n[0] * 5 + d[0] * 4}
        y2={by + n[1] * 5 + d[1] * 4}
        stroke={BODY_RIM}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    );
  });
  return (
    <>
      {hairs}
      <path
        d={segmentPath(to, w1, w2, bend)}
        fill={BODY_FILL}
        stroke={BODY_RIM}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
    </>
  );
};

const Leg = ({
  leg,
  index,
  tapDelay,
  banded,
  lost,
}: {
  leg: LegGeometry;
  index: number;
  tapDelay: number;
  banded: boolean;
  lost: boolean;
}) => {
  const knee = sub(leg.knee, leg.base);
  const ankle = sub(leg.ankle, leg.knee);
  const tip = sub(leg.tip, leg.ankle);
  return (
    <g className={cn("fw-anim fw-drop", lost && "fw-lost")}>
    <g
      className={`fw-leg-${index}`}
      transform={`translate(${leg.base[0]} ${leg.base[1]})`}>
      <g
        className="fw-anim fw-sway"
        style={{ ["--fw-d" as string]: `${-index * 0.35}s` }}>
        <Segment to={knee} w1={17} w2={12} bend={-5} />
        <g transform={`translate(${knee[0]} ${knee[1]})`}>
          <g className="fw-anim">
            <Segment to={ankle} w1={12} w2={8} bend={4} bristles={3} />
            <g transform={`translate(${ankle[0]} ${ankle[1]})`}>
              <g
                className="fw-anim fw-tap"
                style={{ ["--fw-t" as string]: `${tapDelay}s` }}>
                <Segment to={tip} w1={8} w2={3} bend={2} bristles={2} />
                {banded && (
                  <circle r={3.2} className="fw-mark" fill="var(--fw-mark)" />
                )}
              </g>
            </g>
          </g>
        </g>
      </g>
    </g>
    </g>
  );
};

const Eye = ({
  cx,
  cy,
  r,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  delay: number;
}) => (
  <g transform={`translate(${cx} ${cy})`}>
    <g
      className='fw-anim fw-blink'
      style={{ ["--fw-d" as string]: `${delay}s` }}>
      <circle r={r + 2} fill={BODY_DEEP} />
      <circle r={r} fill='var(--fw-eye)' className='fw-mark' />
      <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.32} fill='#fafafa' />
    </g>
  </g>
);

const Fang = ({ side, size }: { side: 1 | -1; size: number }) => (
  <g transform={`translate(${240 - side * 13} 262) scale(${side * size} ${size})`}>
    <g className='fw-anim fw-fang'>
      <path d='M-5 0 C -4 11, 2 21, 13 26 C 6 17, 3 9, 4 0 Z' fill={BONE} />
    </g>
  </g>
);

const FOLIUM_LEFT: readonly Point[] = [
  [240, 66],
  [222, 71],
  [214, 83],
  [225, 91],
  [209, 103],
  [222, 113],
  [213, 125],
  [227, 133],
  [232, 147],
  [240, 154],
];

const FOLIUM_PATH = (() => {
  const right = [...FOLIUM_LEFT].reverse().map(([x, y]) => [480 - x, y]);
  const pts = [...FOLIUM_LEFT, ...right.slice(1, -1)];
  return `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
})();

/**
 * The folium — the leaf-shaped pattern real spiders wear on the abdomen.
 * Side dots join at tier 2, a ring of chevrons at tier 3.
 */
const AbdomenMarking = ({ tier }: { tier: 1 | 2 | 3 }) => (
  <g className="fw-mark" fill="var(--fw-mark)">
    <path
      className="fw-folium"
      d={FOLIUM_PATH}
      stroke="var(--fw-mark)"
      strokeWidth={3}
      strokeLinejoin="round"
      opacity={0.78}
    />
    <path
      d="M240 74 L240 146 M228 96 L240 104 L252 96 M230 120 L240 127 L250 120"
      stroke={BODY_DEEP}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      opacity={0.55}
    />
    {tier >= 2 && (
      <>
        <circle cx={192} cy={98} r={4.5} />
        <circle cx={288} cy={98} r={4.5} />
        <circle cx={190} cy={124} r={3.5} />
        <circle cx={290} cy={124} r={3.5} />
      </>
    )}
  </g>
);

/** Spikes along the head and the abdomen rim — the late levels' spider is a queen. */
const Crown = () => (
  <g fill={BODY_RIM}>
    <path d="M168 96 L150 84 L164 112 Z" />
    <path d="M312 96 L330 84 L316 112 Z" />
    <path d="M186 70 L176 50 L198 64 Z" />
    <path d="M294 70 L304 50 L282 64 Z" />
    <path d="M214 58 L212 38 L226 55 Z" />
    <path d="M266 58 L268 38 L254 55 Z" />
    <path d='M204 168 L210 146 L218 164 Z' />
    <path d='M226 160 L234 136 L242 158 Z' />
    <path d='M238 158 L246 136 L254 160 Z' />
    <path d='M262 164 L270 146 L276 168 Z' />
  </g>
);

/**
 * The Fretweaver — the spider boss, drawn and animated in SVG. Idle loops are
 * CSS (cheap next to the tab worker and the mic); a strike, a bite or a slam
 * plays a one-shot through the Web Animations API, so a stream of notes never
 * re-renders the drawing.
 */
const FretweaverArtImpl = ({
  mood = "idle",
  strikeTick = 0,
  biteTick = 0,
  slamTick = 0,
  windup = false,
  phase = 0,
  molting = false,
  exposed = false,
  legsLost = 0,
  tier: levelTier = 1,
  pattern = [1, 2, 3, 4],
  intro = false,
  webTorn,
  className,
}: FretweaverArtProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const flashRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<SVGGElement>(null);
  const lungeRef = useRef<SVGGElement>(null);
  const slashRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const wasMoltingRef = useRef(false);
  // Later phases wear later levels' markings: banded legs, then the crown.
  const tier = Math.max(levelTier, phase + 1) as 1 | 2 | 3;

  // Out of the molt in one burst: a flash and a pop into the new form.
  useEffect(() => {
    const doneMolting = wasMoltingRef.current && !molting;
    wasMoltingRef.current = molting;
    if (!doneMolting || prefersReducedMotion()) return;
    flashRef.current?.animate?.(
      [{ filter: "brightness(1)" }, { filter: "brightness(2.6)" }, { filter: "brightness(1)" }],
      { duration: 500, easing: "ease-out" },
    );
    lungeRef.current?.animate?.(
      [
        { transform: "scale(0.9)" },
        { transform: "scale(1.1)", offset: 0.45 },
        { transform: "scale(1)" },
      ],
      { duration: 520, easing: "ease-out" },
    );
  }, [molting]);

  useEffect(() => {
    if (!strikeTick || prefersReducedMotion()) return undefined;
    // Hit-stop: the idle loops freeze for a beat while the cut lands.
    const svg = svgRef.current;
    svg?.classList.add("fw-hitstop");
    const release = window.setTimeout(() => svg?.classList.remove("fw-hitstop"), HIT_STOP_MS);
    const strength = 10;
    slashRef.current?.animate?.(
      [
        { strokeDashoffset: 1, opacity: 1 },
        { strokeDashoffset: 0, opacity: 1, offset: 0.4 },
        { strokeDashoffset: 0, opacity: 0 },
      ],
      { duration: 420, easing: "ease-out" },
    );
    shakeRef.current?.animate?.(
      [
        { transform: "translate(0px, 0px)" },
        { transform: `translate(${-strength}px, -2px)` },
        { transform: `translate(${strength * 0.8}px, 1px)` },
        { transform: `translate(${-strength * 0.4}px, 0px)` },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: 360, easing: "ease-out" },
    );
    flashRef.current?.animate?.(
      [{ filter: "brightness(1)" }, { filter: "brightness(2.2)" }, { filter: "brightness(1)" }],
      { duration: 300, easing: "ease-out" },
    );
    return () => {
      window.clearTimeout(release);
      svg?.classList.remove("fw-hitstop");
    };
  }, [strikeTick]);

  useEffect(() => {
    if (!biteTick || prefersReducedMotion()) return;
    lungeRef.current?.animate?.(
      [
        { transform: "scale(1) translateY(0px)" },
        { transform: "scale(1.04) translateY(5px)", offset: 0.4 },
        { transform: "scale(1) translateY(0px)" },
      ],
      { duration: 220, easing: "ease-out" },
    );
  }, [biteTick]);

  useEffect(() => {
    if (!slamTick || prefersReducedMotion()) return;
    lungeRef.current?.animate?.(
      [
        { transform: "scale(1.05) translateY(-14px)" },
        { transform: "scale(1.16) translateY(18px)", offset: 0.35 },
        { transform: "scale(1) translateY(0px)" },
      ],
      { duration: 480, easing: "ease-out" },
    );
  }, [slamTick]);

  // Front leg is finger 1. Legs tap in the level's order, both sides together.
  const tapStep = 0.16;
  const tapDelayFor = (legIndex: number) => {
    const order = pattern.indexOf(legIndex + 1);
    return (order < 0 ? legIndex : order) * tapStep;
  };

  const abdomenId = `fw-abd-${uid}`;
  const headId = `fw-head-${uid}`;
  const lost = new Set<string>(LEG_LOSS_ORDER.slice(0, legsLost));
  const legsOf = (side: "L" | "R") =>
    LEGS.map((leg, i) => (
      <Leg
        key={i}
        leg={leg}
        index={i}
        tapDelay={tapDelayFor(i)}
        banded={tier >= 2}
        lost={lost.has(`${side}${i}`)}
      />
    ));

  return (
    <div
      ref={flashRef}
      className={cn("relative select-none", className)}
      style={lookStyle(mood, phase)}>
      <svg
        ref={svgRef}
        viewBox='0 0 480 380'
        className={cn(
          "h-full w-full",
          mood === "defeated" && "fw-defeated",
          windup && mood !== "defeated" && !molting && "fw-windup",
          molting && mood === "idle" && "fw-molting",
          exposed && mood === "idle" && !molting && "fw-exposed",
        )}
        role='img'
        aria-label='The Fretweaver, a giant spider'>
        <style>{CSS}</style>
        <defs>
          <radialGradient id={abdomenId} cx='0.42' cy='0.35' r='0.75'>
            <stop offset='0%' stopColor='#3f3f46' />
            <stop offset='55%' stopColor={BODY_FILL} />
            <stop offset='100%' stopColor={BODY_DEEP} />
          </radialGradient>
          <radialGradient
            id={headId}
            gradientUnits="userSpaceOnUse"
            cx={240}
            cy={186}
            r={78}>
            <stop offset='0%' stopColor='#3f3f46' />
            <stop offset='100%' stopColor={BODY_DEEP} />
          </radialGradient>
        </defs>

        {webTorn !== undefined && <SpiderWeb torn={webTorn} />}

        <g className={cn(intro && "fw-intro")}>
          <line
            className='fw-thread'
            x1={240}
            y1={-10}
            x2={240}
            y2={150}
            stroke='#71717a'
            strokeWidth={1.5}
          />
          <g className='fw-grow'>
          <g ref={shakeRef}>
            <g ref={lungeRef} className='fw-anim fw-body'>
              <g className='fw-anim fw-bob'>
                {/* Abdomen sits behind everything; legs root on the head. */}
                <ellipse
                  cx={240}
                  cy={126}
                  rx={86}
                  ry={72}
                  fill={`url(#${abdomenId})`}
                  stroke={BODY_RIM}
                  strokeWidth={2.5}
                />
                <AbdomenMarking tier={tier} />

                <g>{legsOf("L")}</g>
                <g transform="matrix(-1 0 0 1 480 0)">{legsOf("R")}</g>

                {tier >= 3 && <Crown />}
                {/* Cephalothorax */}
                <ellipse
                  cx={240}
                  cy={206}
                  rx={58}
                  ry={48}
                  fill={`url(#${headId})`}
                  stroke={BODY_RIM}
                  strokeWidth={2.5}
                />

                {/* Pedipalps */}
                {[1, -1].map((side) => (
                  <g
                    key={side}
                    transform={`translate(${240 - side * 26} 240) scale(${side} 1)`}>
                    <Segment to={[-16, 18]} w1={9} w2={7} bend={2} />
                    <g transform='translate(-16 18)'>
                      <Segment to={[6, 18]} w1={7} w2={4} bend={-2} />
                    </g>
                  </g>
                ))}

                {/* Chelicerae + fangs */}
                <Fang side={1} size={PHASE_LOOKS[phase].fang} />
                <Fang side={-1} size={PHASE_LOOKS[phase].fang} />
                <ellipse
                  cx={226}
                  cy={246}
                  rx={14}
                  ry={19}
                  fill={BODY_FILL}
                  stroke={BODY_RIM}
                  strokeWidth={2}
                />
                <ellipse
                  cx={254}
                  cy={246}
                  rx={14}
                  ry={19}
                  fill={BODY_FILL}
                  stroke={BODY_RIM}
                  strokeWidth={2}
                />

                {/* Eyes: two big, two side, four small on top */}
                <Eye cx={226} cy={198} r={10} delay={0} />
                <Eye cx={254} cy={198} r={10} delay={0} />
                <Eye cx={206} cy={186} r={6} delay={0.1} />
                <Eye cx={274} cy={186} r={6} delay={0.1} />
                <Eye cx={219} cy={175} r={3.6} delay={0.2} />
                <Eye cx={233} cy={170} r={3.6} delay={0.2} />
                <Eye cx={247} cy={170} r={3.6} delay={0.2} />
                <Eye cx={261} cy={175} r={3.6} delay={0.2} />
                {/* Brow ridge over the main eyes: the difference between cute and a boss. */}
                {[1, -1].map((side) => (
                  <path
                    key={side}
                    transform={side < 0 ? "matrix(-1 0 0 1 480 0)" : undefined}
                    d="M211 184 L238.5 199 L241 199 L241 182 L211 180.5 Z"
                    fill={`url(#${headId})`}
                  />
                ))}
                {[1, -1].map((side) => (
                  <line
                    key={side}
                    transform={side < 0 ? "matrix(-1 0 0 1 480 0)" : undefined}
                    x1={212}
                    y1={184.5}
                    x2={238}
                    y2={198.6}
                    stroke={BODY_DEEP}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                ))}
              </g>
            </g>
          </g>
          </g>
        </g>
        {/* The sword's cut, drawn across the spider on every strike. */}
        <path
          ref={slashRef}
          d='M112 70 Q236 150 368 318'
          stroke='#fafafa'
          strokeWidth={7}
          strokeLinecap='round'
          pathLength={1}
          strokeDasharray='1'
          strokeDashoffset={1}
          opacity={0}
          fill='none'
          pointerEvents='none'
        />
      </svg>
    </div>
  );
};

export const FretweaverArt = memo(FretweaverArtImpl);
