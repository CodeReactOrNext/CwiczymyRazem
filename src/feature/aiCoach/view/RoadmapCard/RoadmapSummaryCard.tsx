import { PRESSABLE_IN_GROUP } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { levelTextTone } from "feature/supporterPanel/utils/roadmapGoal";
import { Check, Play, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

export type RoadStepState = "done" | "current" | "todo";

/**
 * A roadmap's steps as the card reads them, from per-phase counts: the first
 * `done[i]` steps of each phase are finished, and the first one that is not
 * is where the player stands.
 */
export const roadFromCounts = (
  sizes: number[],
  done: number[],
): RoadStepState[][] => {
  let currentPlaced = false;
  return sizes.map((size, phase) => {
    const finished = Math.min(done[phase] ?? 0, size);
    return Array.from({ length: size }, (_, index): RoadStepState => {
      if (index < finished) return "done";
      if (currentPlaced) return "todo";
      currentPlaced = true;
      return "current";
    });
  });
};

/**
 * One stop per phase: finished when every step in it is, and the first
 * unfinished one is where the player stands.
 */
const phaseStops = (road: RoadStepState[][]): RoadStepState[] => {
  let currentPlaced = false;
  return road.map((steps) => {
    if (steps.length > 0 && steps.every((step) => step === "done")) {
      return "done";
    }
    if (currentPlaced) return "todo";
    currentPlaced = true;
    return "current";
  });
};

/** The lane's edge-to-edge box, in which the stops are placed by percent. */
const LANE_INSET = 6;
const LANE_HIGH = 33;
const LANE_LOW = 67;

/**
 * The roadmap as a winding lane: a stop per phase, low and high in turn, the
 * stretch already travelled in emerald and the white key on the phase the
 * player is in. Drawn in a 100×100 box and stretched to whatever width the
 * card has — the stops sit on it by percent, so they never stretch with it.
 */
const PhaseLane = ({ road }: { road: RoadStepState[][] }) => {
  const stops = phaseStops(road);
  const points = stops.map((_, index) => ({
    x:
      stops.length < 2
        ? 50
        : LANE_INSET + (index * (100 - 2 * LANE_INSET)) / (stops.length - 1),
    y: index % 2 === 0 ? LANE_LOW : LANE_HIGH,
  }));
  const lane = (upTo: number) =>
    points
      .slice(0, upTo + 1)
      .map((point, index, list) => {
        if (index === 0) return `M ${point.x} ${point.y}`;
        const prev = list[index - 1];
        const mid = (prev.x + point.x) / 2;
        return `C ${mid} ${prev.y}, ${mid} ${point.y}, ${point.x} ${point.y}`;
      })
      .join(" ");
  const current = stops.indexOf("current");
  // Everything finished: the whole lane is travelled.
  const travelledTo = current < 0 ? stops.length - 1 : current;

  return (
    <span aria-hidden className='relative block h-24 w-full min-w-0'>
      <svg
        viewBox='0 0 100 100'
        preserveAspectRatio='none'
        fill='none'
        strokeLinecap='round'
        className='absolute inset-0 h-full w-full overflow-visible'>
        <path
          d={lane(stops.length - 1)}
          strokeWidth={22}
          vectorEffect='non-scaling-stroke'
          className='stroke-zinc-800'
        />
        {travelledTo > 0 && (
          <path
            d={lane(travelledTo)}
            strokeWidth={22}
            vectorEffect='non-scaling-stroke'
            className='stroke-emerald-500/40'
          />
        )}
      </svg>
      {stops.map((state, index) => (
        <span
          key={index}
          style={{ left: `${points[index].x}%`, top: `${points[index].y}%` }}
          className={cn(
            "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg border-b-[3px] border-b-black/35",
            state === "done" &&
              "h-[26px] w-[26px] bg-emerald-500 text-emerald-950",
            state === "current" && "h-9 w-9 bg-white text-zinc-950",
            state === "todo" && "h-[26px] w-[26px] bg-zinc-700",
          )}>
          {state === "done" && (
            <Check className='h-3.5 w-3.5' strokeWidth={3.5} />
          )}
          {state === "current" && (
            <Play className='h-3.5 w-3.5 fill-current' strokeWidth={0} />
          )}
        </span>
      ))}
    </span>
  );
};

interface RoadmapSummaryCardProps {
  /** The small line over the title: what kind of roadmap, or whose. */
  eyebrow?: ReactNode;
  title: string;
  level?: string;
  /** The level in the player's language. */
  levelLabel?: string;
  /** A cover; curated roadmaps have one. */
  image?: string;
  /** What fills the cover's place on a roadmap without one: an avatar, an icon tile. */
  leading?: ReactNode;
  road: RoadStepState[][];
  done: number;
  total: number;
  /** How many players are on it; left off the card while unknown or nobody is. */
  players?: number;
  /** Spoken with that number: "214 players". */
  playersLabel?: string;
  /** Spoken with the counter: "12 of 35 steps completed". */
  countLabel: string;
  action: string;
  /** The white key — for the roadmaps the player is already on. */
  primary?: boolean;
  /** Taller, at the head of "Yours": the roadmap under way. */
  featured?: boolean;
  onOpen: () => void;
}

/**
 * One roadmap as a row, the same for a curated roadmap, the player's own and
 * another player's: a square cover (or what stands in for one), the name and
 * level, the road winding through its phases, how many steps are done, and
 * one key. The whole row is the button. On a narrow screen it stacks: cover,
 * name, road, then the counter and the key.
 */
export const RoadmapSummaryCard = ({
  eyebrow,
  title,
  level,
  levelLabel,
  image,
  leading,
  road,
  done,
  total,
  players,
  playersLabel,
  countLabel,
  action,
  primary = false,
  featured = false,
  onOpen,
}: RoadmapSummaryCardProps) => (
  <button
    type='button'
    onClick={onOpen}
    aria-label={`${action}: ${title}`}
    className={cn(
      "group flex w-full min-w-0 flex-col overflow-hidden rounded-lg bg-zinc-900 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/80 sm:flex-row",
      featured ? "xl:min-h-[176px]" : "xl:min-h-[144px]",
    )}>
    <span
      className={cn(
        "relative block h-32 shrink-0 bg-zinc-800 sm:h-auto",
        featured ? "sm:w-56" : "sm:w-40",
      )}>
      {image ? (
        <Image
          src={image}
          alt=''
          fill
          sizes={
            featured
              ? "(min-width: 640px) 224px, 100vw"
              : "(min-width: 640px) 160px, 100vw"
          }
          className='object-cover object-[center_30%]'
        />
      ) : (
        leading
      )}
    </span>

    <span className='flex min-w-0 flex-1 flex-col gap-4 p-5 xl:flex-row xl:items-center xl:gap-6 xl:py-4 xl:pl-6 xl:pr-6'>
      <span className='flex min-w-0 flex-col gap-1 xl:w-60 xl:shrink-0'>
        {eyebrow && (
          <span className='flex items-center gap-2 text-sm text-zinc-400'>
            {eyebrow}
          </span>
        )}
        <span
          className={cn(
            "line-clamp-2 break-words font-bold leading-tight tracking-tight text-zinc-100",
            featured ? "text-2xl" : "text-xl",
          )}>
          {title}
        </span>
        {(level || !!players) && (
          <span className='mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
            {level && (
              <span
                className={cn(
                  "inline-flex items-center gap-2 font-medium",
                  levelTextTone(level),
                )}>
                <span
                  aria-hidden
                  className='h-1.5 w-1.5 rounded-full bg-current'
                />
                {levelLabel ?? level}
              </span>
            )}
            {!!players && (
              <span
                aria-label={playersLabel}
                title={playersLabel}
                className='inline-flex items-center gap-1.5 tabular-nums text-zinc-400'>
                <Users className='h-3.5 w-3.5' aria-hidden />
                {players}
              </span>
            )}
          </span>
        )}
      </span>

      <span className='block min-w-0 xl:flex-1'>
        <PhaseLane road={road} />
      </span>

      <span className='flex shrink-0 items-end justify-between gap-5 xl:items-center xl:justify-end'>
        <span
          aria-label={countLabel}
          className={cn(
            "whitespace-nowrap text-right font-teko font-semibold tabular-nums leading-[0.8] text-white xl:min-w-[76px]",
            featured ? "text-[46px]" : "text-[40px]",
          )}>
          {done}
          <span
            className={cn(
              "text-zinc-500",
              featured ? "text-[30px]" : "text-[25px]",
            )}>
            /{total}
          </span>
        </span>
        {/* The whole row is the button; this only says what pressing it does. */}
        <span
          aria-hidden
          className={cn(
            PRESSABLE_IN_GROUP,
            "inline-flex h-10 min-w-[140px] items-center justify-center rounded-lg px-5 text-sm transition-colors",
            primary
              ? "border-b-black/25 bg-primary text-primary-foreground group-hover:bg-primary/90"
              : "border-b-black/25 bg-zinc-800/60 text-zinc-200 group-hover:bg-zinc-800 group-hover:text-white",
          )}>
          {action}
        </span>
      </span>
    </span>
  </button>
);
