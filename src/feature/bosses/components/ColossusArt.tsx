import { cn } from "assets/lib/utils";
import { memo, useEffect, useId, useRef } from "react";

export type ColossusMood = "idle" | "defeated" | "victorious";

/** The fight's form, 0-based: cold, then amber, then the orange of its last. */
export type ColossusForm = 0 | 1 | 2;

interface ColossusArtProps {
  mood?: ColossusMood;
  /** Bumped on every sword strike — a cut, a flash and a hard shudder. */
  strikeTick?: number;
  /** Bumped on every missed chord — one fist punches out, the fists taking turns. */
  biteTick?: number;
  /** Bumped when a quake lands — both fists into the ground, which cracks. */
  slamTick?: number;
  /** A quake is coming: it rears up with its fists raised. */
  windup?: boolean;
  /** A quake is under way: the whole colossus shakes. */
  quaking?: boolean;
  form?: ColossusForm;
  /** Between phases: crumbling and shaking while it re-forms. */
  molting?: boolean;
  /** The weak change is next: the rune in its chest pulses white. */
  exposed?: boolean;
  /** Armor plates knocked off so far (0–8), the bracers first; a molt puts them back. */
  platesLost?: number;
  /** Rise out of the ground when first shown. */
  intro?: boolean;
  className?: string;
}

type Point = readonly [number, number];

const RIM = "#52525b";
const PLATE_RIM = "#71717a";
const DEEP = "#18181b";
const CRACK = "#09090b";

/** How long the idle loops freeze when a strike lands. */
const HIT_STOP_MS = 80;

const CSS = `
.cl-anim { transform-box: view-box; transform-origin: 0 0; }
.cl-breathe { animation: cl-breathe var(--cl-breathe) ease-in-out infinite; }
.cl-sway { animation: cl-sway var(--cl-sway) ease-in-out infinite; }
.cl-blink { animation: cl-blink 6.4s ease-in-out infinite; }
.cl-arm { transform-box: view-box; transform-origin: 128px 150px; transition: transform 320ms cubic-bezier(0.22,1,0.36,1); }
.cl-body { transform-box: view-box; transform-origin: 240px 300px; transition: transform 700ms cubic-bezier(0.22,1,0.36,1), opacity 700ms; }
.cl-grow { transform-box: view-box; transform-origin: 240px 380px; transform: scale(var(--cl-scale)); transition: transform 600ms cubic-bezier(0.22,1,0.36,1); }
.cl-intro { animation: cl-intro 1200ms cubic-bezier(0.22,1,0.36,1) both; }
.cl-mark { transition: fill 400ms; }
.cl-drop { transition: transform 500ms cubic-bezier(0.22,1,0.36,1), opacity 500ms; }
.cl-lost { transform: translateY(90px) rotate(var(--cl-tumble)); opacity: 0; }
.cl-windup .cl-body { transform: translateY(-12px); transition-duration: 300ms; }
.cl-windup .cl-arm { transform: rotate(26deg) translateY(-18px); }
.cl-quaking .cl-breathe { animation: cl-shake 0.12s linear infinite; }
.cl-molting .cl-breathe { animation: cl-shake 0.14s linear infinite; }
.cl-molting .cl-body { transform: translateY(14px) scale(0.92); opacity: 0.55; transition-duration: 500ms; }
.cl-molting .cl-arm { transform: rotate(-6deg); }
.cl-defeated .cl-breathe, .cl-defeated .cl-sway, .cl-defeated .cl-blink { animation: none; }
.cl-defeated .cl-blink { transform: scaleY(0.15); }
.cl-defeated .cl-body { transform: translateY(30px) rotate(-4deg); opacity: 0.45; }
.cl-defeated .cl-arm { transform: rotate(-10deg) translateY(16px); }
.cl-victorious .cl-arm { transform: rotate(18deg) translateY(-10px); }
.cl-hitstop, .cl-hitstop * { animation-play-state: paused !important; }
.cl-exposed .cl-rune { animation: cl-expose 0.45s ease-in-out infinite alternate; }
@keyframes cl-expose { from { stroke: var(--cl-mark); } to { stroke: #f4f4f5; } }
@keyframes cl-breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(4px); } }
@keyframes cl-sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(2.5deg); } }
@keyframes cl-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(0.15); } }
@keyframes cl-shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-3px, 1px); } 50% { transform: translate(3px, -1px); } 75% { transform: translate(-1px, 2px); } }
@keyframes cl-intro { from { transform: translateY(260px); } to { transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .cl-breathe, .cl-sway, .cl-blink, .cl-intro, .cl-rune { animation: none !important; }
  .cl-grow, .cl-arm, .cl-body, .cl-drop { transition: none; }
}
`;

