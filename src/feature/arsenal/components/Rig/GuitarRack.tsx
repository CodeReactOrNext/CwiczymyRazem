import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import {
  getConditionGrade,
  getEffectiveRarity,
  getItemCondition,
  getItemLevel,
} from "feature/arsenal/data/itemStats";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import type { MotionValue } from "framer-motion";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { ArrowLeftRight, CirclePlus, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef } from "react";

import type { InventoryItem, RigSetup } from "../../types/arsenal.types";
import { ConditionMeter } from "../ConditionMeter";
import { GuitarCard } from "../GuitarInventory/GuitarCard";
import { LevelEmblem } from "../LevelEmblem";
import { RARITY_STYLES } from "../RarityBadge";

/** Bays read as places, not indexes — "the second one", not "slot 1". */
const BAY_NUMERALS = ["I", "II", "III"];

/** Column classes for the three bays — spelled out so Tailwind sees them. */
const BAY_COLUMN = ["md:col-start-1", "md:col-start-2", "md:col-start-3"];

/** The colour the back wall reaches at the floor — and the floor's own colour. */
const WALL_FLOOR = "#060708";

/** The back wall of every bay: lighter up by the lamp, near-black at the floor. */
const WALL = `linear-gradient(180deg, #101215 0%, #0b0c0f 45%, ${WALL_FLOOR} 100%)`;

/** Darkens the edges so each bay reads as a niche, not a flat panel. */
const VIGNETTE =
  "radial-gradient(95% 100% at 50% 40%, transparent 38%, rgba(0,0,0,0.8) 100%)";

/**
 * Film grain for the back wall, so the light lands on a surface rather than on
 * a flat fill. Desaturated, unlike the card noise, so it never tints the lamp.
 */
const WALL_GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E")`;

/** `0..1` → the two hex digits CSS wants after a `#rrggbb`. */
const alphaHex = (v: number) =>
  Math.round(Math.max(0, Math.min(1, v)) * 255)
    .toString(16)
    .padStart(2, "0");

/**
 * Every gradient the lamp paints, for a lamp in `color` driven at `s` (`1` is
 * a full-rarity bay, `0` is switched off). Plain strings, so the lamp can be
 * brought up frame by frame without the bay re-rendering.
 */
const lampLayers = (color: string, s: number) => {
  const a = (v: number) => `${color}${alphaHex(v * s)}`;
  return {
    spill: [
      `radial-gradient(24% 9% at 50% 3.5%, ${a(0.38)} 0%, ${a(0.12)} 55%, transparent 100%)`,
      `radial-gradient(48% 12% at 50% 100%, ${a(0.07)} 0%, transparent 100%)`,
      `radial-gradient(110% 105% at 50% 6%, ${a(0.15)} 0%, ${a(0.075)} 40%, ${a(0.025)} 70%, transparent 92%)`,
    ].join(", "),
    beam: `conic-gradient(from 0deg at 50% -8%, transparent 148deg, ${a(0.09)} 164deg, ${a(0.18)} 180deg, ${a(0.09)} 196deg, transparent 212deg)`,
    underLedge: `radial-gradient(22% 100% at 50% 0%, ${a(0.6)} 0%, ${a(0.25)} 40%, transparent 100%)`,
    ledge: [
      "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 20%, transparent 40%, transparent 60%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.85) 100%)",
      `radial-gradient(20% 300% at 50% 100%, ${a(0.4)} 0%, transparent 100%)`,
      "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.4) 100%)",
      WALL_FLOOR,
    ].join(", "),
    fixture: `linear-gradient(${a(0.55)}, ${a(0.55)}), rgba(255,255,255,${0.5 * s})`,
    fixtureGlow: `0 0 5px 1px ${a(0.45)}, 0 0 14px 3px ${a(0.28)}`,
    floor: [
      "linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.45) 14%, transparent 32%, transparent 68%, rgba(0,0,0,0.45) 86%, rgba(0,0,0,0.85) 100%)",
      `radial-gradient(46% 220% at 50% 0%, ${a(0.5)} 0%, ${a(0.16)} 55%, transparent 100%)`,
      "radial-gradient(70% 300% at 50% 0%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 50%, transparent 100%)",
      WALL_FLOOR,
    ].join(", "),
  };
};

