import { cn } from "assets/lib/utils";
import { memo, useEffect, useId, useRef } from "react";

export type ChangelingMood = "idle" | "defeated" | "victorious";

/** The fight's form, 0-based: emerald, then amber, then the orange of its last. */
export type ChangelingForm = 0 | 1 | 2;

/** The face the mask wears: the comedy of a major chord or the tragedy of a minor one. */
export type ChangelingExpression = "major" | "minor";

interface ChangelingArtProps {
  mood?: ChangelingMood;
  /** Bumped on every sword strike — a cut, a flash and a hard shudder. */
  strikeTick?: number;
  /** Bumped on every bite — a clawed hand lashes out, the hands taking turns. */
  biteTick?: number;
  /** Bumped when a rush lands — it drops and its orbs flare. */
  slamTick?: number;
  /** A rush is coming: it rises with its hands raised. */
  windup?: boolean;
  /** A rush is under way: the whole changeling flickers. */
  quaking?: boolean;
  form?: ChangelingForm;
  /** Between phases: shrinking into its cloak while it takes a new shape. */
  molting?: boolean;
  /** Its weak spots are open: the orbs pulse white. */
  exposed?: boolean;
  /** Tatters torn off the hem so far (0–8), the outer ones first; a molt mends them. */
  tattersLost?: number;
  /** The chord it is right now — the mask turns on every change. */
  expression?: ChangelingExpression;
  /** Bumped on every chord change: the mask turns over even when the face stays. */
  changeTick?: number;
  /** Orbs around it, one per tone of its chord. */
  tones?: number;
  /** Rise out of the dark when first shown. */
  intro?: boolean;
  className?: string;
}

const RIM = "#52525b";
const DEEP = "#09090b";
const CLOTH_DARK = "#18181b";
const HAND = "#a1a1aa";

/** How long the idle loops freeze when a strike lands. */
const HIT_STOP_MS = 80;
/** How long the mask takes to turn over on a change. */
const TURN_MS = 300;

const CSS = `
.cg-anim { transform-box: view-box; transform-origin: 0 0; }
.cg-float { animation: cg-float var(--cg-float) ease-in-out infinite; }
.cg-sway { animation: cg-sway var(--cg-sway) ease-in-out infinite; }
.cg-bob { animation: cg-bob 2.6s ease-in-out infinite; }
.cg-hand { transform-box: view-box; transform-origin: 196px 222px; transition: transform 320ms cubic-bezier(0.22,1,0.36,1); }
.cg-body { transform-box: view-box; transform-origin: 240px 300px; transition: transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms; }
.cg-grow { transform-box: view-box; transform-origin: 240px 380px; transform: scale(var(--cg-scale)); transition: transform 600ms cubic-bezier(0.22,1,0.36,1); }
.cg-intro { animation: cg-intro 1200ms cubic-bezier(0.22,1,0.36,1) both; }
.cg-face { transition: opacity 0s linear ${TURN_MS / 2}ms; }
.cg-orb { transition: opacity 300ms, stroke 400ms; }
.cg-drop { transition: transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 500ms; }
.cg-lost { transform: translateY(70px) rotate(var(--cg-tumble)); opacity: 0; }
.cg-windup .cg-body { transform: translateY(-14px); transition-duration: 300ms; }
.cg-windup .cg-hand { transform: rotate(-28deg) translateY(-16px); }
.cg-quaking .cg-float { animation: cg-flicker 0.14s linear infinite; }
.cg-molting .cg-float { animation: cg-flicker 0.16s linear infinite; }
.cg-molting .cg-body { transform: translateY(18px) scale(0.86); opacity: 0.5; transition-duration: 500ms; }
.cg-defeated .cg-float, .cg-defeated .cg-sway, .cg-defeated .cg-bob { animation: none; }
.cg-defeated .cg-body { transform: translateY(34px) rotate(-3deg); opacity: 0.45; }
.cg-defeated .cg-hand { transform: rotate(14deg) translateY(18px); }
.cg-victorious .cg-hand { transform: rotate(-20deg) translateY(-8px); }
.cg-hitstop, .cg-hitstop * { animation-play-state: paused !important; }
.cg-exposed .cg-orb { animation: cg-expose 0.45s ease-in-out infinite alternate; }
@keyframes cg-expose { from { stroke: var(--cg-mark); } to { stroke: #f4f4f5; } }
@keyframes cg-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes cg-sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(3deg); } }
@keyframes cg-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes cg-flicker { 0%, 100% { transform: translate(0, 0); opacity: 1; } 25% { transform: translate(-3px, 1px); opacity: 0.8; } 50% { transform: translate(3px, -1px); } 75% { transform: translate(-1px, 2px); opacity: 0.9; } }
@keyframes cg-intro { from { transform: translateY(240px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .cg-float, .cg-sway, .cg-bob, .cg-intro, .cg-orb { animation: none !important; }
  .cg-grow, .cg-hand, .cg-body, .cg-drop { transition: none; }
}
`;

