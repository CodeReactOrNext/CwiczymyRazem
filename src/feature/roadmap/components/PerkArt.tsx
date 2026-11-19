import { cn } from "assets/lib/utils";
import { type KostekMood, KostekStill } from "components/Mascot/Kostek";
import type { ReactNode } from "react";

export type PerkArtKind = "badge" | "roadmap" | "coach" | "shop" | "guild";

// Supporter amber, the colour of the badge and the avatar ring. Each shape
// carries the hex and the matching palette class: the class is what shows in
// the app (and follows the light theme), the hex is there for renders outside
// it (email art, previews).
const AMBER = { fill: "#fbbf24", className: "fill-amber-400" };
const AMBER_DEEP = { fill: "#f59e0b", className: "fill-amber-500" };
const AMBER_DARK = { fill: "#d97706", className: "fill-amber-600" };
const PLATE = { fill: "#3f3f46", className: "fill-zinc-700" };
const PLATE_LIGHT = { fill: "#52525b", className: "fill-zinc-600" };
const PAPER = { fill: "#a1a1aa", className: "fill-zinc-400" };
const PAPER_LIGHT = { fill: "#d4d4d8", className: "fill-zinc-300" };
const BODY = "var(--mascot-fg, #FBFBFA)";
const BODY_SHADE = "var(--mascot-shade, #DCDCD6)";

/** Kostek placed inside the drawing: `h` tall, top-left corner at (x, y). */
const KostekAt = ({
  x,
  y,
  h,
  mood,
  lookAt,
  hands = true,
}: {
  x: number;
  y: number;
  h: number;
  mood: KostekMood;
  lookAt?: "left" | "right" | "down";
  /** Off where the scene draws the hands itself, holding something. */
  hands?: boolean;
}) => (
  <svg x={x} y={y} width={(h * 112) / 110} height={h} viewBox='0 0 112 110' overflow='visible'>
    <KostekStill mood={mood} lookAt={lookAt} hands={hands} fg={BODY} shade={BODY_SHADE} bg='var(--mascot-cut, #18181b)' />
  </svg>
);

/** One of Kostek's mitts, for a scene where it holds something. */
const Mitt = ({ x, y, r = 10 }: { x: number; y: number; r?: number }) => (
  <>
    <circle cx={x + 1.2} cy={y + 1.2} r={r} fill={BODY_SHADE} />
    <circle cx={x} cy={y} r={r - 1.2} fill={BODY} />
  </>
);

const STAR = "M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z";
const Sparkle = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <path d={STAR} transform={`translate(${x} ${y}) scale(${s})`} {...AMBER} />
);

/** The supporter badge: Kostek, delighted, holding up a medal with a heart on it. */
const Badge = () => (
  <>
    <KostekAt x={44} y={2} h={150} mood='celebrate' hands={false} />
    {/* The ribbon tails hang under the medal, clear of the face. */}
    <path d='M98 132 L88 174 L104 164 L116 176 L118 138 Z' {...AMBER_DARK} />
    <path d='M142 132 L152 174 L136 164 L124 176 L122 138 Z' {...AMBER_DEEP} />
    <circle cx={120} cy={112} r={38} {...AMBER_DEEP} />
    <circle cx={120} cy={110} r={33} {...AMBER} />
    <path
      d='M120 131 C100 116 98 99 108 94 C114 91.5 118.5 95 120 99.5 C121.5 95 126 91.5 132 94 C142 99 140 116 120 131 Z'
      fill='#FBFBFA'
    />
    <Mitt x={80} y={112} />
    <Mitt x={160} y={112} />
    <Sparkle x={34} y={50} s={1.1} />
    <Sparkle x={208} y={38} s={0.8} />
    <Sparkle x={214} y={104} s={1.3} />
  </>
);

/** Deciding what gets built: a board of pinned ideas, Kostek pointing at the one it backs. */
const Board = () => (
  <>
    <rect x={14} y={30} width={112} height={112} rx={12} {...PLATE} />
    {[
      { x: 26, y: 42, tone: PAPER },
      { x: 74, y: 42, tone: PAPER_LIGHT },
      { x: 26, y: 90, tone: PAPER_LIGHT },
      { x: 74, y: 90, tone: AMBER },
    ].map(({ x, y, tone }) => (
      <g key={`${x}-${y}`}>
        <rect x={x} y={y} width={40} height={40} rx={6} {...tone} />
        <circle cx={x + 20} cy={y + 2} r={4} {...(tone === AMBER ? AMBER_DEEP : PLATE_LIGHT)} />
      </g>
    ))}
    <KostekAt x={128} y={44} h={104} mood='nudge' lookAt='left' />
  </>
);