interface LampProps {
  /** `#rrggbb` — the rarity for an occupied bay, white for an empty one. */
  color: string;
  /** How hard the lamp is driven right now; `1` is a full-rarity bay. */
  level: MotionValue<number>;
}

/**
 * Everything the lamp above a bay does to the wall behind it.
 *
 * Back to front: a wide ambient spill that colours the whole niche, a beam
 * that widens as it comes down the wall and dies before the floor, a hot spot
 * right around the fixture, light spilling in under the ledge at the top, the
 * ledge itself, and the floor with its pool where the beam lands. All of it is
 * the light, none of it the wall — the wall stays a plain dark gradient
 * underneath, and so do the ledge, the floor, the grain and the vignette when
 * the lamp is off.
 */
const Lamp = ({ color, level }: LampProps) => {
  const spill = useTransform(level, (s) => lampLayers(color, s).spill);
  const beam = useTransform(level, (s) => lampLayers(color, s).beam);
  const underLedge = useTransform(
    level,
    (s) => lampLayers(color, s).underLedge,
  );
  const ledge = useTransform(level, (s) => lampLayers(color, s).ledge);
  const fixture = useTransform(level, (s) => lampLayers(color, s).fixture);
  const fixtureGlow = useTransform(
    level,
    (s) => lampLayers(color, s).fixtureGlow,
  );
  const floor = useTransform(level, (s) => lampLayers(color, s).floor);
  return (
    <>
      {/* Ambient spill + hot spot + floor pool. */}
      <motion.div
        className='pointer-events-none absolute inset-0'
        style={{ background: spill }}
      />
      {/* The beam: a cone from the fixture, masked so it fades on the way down. */}
      <motion.div
        className='pointer-events-none absolute inset-0'
        style={{
          background: beam,
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 30%, rgba(0,0,0,0.5) 65%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 30%, rgba(0,0,0,0.5) 65%, transparent 100%)",
        }}
      />
      {/* Light spilling in under the ledge: only where the fixture is. A
          tight patch under the lamp that is already gone a third of the way
          across the bay, so the top corners stay as dark as the wall. */}
      <motion.div
        className='pointer-events-none absolute inset-x-0 top-[1.2%] h-[8%]'
        style={{ background: underLedge }}
      />
      {/* The ledge across the top: the underside of the shelf above the bay,
          a thin dark lip. It only catches light right above the fixture and
          falls to black toward the sides. */}
      <motion.div
        className='pointer-events-none absolute inset-x-0 top-0 h-[1.2%]'
        style={{ background: ledge }}
      />
      {/* The fixture itself: a short strip light under the ledge, its core
          almost white, with the colour in the glow around it. */}
      <motion.div
        className='pointer-events-none absolute left-1/2 top-[0.5%] h-[2px] w-[7%] -translate-x-1/2 rounded-full'
        style={{ background: fixture, boxShadow: fixtureGlow }}
      />
      {/* The wall darkens just above the floor, so the floor reads as a lit
          surface meeting a dark one rather than as a stripe on the wall. */}
      <div className='pointer-events-none absolute inset-x-0 bottom-[2%] h-1/5 bg-gradient-to-t from-black/75 to-transparent' />
      {/* The floor: the wall's own bottom colour, lit where the beam lands on
          it and falling into shadow toward both sides — the lit patch is an
          ellipse, the lightening of the surface fades out sideways with it,
          and the outer quarter on each side is pulled down to black. */}
      <motion.div
        className='pointer-events-none absolute inset-x-0 bottom-0 h-[2%]'
        style={{ background: floor }}
      />
      {/* The grain, over wall and floor alike, on top of the light so the beam
          picks it out. */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{
          backgroundImage: WALL_GRAIN,
          backgroundSize: "160px 160px",
          opacity: 0.07,
          mixBlendMode: "screen",
        }}
      />
      {/* The edges of the niche, always darker than its middle — floor included,
          so its sides fall off exactly like the wall above them. */}
      <div
        className='pointer-events-none absolute inset-0'
        style={{ background: VIGNETTE }}
      />
    </>
  );
};