interface FormLook {
  eye: string;
  mark: string;
  /** How much faster its idle loops run. */
  pace: number;
  scale: number;
}

/** Cold cyan runes, then amber, then the orange of its last form. */
const FORM_LOOKS: readonly FormLook[] = [
  { eye: "#67e8f9", mark: "#0e7490", pace: 1, scale: 1 },
  { eye: "#fcd34d", mark: "#d97706", pace: 1.35, scale: 1.04 },
  { eye: "#fb923c", mark: "#ea580c", pace: 1.9, scale: 1.08 },
];

/** Loop lengths in seconds: breathing, arm sway. */
const IDLE_LOOPS = [4.2, 3.4] as const;
const GLOAT_LOOPS = [1.1, 0.9] as const;

const lookStyle = (mood: ColossusMood, form: ColossusForm): React.CSSProperties => {
  const look = FORM_LOOKS[form];
  const defeated = mood === "defeated";
  const loops = mood === "victorious" ? GLOAT_LOOPS : IDLE_LOOPS.map((sec) => sec / look.pace);
  const [breathe, sway] = loops.map((sec) => `${sec.toFixed(2)}s`);
  return {
    ["--cl-eye" as string]: defeated ? "#52525b" : look.eye,
    ["--cl-mark" as string]: defeated ? "#3f3f46" : look.mark,
    ["--cl-scale" as string]: look.scale,
    ["--cl-breathe" as string]: breathe,
    ["--cl-sway" as string]: sway,
  };
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** A rough-hewn block — every stone is a hand-placed polygon, no two edges alike. */
const polygon = (points: readonly Point[]) =>
  `M${points.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;

const HEAD = polygon([[212, 66], [234, 54], [258, 57], [274, 72], [279, 98], [270, 119], [251, 128], [228, 127], [209, 116], [203, 90]]);
const TORSO = polygon([[146, 118], [196, 106], [240, 112], [286, 104], [334, 120], [358, 158], [347, 214], [331, 264], [306, 302], [240, 309], [174, 302], [149, 264], [133, 214], [122, 158]]);
const HIPS = polygon([[176, 290], [304, 290], [318, 318], [298, 346], [182, 346], [162, 318]]);
const LEG = polygon([[182, 334], [226, 330], [234, 384], [176, 384]]);
const SHOULDER = polygon([[84, 138], [98, 108], [130, 98], [162, 106], [178, 132], [171, 171], [146, 191], [108, 189], [88, 168]]);
const UPPER_ARM = polygon([[102, 170], [140, 163], [149, 204], [141, 240], [104, 243], [95, 206]]);
const FOREARM = polygon([[92, 232], [142, 228], [151, 262], [146, 297], [96, 299], [85, 266]]);
const FIST = polygon([[70, 293], [99, 280], [137, 282], [160, 299], [162, 331], [147, 352], [103, 356], [77, 342], [66, 317]]);

interface PlateShape {
  d: string;
  /** Its middle — what it tumbles around as it falls. */
  origin: string;
  tumble: number;
}

/** Left-side plates, in the order they come off; the right side mirrors them. */
const PLATES: readonly PlateShape[] = [
  // Bracer on the forearm
  { d: polygon([[93, 241], [140, 236], [147, 252], [141, 269], [97, 271], [89, 255]]), origin: "118px 254px", tumble: -24 },
  // Lower chest
  { d: polygon([[171, 215], [219, 209], [223, 274], [183, 287], [160, 251]]), origin: "192px 248px", tumble: -12 },
  // Upper chest
  { d: polygon([[153, 131], [217, 121], [221, 199], [169, 207], [142, 167]]), origin: "182px 165px", tumble: 14 },
  // Pauldron over the shoulder
  { d: polygon([[79, 126], [101, 96], [148, 89], [179, 108], [173, 139], [129, 148], [89, 150]]), origin: "128px 120px", tumble: -30 },
];

/** Back to front: bracers, lower chest, upper chest, pauldrons — side by side. */
const PLATE_LOSS_ORDER = ["L0", "R0", "L1", "R1", "L2", "R2", "L3", "R3"] as const;

/** Cracks in the stone under the plates — bared as the plates come off. */
const CRACKS = [
  "M176 138 L194 156 L188 174 L203 191",
  "M170 230 L183 240 L178 257 L195 271",
  "M209 146 L215 170 L207 187",
  "M196 224 L210 243 L203 262",
];

/** Chips and seams on the bare stone, so it reads as rock and not as a casing. */
const CHIPS = [
  "M112 118 L126 126",
  "M150 176 L160 184",
  "M86 324 L100 332",
  "M204 300 L218 296",
  "M190 340 L204 336",
  "M106 196 L118 202",
];

/** Knuckle seams on a fist. */
const KNUCKLES = "M78 304 L96 300 L118 296 L140 298 L156 306 M98 300 L94 288 M118 296 L117 284 M140 298 L142 287";

const Plate = ({ plate, fill, lost }: { plate: PlateShape; fill: string; lost: boolean }) => (
  <g
    className={cn("cl-anim cl-drop", lost && "cl-lost")}
    style={{ transformOrigin: plate.origin, ["--cl-tumble" as string]: `${plate.tumble}deg` }}>
    <path d={plate.d} fill={fill} stroke={PLATE_RIM} strokeWidth={2} strokeLinejoin='round' />
  </g>
);

interface ArmProps {
  stone: string;
  plate: string;
  bracerLost: boolean;
  fistRef: React.Ref<SVGGElement>;
}

/** Upper arm, forearm with its bracer, and the fist — swung from the shoulder. */
const Arm = ({ stone, plate, bracerLost, fistRef }: ArmProps) => (
  <g className='cl-arm'>
    <g className='cl-anim cl-sway' style={{ transformOrigin: "120px 166px" }}>
      <path d={UPPER_ARM} fill={stone} stroke={RIM} strokeWidth={2.2} strokeLinejoin='round' />
      <path d={FOREARM} fill={stone} stroke={RIM} strokeWidth={2.2} strokeLinejoin='round' />
      <Plate plate={PLATES[0]} fill={plate} lost={bracerLost} />
      <g ref={fistRef} className='cl-anim' style={{ transformOrigin: "114px 318px" }}>
        <path d={FIST} fill={stone} stroke={RIM} strokeWidth={2.4} strokeLinejoin='round' />
        <path d={KNUCKLES} stroke={DEEP} strokeWidth={2.4} strokeLinecap='round' strokeLinejoin='round' fill='none' />
      </g>
    </g>
  </g>
);

/**
 * The Stone Colossus — the chord boss, drawn and animated in SVG like the
 * Fretweaver. Its armor plates come off as a phase's HP goes, baring the
 * cracked stone underneath; its rune lights up when the weak change is next.
 * Idle loops are CSS; strikes, punches and quakes are one-shots through the
 * Web Animations API, so the strums never re-render the drawing.
 */
const ColossusArtImpl = ({
  mood = "idle",
  strikeTick = 0,
  biteTick = 0,
  slamTick = 0,
  windup = false,
  quaking = false,
  form = 0,
  molting = false,
  exposed = false,
  platesLost = 0,
  intro = false,
  className,
}: ColossusArtProps) => {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const flashRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const shakeRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const slashRef = useRef<SVGPathElement>(null);
  const groundRef = useRef<SVGPathElement>(null);
  const leftFistRef = useRef<SVGGElement>(null);
  const rightFistRef = useRef<SVGGElement>(null);
  const wasMoltingRef = useRef(false);

  // Out of the re-forming in one burst: a flash and a pop into the new form.
  useEffect(() => {
    const doneMolting = wasMoltingRef.current && !molting;
    wasMoltingRef.current = molting;
    if (!doneMolting || prefersReducedMotion()) return;
    flashRef.current?.animate?.(
      [{ filter: "brightness(1)" }, { filter: "brightness(2.4)" }, { filter: "brightness(1)" }],
      { duration: 500, easing: "ease-out" },
    );
    bodyRef.current?.animate?.(
      [{ transform: "scale(0.92)" }, { transform: "scale(1.06)", offset: 0.45 }, { transform: "scale(1)" }],
      { duration: 520, easing: "ease-out" },
    );
  }, [molting]);

  useEffect(() => {
    if (!strikeTick || prefersReducedMotion()) return undefined;
    // Hit-stop: the idle loops freeze for a beat while the cut lands.
    const svg = svgRef.current;
    svg?.classList.add("cl-hitstop");
    const release = window.setTimeout(() => svg?.classList.remove("cl-hitstop"), HIT_STOP_MS);
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
      svg?.classList.remove("cl-hitstop");
    };
  }, [strikeTick]);

  // A missed chord: a fist punches out at the player, left and right in turn.
  useEffect(() => {
    if (!biteTick || prefersReducedMotion()) return;
    const fist = biteTick % 2 ? leftFistRef.current : rightFistRef.current;
    fist?.animate?.(
      [
        { transform: "scale(1) translateY(0px)" },
        { transform: "scale(1.22) translateY(8px)", offset: 0.35 },
        { transform: "scale(1) translateY(0px)" },
      ],
      { duration: 300, easing: "ease-out" },
    );
  }, [biteTick]);

  // A quake lands: the body drops onto its fists and the ground splits.
  useEffect(() => {
    if (!slamTick || prefersReducedMotion()) return;
    bodyRef.current?.animate?.(
      [
        { transform: "translateY(-12px)" },
        { transform: "translateY(16px)", offset: 0.3 },
        { transform: "translateY(0px)" },
      ],
      { duration: 520, easing: "ease-out" },
    );
    groundRef.current?.animate?.(
      [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }],
      { duration: 900, easing: "ease-out" },
    );
  }, [slamTick]);

  const stoneId = `cl-stone-${uid}`;
  const plateId = `cl-plate-${uid}`;
  const stone = `url(#${stoneId})`;
  const plate = `url(#${plateId})`;
  const lost = new Set<string>(PLATE_LOSS_ORDER.slice(0, platesLost));
  // The arm hangs under the shoulder block; the plates are strapped over both.
  const side = (key: "L" | "R", fistRef: React.Ref<SVGGElement>) => (
    <>
      <Arm stone={stone} plate={plate} bracerLost={lost.has(`${key}0`)} fistRef={fistRef} />
      <path d={SHOULDER} fill={stone} stroke={RIM} strokeWidth={2.4} strokeLinejoin='round' />
      {PLATES.slice(1).map((shape, i) => (
        <Plate key={i} plate={shape} fill={plate} lost={lost.has(`${key}${i + 1}`)} />
      ))}
    </>
  );

  return (
    <div ref={flashRef} className={cn("relative select-none", className)} style={lookStyle(mood, form)}>
      <svg
        ref={svgRef}
        viewBox='0 0 480 380'
        className={cn(
          "h-full w-full",
          mood === "defeated" && "cl-defeated",
          mood === "victorious" && "cl-victorious",
          windup && mood === "idle" && !molting && "cl-windup",
          quaking && mood === "idle" && !molting && "cl-quaking",
          molting && mood === "idle" && "cl-molting",
          exposed && mood === "idle" && !molting && "cl-exposed",
        )}
        role='img'
        aria-label='The Stone Colossus, a giant of cut stone'>
        <style>{CSS}</style>
        <defs>
          <radialGradient id={stoneId} cx='0.42' cy='0.3' r='0.85'>
            <stop offset='0%' stopColor='#3f3f46' />
            <stop offset='60%' stopColor='#27272a' />
            <stop offset='100%' stopColor={DEEP} />
          </radialGradient>
          <linearGradient id={plateId} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor='#52525b' />
            <stop offset='100%' stopColor='#3f3f46' />
          </linearGradient>
        </defs>

        {/* The ground splitting under a quake. */}
        <path
          ref={groundRef}
          d='M96 374 L150 362 L186 370 L214 358 L240 368 L266 358 L294 370 L330 362 L384 374'
          stroke='var(--cl-eye)'
          strokeWidth={3}
          strokeLinejoin='round'
          fill='none'
          opacity={0}
        />

        <g className={cn(intro && "cl-intro")}>
          <g className='cl-grow'>
            <g ref={shakeRef}>
              <g ref={bodyRef} className='cl-anim cl-body'>
                <g className='cl-anim cl-breathe'>
                  {/* Legs and hips, mostly below the frame */}
                  <path d={LEG} fill={stone} stroke={RIM} strokeWidth={2.2} strokeLinejoin='round' />
                  <path d={LEG} transform='matrix(-1 0 0 1 480 0)' fill={stone} stroke={RIM} strokeWidth={2.2} strokeLinejoin='round' />
                  <path d={HIPS} fill={stone} stroke={RIM} strokeWidth={2.2} strokeLinejoin='round' />

                  {/* Torso */}
                  <path d={TORSO} fill={stone} stroke={RIM} strokeWidth={2.5} strokeLinejoin='round' />
                  <path d={CHIPS.join(" ")} stroke={DEEP} strokeWidth={2.2} strokeLinecap='round' fill='none' />
                  {CRACKS.map((d) => (
                    <g key={d}>
                      <path d={d} stroke={CRACK} strokeWidth={2.4} strokeLinecap='round' strokeLinejoin='round' fill='none' />
                      <path d={d} transform='matrix(-1 0 0 1 480 0)' stroke={CRACK} strokeWidth={2.4} strokeLinecap='round' strokeLinejoin='round' fill='none' />
                    </g>
                  ))}

                  {/* The rune carved into its core, between the chest plates */}
                  <path d={polygon([[227, 146], [253, 144], [259, 184], [254, 224], [226, 226], [220, 186]])} fill={DEEP} />
                  <path
                    className='cl-rune'
                    d='M240 156 V214 M240 178 L228 164 M240 178 L252 164 M240 196 L229 209 M240 196 L251 209'
                    stroke='var(--cl-mark)'
                    strokeWidth={4.5}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    fill='none'
                  />

                  <g>{side("L", leftFistRef)}</g>
                  <g transform='matrix(-1 0 0 1 480 0)'>{side("R", rightFistRef)}</g>

                  {/* Head, sunk between the shoulders */}
                  <path d={HEAD} fill={stone} stroke={RIM} strokeWidth={2.4} strokeLinejoin='round' />
                  {/* Eyes deep under a heavy brow that slopes to the middle: a scowl. */}
                  {[1, -1].map((facing) => (
                    <g key={facing} transform={facing < 0 ? "matrix(-1 0 0 1 480 0)" : undefined}>
                      <path d={polygon([[214, 92], [235, 99], [234, 106], [216, 101]])} fill={DEEP} />
                      <g className='cl-anim cl-blink' style={{ transformOrigin: "225px 100px" }}>
                        <path d={polygon([[217, 95], [232, 100], [231, 104], [218, 100]])} fill='var(--cl-eye)' className='cl-mark' />
                      </g>
                      <path d={polygon([[204, 84], [238, 96], [240, 90], [211, 76]])} fill={RIM} />
                    </g>
                  ))}
                  <path d='M222 116 L231 112 L240 117 L249 112 L258 116' stroke={DEEP} strokeWidth={2.4} strokeLinecap='round' strokeLinejoin='round' fill='none' />
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* The sword's cut, drawn across the colossus on every strike. */}
        <path
          ref={slashRef}
          d='M110 76 Q236 156 370 318'
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

export const ColossusArt = memo(ColossusArtImpl);