interface FormLook {
  eye: string;
  mark: string;
  /** How much faster its idle loops run. */
  pace: number;
  scale: number;
}

/** Emerald eyes and orbs, then amber, then the orange of its last form. */
const FORM_LOOKS: readonly FormLook[] = [
  { eye: "#6ee7b7", mark: "#059669", pace: 1, scale: 1 },
  { eye: "#fcd34d", mark: "#d97706", pace: 1.35, scale: 1.04 },
  { eye: "#fb923c", mark: "#ea580c", pace: 1.9, scale: 1.08 },
];

/** Loop lengths in seconds: floating, hand sway. */
const IDLE_LOOPS = [4.6, 3.2] as const;
const GLOAT_LOOPS = [1.2, 0.9] as const;

const lookStyle = (mood: ChangelingMood, form: ChangelingForm): React.CSSProperties => {
  const look = FORM_LOOKS[form];
  const defeated = mood === "defeated";
  const loops = mood === "victorious" ? GLOAT_LOOPS : IDLE_LOOPS.map((sec) => sec / look.pace);
  const [float, sway] = loops.map((sec) => `${sec.toFixed(2)}s`);
  return {
    ["--cg-eye" as string]: defeated ? "#52525b" : look.eye,
    ["--cg-mark" as string]: defeated ? "#3f3f46" : look.mark,
    ["--cg-scale" as string]: look.scale,
    ["--cg-float" as string]: float,
    ["--cg-sway" as string]: sway,
  };
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const MIRROR = "matrix(-1 0 0 1 480 0)";

/** A cowl drawn to a point, the sides falling onto the shoulders. */
const HOOD =
  "M240 14 C264 34 302 58 320 94 C336 128 336 170 320 198 C308 216 288 224 270 226 L210 226 C192 224 172 216 160 198 C144 170 144 128 160 94 C178 58 216 34 240 14 Z";
const HOOD_OPENING =
  "M240 68 C274 68 294 96 294 132 C294 166 272 194 240 198 C208 194 186 166 186 132 C186 96 206 68 240 68 Z";
const ROBE =
  "M196 196 C166 202 148 226 140 262 C130 304 114 332 98 352 L382 352 C366 332 350 304 340 262 C332 226 314 202 284 196 Z";
const FOLDS = [
  "M222 222 C216 268 208 308 194 350",
  "M258 222 C264 268 272 308 286 350",
  "M240 220 C240 270 240 310 240 350",
  "M176 250 C168 290 154 324 136 350",
  "M304 250 C312 290 326 324 344 350",
];
const MASK =
  "M240 84 C266 84 282 104 282 130 C282 160 264 182 240 186 C216 182 198 160 198 130 C198 104 214 84 240 84 Z";
/** A wide sleeve hanging from the shoulder, the claws reaching out of its cuff. */
const SLEEVE = "M204 214 C178 224 152 248 134 272 L120 294 L162 298 C170 276 186 256 212 242 Z";
const CLAWS = "M126 296 L114 320 M136 298 L130 324 M148 298 L148 324 M158 296 L164 318";

/** A comedy eye arches up; a tragedy eye droops at its outer end, under a brow raised in the middle. */
const EYE_MAJOR = "M210 124 Q222 108 234 124 Q222 118 210 124 Z";
const EYE_MINOR = "M210 116 Q222 132 234 118 Q222 122 210 116 Z";
const BROW_MINOR = "M208 110 L232 102";
const MOUTH_MAJOR = "M216 148 Q240 178 264 148 Q240 162 216 148 Z";
const MOUTH_MINOR = "M216 168 Q240 140 264 168 Q240 156 216 168 Z";

interface TatterShape {
  d: string;
  origin: string;
  tumble: number;
}

/** The hem's tatters, left to right. */
const TATTERS: readonly TatterShape[] = Array.from({ length: 8 }, (_, i) => {
  const x = 104 + i * 34;
  return {
    d: `M${x} 350 L${x + 32} 350 L${x + 26} 374 L${x + 18} 364 L${x + 11} 378 L${x + 5} 362 Z`,
    origin: `${x + 16}px 360px`,
    tumble: i % 2 ? 18 : -18,
  };
});

/** Outer tatters first, working in from both ends. */
const TATTER_LOSS_ORDER = [0, 7, 1, 6, 2, 5, 3, 4] as const;

/** Where the orbs float: an arc over the hood, the outer ones first. */
const ORBS: readonly [number, number][] = [
  [110, 172],
  [370, 172],
  [134, 84],
  [346, 84],
];

/**
 * The Changeling — the changes boss, drawn and animated in SVG like the
 * others. A cloaked shape behind a mask that turns over on every chord
 * change: comedy for a major chord, tragedy for a minor one. An orb floats
 * around it for each tone of the chord; its hem tears as a phase's HP goes.
 * Idle loops are CSS; strikes, lashes and turns are one-shots through the Web
 * Animations API, so the notes never re-render the drawing.
 */
const ChangelingArtImpl = ({
  mood = "idle",
  strikeTick = 0,
  biteTick = 0,
  slamTick = 0,
  windup = false,
  quaking = false,
  form = 0,
  molting = false,
  exposed = false,
  tattersLost = 0,
  expression = "minor",
  changeTick = 0,
  tones = 3,
  intro = false,
  className,
}: ChangelingArtProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const flashRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const shakeRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const maskRef = useRef<SVGGElement>(null);
  const orbsRef = useRef<SVGGElement>(null);
  const slashRef = useRef<SVGPathElement>(null);
  const leftHandRef = useRef<SVGGElement>(null);
  const rightHandRef = useRef<SVGGElement>(null);
  const wasMoltingRef = useRef(false);

  // Out of the change of shape in one burst: a flash and a pop into the new form.
  useEffect(() => {
    const doneMolting = wasMoltingRef.current && !molting;
    wasMoltingRef.current = molting;
    if (!doneMolting || prefersReducedMotion()) return;
    flashRef.current?.animate?.(
      [{ filter: "brightness(1)" }, { filter: "brightness(2.4)" }, { filter: "brightness(1)" }],
      { duration: 500, easing: "ease-out" },
    );
    bodyRef.current?.animate?.(
      [{ transform: "scale(0.86)" }, { transform: "scale(1.06)", offset: 0.45 }, { transform: "scale(1)" }],
      { duration: 520, easing: "ease-out" },
    );
  }, [molting]);

  // Every change: the mask turns edge-on and back, the new face swapped in
  // while it can't be seen (.cg-face waits half the turn).
  useEffect(() => {
    if (!changeTick || prefersReducedMotion()) return;
    maskRef.current?.animate?.(
      [{ transform: "scaleX(1)" }, { transform: "scaleX(0.04)", offset: 0.5 }, { transform: "scaleX(1)" }],
      { duration: TURN_MS, easing: "ease-in-out" },
    );
  }, [changeTick]);

  useEffect(() => {
    if (!strikeTick || prefersReducedMotion()) return undefined;
    // Hit-stop: the idle loops freeze for a beat while the cut lands.
    const svg = svgRef.current;
    svg?.classList.add("cg-hitstop");
    const release = window.setTimeout(() => svg?.classList.remove("cg-hitstop"), HIT_STOP_MS);
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
        { transform: "translate(-7px, -1px)" },
        { transform: "translate(6px, 1px)" },
        { transform: "translate(-3px, 0px)" },
        { transform: "translate(0px, 0px)" },
      ],
      { duration: 360, easing: "ease-out" },
    );
    flashRef.current?.animate?.(
      [{ filter: "brightness(1)" }, { filter: "brightness(2)" }, { filter: "brightness(1)" }],
      { duration: 300, easing: "ease-out" },
    );
    return () => {
      window.clearTimeout(release);
      svg?.classList.remove("cg-hitstop");
    };
  }, [strikeTick]);

  // A bite: a clawed hand lashes out at the player, left and right in turn.
  useEffect(() => {
    if (!biteTick || prefersReducedMotion()) return;
    const hand = biteTick % 2 ? leftHandRef.current : rightHandRef.current;
    hand?.animate?.(
      [
        { transform: "scale(1) translate(0px, 0px)" },
        { transform: "scale(1.25) translate(-10px, 12px)", offset: 0.35 },
        { transform: "scale(1) translate(0px, 0px)" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }, [biteTick]);

  // A rush lands: it drops on the player and its orbs flare.
  useEffect(() => {
    if (!slamTick || prefersReducedMotion()) return;
    bodyRef.current?.animate?.(
      [
        { transform: "translateY(-14px)" },
        { transform: "translateY(18px)", offset: 0.3 },
        { transform: "translateY(0px)" },
      ],
      { duration: 520, easing: "ease-out" },
    );
    orbsRef.current?.animate?.(
      [{ opacity: 1 }, { opacity: 0.2, offset: 0.3 }, { opacity: 1 }],
      { duration: 600, easing: "ease-out" },
    );
  }, [slamTick]);

  const clothId = `cg-cloth-${uid}`;
  const maskId = `cg-mask-${uid}`;
  const cloth = `url(#${clothId})`;
  const lost = new Set<number>(TATTER_LOSS_ORDER.slice(0, tattersLost));
  const major = expression === "major";

  const hand = (handRef: React.Ref<SVGGElement>) => (
    <g className='cg-hand'>
      <g className='cg-anim cg-sway' style={{ transformOrigin: "200px 222px" }}>
        <g ref={handRef} className='cg-anim' style={{ transformOrigin: "140px 296px" }}>
          <path d={SLEEVE} fill={cloth} stroke={RIM} strokeWidth={2.2} strokeLinejoin='round' />
          <path d={CLAWS} stroke={HAND} strokeWidth={3} strokeLinecap='round' fill='none' />
        </g>
      </g>
    </g>
  );

  return (
    <div ref={flashRef} className={cn("relative select-none", className)} style={lookStyle(mood, form)}>
      <svg
        ref={svgRef}
        viewBox='0 0 480 380'
        className={cn(
          "h-full w-full",
          mood === "defeated" && "cg-defeated",
          mood === "victorious" && "cg-victorious",
          windup && mood === "idle" && !molting && "cg-windup",
          quaking && mood === "idle" && !molting && "cg-quaking",
          molting && mood === "idle" && "cg-molting",
          exposed && mood === "idle" && !molting && "cg-exposed",
        )}
        role='img'
        aria-label='The Changeling, a cloaked shape behind a mask'>
        <style>{CSS}</style>
        <defs>
          <linearGradient id={clothId} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#3f3f46' />
            <stop offset='55%' stopColor='#27272a' />
            <stop offset='100%' stopColor={CLOTH_DARK} />
          </linearGradient>
          <linearGradient id={maskId} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#e4e4e7' />
            <stop offset='100%' stopColor='#a1a1aa' />
          </linearGradient>
        </defs>

        <g className={cn(intro && "cg-intro")}>
          <g className='cg-grow'>
            <g ref={shakeRef}>
              <g ref={bodyRef} className='cg-anim cg-body'>
                <g className='cg-anim cg-float'>
                  {/* The orbs: one for each tone of the chord it is. */}
                  <g ref={orbsRef}>
                    {ORBS.map(([cx, cy], i) => (
                      <g key={i} className='cg-anim cg-bob' style={{ animationDelay: `${i * -0.65}s` }}>
                        <circle
                          className='cg-orb'
                          cx={cx}
                          cy={cy}
                          r={11}
                          fill={DEEP}
                          stroke='var(--cg-mark)'
                          strokeWidth={3.5}
                          opacity={i < tones ? 1 : 0}
                        />
                        <circle cx={cx} cy={cy} r={3.5} fill='var(--cg-eye)' opacity={i < tones ? 1 : 0} className='cg-orb' />
                      </g>
                    ))}
                  </g>

                  {/* Robe, its folds and the tattered hem */}
                  <path d={ROBE} fill={cloth} stroke={RIM} strokeWidth={2.4} strokeLinejoin='round' />
                  <path d={FOLDS.join(" ")} stroke={DEEP} strokeWidth={2.4} strokeLinecap='round' fill='none' />
                  {TATTERS.map((tatter, i) => (
                    <g
                      key={i}
                      className={cn("cg-anim cg-drop", lost.has(i) && "cg-lost")}
                      style={{ transformOrigin: tatter.origin, ["--cg-tumble" as string]: `${tatter.tumble}deg` }}>
                      <path d={tatter.d} fill={CLOTH_DARK} stroke={RIM} strokeWidth={2} strokeLinejoin='round' />
                    </g>
                  ))}

                  {/* Hands out of the sleeves */}
                  <g>{hand(leftHandRef)}</g>
                  <g transform={MIRROR}>{hand(rightHandRef)}</g>

                  {/* Hood and the dark inside it */}
                  <path d={HOOD} fill={cloth} stroke={RIM} strokeWidth={2.4} strokeLinejoin='round' />
                  <path d={HOOD_OPENING} fill={DEEP} />

                  {/* The mask, turning over on every change */}
                  <g ref={maskRef} className='cg-anim' style={{ transformOrigin: "240px 135px" }}>
                    <path d={MASK} fill={`url(#${maskId})`} stroke='#d4d4d8' strokeWidth={1.5} />
                    <path d='M240 88 V104' stroke='var(--cg-mark)' strokeWidth={3} strokeLinecap='round' />
                    <g className='cg-face' style={{ opacity: major ? 1 : 0 }}>
                      {[undefined, MIRROR].map((transform, i) => (
                        <g key={i} transform={transform}>
                          <path d={EYE_MAJOR} fill={DEEP} />
                          <circle cx={222} cy={118} r={2.6} fill='var(--cg-eye)' />
                        </g>
                      ))}
                      <path d={MOUTH_MAJOR} fill={DEEP} />
                    </g>
                    <g className='cg-face' style={{ opacity: major ? 0 : 1 }}>
                      {[undefined, MIRROR].map((transform, i) => (
                        <g key={i} transform={transform}>
                          <path d={EYE_MINOR} fill={DEEP} />
                          <circle cx={222} cy={122} r={2.6} fill='var(--cg-eye)' />
                          <path d={BROW_MINOR} stroke={RIM} strokeWidth={3} strokeLinecap='round' />
                        </g>
                      ))}
                      <path d={MOUTH_MINOR} fill={DEEP} />
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* The sword's cut, drawn across the changeling on every strike. */}
        <path
          ref={slashRef}
          d='M116 80 Q238 160 366 314'
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

export const ChangelingArt = memo(ChangelingArtImpl);