/**
 * How a lamp comes up: off, a stutter, on — the way a stage spot catches.
 * Fractions of the lamp's full strength, at `SWITCH_ON_TIMES` of `SWITCH_ON_S`.
 */
const SWITCH_ON = [0, 0.7, 0.12, 0.9, 0.35, 1];
const SWITCH_ON_TIMES = [0, 0.1, 0.18, 0.34, 0.46, 1];
const SWITCH_ON_S = 1.1;

/** How far apart the three bays come on, left to right. */
const BAY_STAGGER_S = 0.35;

/** A bay's lamp on a wall that switches its lamps on: whether the moment has
    come yet, and how long after it this bay's turn is. */
interface LampPower {
  on: boolean;
  delay: number;
}

/**
 * Where a bay's lamp is, `0` (off) to `strength`.
 *
 * Without `power` the lamp simply burns at `strength`, the way the owner's own
 * wall does. With it the lamp waits dark until `power.on`, then comes up once
 * through `SWITCH_ON` — unless the player asked for less motion, in which case
 * it is just on.
 */
const useLampLevel = (strength: number, power?: LampPower) => {
  const reduceMotion = useReducedMotion();
  const switches = power !== undefined;
  const on = power?.on ?? true;
  const delay = power?.delay ?? 0;
  const level = useMotionValue(switches ? 0 : strength);

  useEffect(() => {
    // Burning steadily, or still waiting for its turn in the dark.
    if (!switches || reduceMotion || !on) {
      level.set(switches && !reduceMotion ? 0 : strength);
      return undefined;
    }
    const controls = animate(
      level,
      SWITCH_ON.map((k) => k * strength),
      { duration: SWITCH_ON_S, times: SWITCH_ON_TIMES, delay, ease: "linear" },
    );
    return () => controls.stop();
  }, [level, strength, switches, on, delay, reduceMotion]);

  return level;
};

interface GuitarRackProps {
  slots: RigSetup["guitarSlots"];
  inventory: InventoryItem[];
  /**
   * Leave both out for someone else's wall (their profile): no buttons and no
   * condition — just what hangs there, under its lamp, with its level.
   */
  onOpenPicker?: (slotIndex: number) => void;
  onRemove?: (slotIndex: number) => void;
  onHover?: (
    e: React.MouseEvent | null,
    content: React.ReactNode | null,
  ) => void;
  /** Clicking/tapping a bay opens its card in a modal. */
  onShowCard?: (content: React.ReactNode) => void;
  /**
   * The lamps wait dark and come on, I → II → III, the first time each bay is
   * scrolled into view — a showing for a visitor. Off on the owner's own wall,
   * which they open far too often to sit through it.
   */
  switchOn?: boolean;
}

/**
 * Where the guitar's box starts, measured from the top of the bay: under the
 * numeral, so the tip of the headstock sits just above the yoke's stem.
 */
const GUITAR_TOP = "top-[3.875rem]";

/**
 * Where the guitar's box ends: a touch into the floor strip along the bottom
 * of the bay (see `Lamp`), so the body stands on it and its shadow falls on it.
 */
const GUITAR_BOTTOM = "bottom-[1.5%]";

/**
 * The wall hanger every bay hangs its guitar on, all of it behind the guitar.
 *
 * A stem down the wall and a padded yoke at the height where the neck meets
 * the headstock. The neck sits in the yoke and the headstock rises above it;
 * the arms show either side of the neck, which is what makes it read as
 * hanging rather than as a bracket laid over the tip. The yoke's height is
 * tuned to the nut of a guitar whose box starts at `GUITAR_TOP`.
 */
