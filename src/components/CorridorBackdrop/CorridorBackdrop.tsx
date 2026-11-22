import {
  AudioWaveform,
  CalendarDays,
  CassetteTape,
  Clock,
  Coffee,
  Compass,
  Crown,
  Disc3,
  Drum,
  Ear,
  Flag,
  Flame,
  Footprints,
  Gamepad2,
  Gem,
  Ghost,
  Guitar,
  Hand,
  Headphones,
  Heart,
  Hourglass,
  Lightbulb,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  Medal,
  Mic,
  MicVocal,
  Mountain,
  Music,
  Music2,
  Music4,
  PartyPopper,
  Piano,
  Pizza,
  Radio,
  Rocket,
  Route,
  Signpost,
  Skull,
  Smile,
  Speaker,
  Star,
  Swords,
  Target,
  ThumbsUp,
  Timer,
  Trophy,
  Volume2,
  Zap,
} from "lucide-react";
import { useId } from "react";

import type { DoodleItem } from "./doodleLayout";
import { buildDoodleLayout, doodleRadius } from "./doodleLayout";

/** The three pages that sit between the rest of the app: where you pick what to play. */
export type CorridorPage = "practice" | "next" | "path";

// Mostly music and play, plus a few odd ones so it reads as a doodle wall, not a legend.
const SHARED_ICONS: LucideIcon[] = [
  Guitar, Music, Music2, Music4, Mic, MicVocal, Headphones, Radio, Disc3, Drum,
  Piano, Speaker, AudioWaveform, CassetteTape, Volume2, Ear, Hand, Star, Heart,
  Zap, Flame, Trophy, Medal, Crown, Target, Rocket, Gamepad2, Smile, ThumbsUp,
  Swords, Gem, Skull, Ghost, Coffee, Pizza, PartyPopper, Lightbulb, Clock,
];

// Each page sneaks in a few of its own, so the walls differ without changing style.
const PAGE_ICONS: Record<CorridorPage, LucideIcon[]> = {
  practice: [Timer, Hourglass, CalendarDays],
  next: [Signpost, Flag, Footprints],
  path: [MapIcon, MapPin, Mountain, Compass, Route],
};

const PAGE_SEED: Record<CorridorPage, number> = { practice: 11, next: 23, path: 37 };

const TILE = 800;

const layouts = new Map<CorridorPage, { icons: LucideIcon[]; items: DoodleItem[] }>();
const getLayout = (page: CorridorPage) => {
  let layout = layouts.get(page);
  if (!layout) {
    const icons = [...SHARED_ICONS, ...PAGE_ICONS[page]];
    layout = {
      icons,
      items: buildDoodleLayout({
        tile: TILE,
        seed: PAGE_SEED[page],
        iconKinds: icons.length,
        iconCount: 220,
        fillerCount: 420,
        minIconSize: 24,
        maxIconSize: 58,
        gap: 4,
      }),
    };
    layouts.set(page, layout);
  }
  return layout;
};

// An item hanging over an edge is drawn again on the opposite side, so the cut
// halves meet when the tile repeats.
const wrapOffsets = (item: DoodleItem) => {
  const r = doodleRadius(item) + 2;
  const xs = [0, item.x - r < 0 ? TILE : item.x + r > TILE ? -TILE : null];
  const ys = [0, item.y - r < 0 ? TILE : item.y + r > TILE ? -TILE : null];
  return xs.flatMap((dx) => ys.flatMap((dy) => (dx === null || dy === null ? [] : [[dx, dy] as const])));
};

const STAR_PATH = "M0 -1 L0.24 -0.24 L1 0 L0.24 0.24 L0 1 L-0.24 0.24 L-1 0 L-0.24 -0.24 Z";

const Doodle = ({ item, icons }: { item: DoodleItem; icons: LucideIcon[] }) => {
  if (item.kind === "icon") {
    const Icon = icons[item.icon];
    const half = item.size / 2;
    return (
      <g transform={`translate(${item.x} ${item.y}) rotate(${item.rotate}) translate(${-half} ${-half})`}>
        <Icon size={item.size} strokeWidth={1.4} absoluteStrokeWidth color='currentColor' />
      </g>
    );
  }
  if (item.kind === "dot") return <circle cx={item.x} cy={item.y} r={item.size / 2} fill='currentColor' />;
  if (item.kind === "ring")
    return <circle cx={item.x} cy={item.y} r={item.size / 2} fill='none' stroke='currentColor' strokeWidth={1.3} />;
  return (
    <path
      d={STAR_PATH}
      fill='currentColor'
      transform={`translate(${item.x} ${item.y}) rotate(${item.rotate}) scale(${item.size / 2})`}
    />
  );
};

/** Doodle wallpaper: scattered icons of mixed size and angle with dots, rings and stars between. */
const DoodleWallpaper = ({ page }: { page: CorridorPage }) => {
  const patternId = useId();
  const { icons, items } = getLayout(page);

  // text-white is the palette ink: white on the dark theme, near-black on the
  // light one. Quieter on black, where white lines catch the eye more; the
  // light theme raises it (corridor-doodles in globals.css).
  return (
    <svg className='corridor-doodles absolute inset-0 h-full w-full text-white opacity-[0.045]'>
      <defs>
        <pattern id={patternId} width={TILE} height={TILE} patternUnits='userSpaceOnUse'>
          {items.flatMap((item, i) =>
            wrapOffsets(item).map(([dx, dy]) => (
              <g key={`${i}:${dx}:${dy}`} transform={dx || dy ? `translate(${dx} ${dy})` : undefined}>
                <Doodle item={item} icons={icons} />
              </g>
            ))
          )}
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#${patternId})`} />
    </svg>
  );
};

// Light falling from the ceiling, even across the whole width (no corner, so
// ultrawide looks the same), fading out by under half the screen. Cyan because
// these pages are about "next", but the muted 800 shade, not the neon one; the
// light theme turns it into pale gold (cyan-800 → amber-200 in the palette).
// Alpha eases out over many stops: a two-stop fade on near-black shows bands.
const WASH_STOPS: [number, number][] = [
  [0, 0.28],
  [6, 0.23],
  [13, 0.16],
  [21, 0.1],
  [30, 0.05],
  [38, 0.02],
  [46, 0],
];
const WASH = `linear-gradient(180deg, ${WASH_STOPS.map(
  ([at, alpha]) => `rgb(var(--c-cyan-800) / ${alpha}) ${at}%`
).join(", ")})`;

/**
 * Wall behind Practice, What Next and Learning path. Drawn by the layout across
 * the whole area beside the sidebar (not the content column), so it runs edge
 * to edge on any width and stays put while the page scrolls over it. Those
 * pages drop the PageShell card and lie straight on it. Both layers take their
 * colours from the palette, so the light theme gets ink doodles under a gold light.
 */
export const CorridorBackdrop = ({ page }: { page: CorridorPage }) => (
  <div aria-hidden className='pointer-events-none absolute inset-0'>
    <div className='absolute inset-0' style={{ background: WASH }} />
    <DoodleWallpaper page={page} />
  </div>
);