/** A roadmap for your goal: Kostek reading an unfolded map, the route drawn in from "you are here" to the flag. */
const RouteMap = () => (
  <>
    <KostekAt x={49} y={0} h={140} mood='idle' lookAt='down' hands={false} />
    {/* Three folds, held open in front of it. */}
    <path d='M30 92 L84 80 L84 164 L30 176 Z' {...PAPER_LIGHT} />
    <path d='M84 80 L156 92 L156 176 L84 164 Z' {...PAPER} />
    <path d='M156 92 L210 80 L210 164 L156 176 Z' {...PAPER_LIGHT} />
    <path
      d='M48 156 C66 156 66 126 88 126 C110 126 108 150 130 150 C152 150 150 122 178 116'
      fill='none'
      stroke='#f59e0b'
      className='stroke-amber-500'
      strokeWidth={5}
      strokeLinecap='round'
      strokeDasharray='1 11'
    />
    <circle cx={48} cy={156} r={6} {...PLATE_LIGHT} />
    {/* The goal: a flag planted at the end of the route. */}
    <rect x={182} y={86} width={4} height={34} rx={2} {...PLATE} />
    <path d='M186 86 L208 94 L186 103 Z' {...AMBER} />
    <Mitt x={30} y={122} />
    <Mitt x={210} y={120} />
  </>
);

/** Dressing up the profile and the rig: Kostek in a crown and a cape, a skinned pedal on a cable beside it. */
const DressUp = () => (
  <>
    {/* The cape shows either side of the body, which narrows under it. */}
    <path
      d='M53 74 C40 104 36 136 26 158 C36 166 44 156 54 162 C64 168 72 158 82 162 C90 166 98 158 108 162 C118 166 126 158 136 162 C146 166 156 156 166 158 C156 136 152 104 139 74 Z'
      {...AMBER_DEEP}
    />
    <path
      d='M96 74 C93 110 93 138 96 160 C100 163 104 160 108 162 C118 166 126 158 136 162 C146 166 156 156 166 158 C156 136 152 104 139 74 Z'
      {...AMBER_DARK}
    />
    <KostekAt x={30} y={30} h={130} mood='hop' />
    <path d='M72 46 L76 16 L88 34 L96 10 L104 34 L116 16 L120 46 Z' {...AMBER} />
    <rect x={70} y={41} width={52} height={10} rx={5} {...AMBER_DEEP} />
    {/* The rig: a pedal in the supporter's colours, its cable trailing off. */}
    <path
      d='M178 138 C164 142 170 164 152 170'
      fill='none'
      stroke='#a1a1aa'
      className='stroke-zinc-400'
      strokeWidth={3.5}
      strokeLinecap='round'
    />
    <rect x={176} y={86} width={50} height={78} rx={8} {...AMBER_DEEP} />
    <rect x={176} y={86} width={50} height={40} rx={8} {...AMBER} />
    <circle cx={191} cy={104} r={7} {...PLATE} />
    <circle cx={211} cy={104} r={7} {...PLATE} />
    <circle cx={201} cy={144} r={10} {...PAPER_LIGHT} />
    <Sparkle x={150} y={26} s={1.2} />
    <Sparkle x={22} y={62} s={0.8} />
    <Sparkle x={206} y={58} s={0.9} />
  </>
);

/** A guild: its shield, with a pick for a crest, and Kostek standing guard by it. */
const Guild = () => (
  <>
    <path d='M70 24 C88 34 106 34 124 28 L124 92 C124 124 100 148 70 160 C40 148 16 124 16 92 L16 28 C34 34 52 34 70 24 Z' {...PLATE_LIGHT} />
    <path d='M70 38 C84 45 98 46 112 42 L112 92 C112 116 94 136 70 146 C46 136 28 116 28 92 L28 42 C42 46 56 45 70 38 Z' {...PLATE} />
    <path d='M70 122 C62 122 44 96 44 80 C44 68 54 62 70 62 C86 62 96 68 96 80 C96 96 78 122 70 122 Z' {...AMBER} />
    <KostekAt x={112} y={46} h={108} mood='duel' />
  </>
);

const ART: Record<PerkArtKind, () => ReactNode> = {
  badge: Badge,
  roadmap: Board,
  coach: RouteMap,
  shop: DressUp,
  guild: Guild,
};

/**
 * The pictures on the supporter perks: one flat scene per perk with Kostek in
 * it, in the mascot's own style — body colour, its shade, and the supporter
 * amber for the thing the perk is about.
 */
export const PerkArt = ({ kind, className }: { kind: PerkArtKind; className?: string }) => {
  const Scene = ART[kind];
  return (
    <svg viewBox='0 0 240 180' aria-hidden className={cn("overflow-visible", className)}>
      <Scene />
    </svg>
  );
};