const Hook = ({ lit }: { lit: boolean }) => {
  const metal = lit ? "#3a3e45" : "#2a2d33";
  const metalDark = lit ? "#1f2226" : "#17191d";
  const pad = lit ? "#111214" : "#0d0e10";
  const gradientId = `yoke-${lit ? "lit" : "dim"}`;
  return (
    <>
      {/* The stem and the padded yoke. */}
      <svg
        aria-hidden
        viewBox='0 0 76 44'
        className='pointer-events-none absolute left-1/2 top-[7rem] z-[5] h-11 w-[4.75rem] -translate-x-1/2'
        style={{ filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.6))" }}>
        <defs>
          <linearGradient id={gradientId} x1='0' x2='0' y1='0' y2='1'>
            <stop offset='0' stopColor={metal} />
            <stop offset='1' stopColor={metalDark} />
          </linearGradient>
        </defs>
        <rect x='34' y='0' width='8' height='34' fill={metalDark} />
        <path
          d='M10 8 V20 C10 32 24 38 38 38 C52 38 66 32 66 20 V8'
          fill='none'
          stroke={`url(#${gradientId})`}
          strokeWidth='8'
          strokeLinecap='round'
        />
        <path
          d='M8 10 V20 M64 10 V20'
          fill='none'
          stroke='rgba(255,255,255,0.09)'
          strokeWidth='2'
          strokeLinecap='round'
        />
        <circle cx='10' cy='7' r='5' fill={pad} />
        <circle cx='66' cy='7' r='5' fill={pad} />
      </svg>
    </>
  );
};

interface BayProps {
  index: number;
  item: InventoryItem | null;
  /** Absent on a read-only wall, where an empty bay is just a bare hook. */
  onOpenPicker?: (slotIndex: number) => void;
  onHover?: GuitarRackProps["onHover"];
  onShowCard?: GuitarRackProps["onShowCard"];
  /** See `GuitarRackProps.switchOn`. */
  switchOn?: boolean;
}

/** A dim lamp: white, only enough to find an empty bay's hook by. */
const EMPTY_LAMP = 0.22;

/**
 * One bay of the rack: a hook under a lamp, and whatever hangs on it.
 *
 * An occupied bay is lit in the guitar's rarity, with its level emblem in
 * one corner. An empty one keeps a dim lamp and, on the owner's own wall, one
 * button to fill it.
 */
const Bay = ({
  index,
  item,
  onOpenPicker,
  onHover,
  onShowCard,
  switchOn = false,
}: BayProps) => {
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;
  const hung = Boolean(item && guitar);
  // Each bay watches for itself: on a phone they are stacked, and a lamp that
  // came on a screen below would be over before anybody saw it.
  const bayRef = useRef<HTMLDivElement>(null);
  const seen = useInView(bayRef, { once: true, amount: 0.5 });
  const light = useLampLevel(
    hung ? 1 : EMPTY_LAMP,
    switchOn ? { on: seen, delay: index * BAY_STAGGER_S } : undefined,
  );
  // The guitar and its emblem are only seen by the lamp's light: dark before
  // it comes on, stuttering with it while it does. At full light the filter
  // is exactly the drop shadow the guitar has always worn.
  const guitarFilter = useTransform(
    light,
    (s) =>
      `${s < 1 ? `brightness(${0.12 + 0.88 * s}) ` : ""}drop-shadow(0 18px 22px rgba(0,0,0,0.85))`,
  );
  const emblemOpacity = useTransform(light, [0, 1], [0, 1]);

  if (!item || !guitar) {
    return (
      <div
        ref={bayRef}
        className={cn(
          "relative flex h-[26rem] flex-col items-center overflow-hidden md:row-start-1 md:h-[36rem]",
          BAY_COLUMN[index],
        )}
        style={{ background: WALL }}>
        <Lamp color='#ffffff' level={light} />
        <Hook lit={false} />
        {/* The one way to fill the bay, where the guitar's body would hang. */}
        {onOpenPicker && (
          <div
            className={cn(
              "absolute inset-x-0 flex items-start justify-center",
              GUITAR_TOP,
              GUITAR_BOTTOM,
            )}>
            <button
              type='button'
              onClick={() => onOpenPicker(index)}
              aria-label={`Fit a guitar in slot ${index + 1}`}
              className='group absolute inset-0 flex flex-col items-center justify-end gap-3 pb-[18%] focus-visible:outline-none'>
              <span className='flex h-12 w-12 items-center justify-center rounded-full text-zinc-300 transition-colors group-hover:bg-zinc-100/10 group-hover:text-white group-focus-visible:ring-1 group-focus-visible:ring-ring'>
                <CirclePlus size={44} strokeWidth={1.1} />
              </span>
              <span className='text-base font-medium text-zinc-300 transition-colors group-hover:text-white'>
                Equip guitar
              </span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // What the guitar *is* now: the workshop can promote it past its mint rarity.
  const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
  const rs = RARITY_STYLES[rarity];
  const level = getItemLevel(item, guitar);
  const card = <GuitarCard item={item} readOnly />;

  return (
    <div
      ref={bayRef}
      className={cn(
        "group relative flex h-[26rem] flex-col items-center overflow-hidden md:row-start-1 md:h-[36rem]",
        onShowCard ? "cursor-pointer" : "cursor-default",
        BAY_COLUMN[index],
      )}
      style={{ background: WALL }}
      onMouseMove={(e) => onHover?.(e, card)}
      onMouseLeave={() => onHover?.(null, null)}
      onClick={() => onShowCard?.(card)}>
      {/* The lamp: the rarity's colour poured down the back wall. Custom Shop
          gets its own ice-cyan light like any other rarity here — the bench's
          animated holo foil is a card treatment, not a wall one. */}
      <Lamp color={rs.baseColor} level={light} />

      <Hook lit />

      {/* The level, in the same rarity-ringed emblem the card wears. */}
      <motion.div
        className='absolute right-5 top-[4rem] z-20'
        style={{ opacity: emblemOpacity }}>
        <LevelEmblem
          level={level}
          rarity={rarity}
          size={40}
          title='Guitar level'
        />
      </motion.div>

      {/* The instrument, hung from the hanger: the box starts just under the
          wall plate, so the headstock tip slips behind it and the neck lands
          in the yoke. The art is a square sized by the box's height so the
          stood-up guitar gets the full drop (see the Dex wall for the same
          trick). */}
      <div
        className={cn(
          "absolute inset-x-0 flex items-center justify-center",
          GUITAR_TOP,
          GUITAR_BOTTOM,
        )}>
        {/* The guitar's shadow on the floor: a crisp ellipse, dark at the core
            with only a soft rim, so it reads as a contact shadow and not as a
            smudge. Sits on the lit patch of floor, which is what makes it show. */}
        <div
          className='pointer-events-none absolute -bottom-[2%] left-1/2 h-[3.6%] w-[48%] -translate-x-1/2 rounded-[100%] blur-[3px]'
          style={{
            background:
              "radial-gradient(50% 50% at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 55%, rgba(0,0,0,0.5) 100%)",
          }}
        />
        <motion.img
          src={getRankBadgeSrc(guitar.imageId, "large")}
          alt={guitar.name}
          className='relative z-10 aspect-square h-full max-w-none -rotate-90 object-contain'
          style={{ filter: guitarFilter }}
          draggable={false}
        />
      </div>
    </div>
  );
};

interface PlateProps {
  index: number;
  item: InventoryItem | null;
  onOpenPicker: (slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
}

/** The label under each bay: what hangs there, its condition, and the way out. */
const Plate = ({ index, item, onOpenPicker, onRemove }: PlateProps) => {
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;
  const numeral = BAY_NUMERALS[index] ?? String(index + 1);

  if (!item || !guitar) {
    return (
      <div
        className={cn(
          "flex min-h-[6rem] items-center justify-between gap-4 px-6 py-5 md:row-start-2",
          BAY_COLUMN[index],
        )}>
        <span className='text-base text-zinc-400'>
          Slot {numeral} <span className='text-zinc-600'>·</span> Empty
        </span>
        <button
          type='button'
          onClick={() => onOpenPicker(index)}
          className='flex items-center gap-2.5 rounded px-3 py-1.5 text-base font-medium text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-100/10 hover:text-white'>
          <CirclePlus size={22} strokeWidth={1.4} className='text-zinc-300' />
          Equip
        </button>
      </div>
    );
  }

  const rarity = getEffectiveRarity(guitar.rarity, item.buildLevel);
  const rs = RARITY_STYLES[rarity];
  const condition = getItemCondition(item);
  const grade = getConditionGrade(condition);
  return (
    <div
      className={cn(
        "flex flex-col gap-4 px-6 py-5 md:row-start-2",
        BAY_COLUMN[index],
      )}>
      {/* What it is, and the ways out — one row, the name taking the room. */}
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <p className='truncate font-display text-xl font-semibold text-zinc-50'>
            {guitar.name}
          </p>
          <p className='mt-0.5 truncate text-sm text-zinc-300'>
            {guitar.brand} <span className='text-zinc-600'>·</span>{" "}
            <span className='font-medium' style={{ color: rs.baseColor }}>
              {rarity}
            </span>{" "}
            <span className='text-zinc-600'>·</span>{" "}
            <span className='text-zinc-500'>
              {item.year} <span className='text-zinc-700'>·</span>{" "}
              {item.country}
            </span>
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <button
            type='button'
            onClick={() => onOpenPicker(index)}
            className='flex items-center gap-2 rounded px-2.5 py-1.5 text-sm font-medium text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-100/10 hover:text-white'>
            <ArrowLeftRight size={16} className='text-zinc-300' />
            Change
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type='button'
                aria-label={`More for slot ${numeral}`}
                className='rounded p-1.5 text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-100/10 hover:text-white'>
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='min-w-[10rem]'>
              <DropdownMenuItem
                onSelect={() => onRemove(index)}
                className='gap-2 text-red-300 focus:text-red-200'>
                <Trash2 size={14} />
                Take off the rack
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* How it is: the meter across the plate, its reading underneath. */}
      <div className='flex flex-col gap-2'>
        <ConditionMeter
          condition={condition}
          restored={item.restored}
          showLabel={false}
          className='max-w-[14rem]'
        />
        <p className='text-sm'>
          <span className='font-medium' style={{ color: grade.color }}>
            {grade.label}
          </span>{" "}
          <span className='text-zinc-500'>condition</span>
        </p>
      </div>
    </div>
  );
};

/**
 * The label under a bay on someone else's wall: only what hangs there. The
 * level is already on the bay, and condition is the owner's business.
 */
const ShowcasePlate = ({ index, item }: Pick<PlateProps, "index" | "item">) => {
  const guitar = item ? GUITARS_BY_ID.get(item.guitarId) : null;

  // Nothing to label: the bare hook above already says the bay is empty. The
  // plate's own background still fills the row beside its neighbours.
  if (!item || !guitar) return null;

  return (
    <div className={cn("min-w-0 px-6 py-5 md:row-start-2", BAY_COLUMN[index])}>
      <p className='truncate font-display text-xl font-semibold text-zinc-50'>
        {guitar.name}
      </p>
      <p className='mt-0.5 truncate text-sm text-zinc-400'>{guitar.brand}</p>
    </div>
  );
};

/**
 * The three guitar bays of the rig, as one wall.
 *
 * Bays across the top, their plates in a row underneath, on md and up; on a
 * phone each bay is followed by its own plate. DOM order is bay, plate, bay,
 * plate — the grid puts them into two rows where there is room.
 *
 * The whole thing sits in a shallow case: a slightly lighter frame with a
 * highlight along its top edge, and the bays recessed inside it.
 */
export const GuitarRack = ({
  slots,
  inventory,
  onOpenPicker,
  onRemove,
  onHover,
  onShowCard,
  switchOn = false,
}: GuitarRackProps) => {
  const itemOf = (id: string | null) =>
    id ? (inventory.find((i) => i.id === id) ?? null) : null;

  return (
    <div
      className='rounded-lg bg-arsenal-card p-1.5'
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      <div className='grid grid-cols-1 gap-px overflow-hidden rounded bg-black/60 md:grid-cols-3 md:grid-rows-[auto_auto]'>
        {([0, 1, 2] as const).map((index) => {
          const item = itemOf(slots[index]);
          return [
            <Bay
              key={`bay-${index}`}
              index={index}
              item={item}
              onOpenPicker={onOpenPicker}
              onHover={onHover}
              onShowCard={onShowCard}
              switchOn={switchOn}
            />,
            <div
              key={`plate-${index}`}
              className={cn(
                "bg-arsenal-section md:row-start-2",
                BAY_COLUMN[index],
              )}>
              {onOpenPicker && onRemove ? (
                <Plate
                  index={index}
                  item={item}
                  onOpenPicker={onOpenPicker}
                  onRemove={onRemove}
                />
              ) : (
                <ShowcasePlate index={index} item={item} />
              )}
            </div>,
          ];
        })}
      </div>
    </div>
  );
};
