import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { Star } from "lucide-react";
import { useMemo } from "react";

import {
  formatRigFameRate,
  getRigFameRate,
  RIG_FAME_HOURLY_CEILING,
} from "../../data/rigFame";
import { getRigLevel } from "../../data/rigLevel";
import { getChainFameRate } from "../../data/signalChain";
import {
  buildRigTraitContext,
  getRigTraitCategoryRates,
  getRigTraitShowcaseRate,
} from "../../data/traitEval";
import { formatTraitValue, PRACTICE_CATEGORIES } from "../../data/traits";
import type { ArsenalUserData } from "../../types/arsenal.types";
import { CountUp } from "../Workshop/workshopMotion";

/** A hairline between the strip's groups — the one place the Rig tab draws a line. */
const Divider = () => (
  <span
    aria-hidden
    className='hidden w-px shrink-0 self-stretch bg-zinc-100/[0.08] sm:block'
  />
);

interface StatProps {
  caption: string;
  title?: string;
  /** The figure's row height — the same for every figure of one size, so a
      figure with an icon beside it ends on the same line as one without. */
  rowClassName: string;
  children: React.ReactNode;
}

/**
 * The one anatomy every figure on the strip shares: a caption sitting right
 * on top of its figure.
 *
 * The strip lines its groups up along the bottom, so every figure — big or
 * small — ends on the same line, and each caption stays glued to the number
 * it names rather than floating a row above it.
 */
const Stat = ({ caption, title, rowClassName, children }: StatProps) => (
  <div className='flex flex-col gap-1' title={title}>
    <span className='text-xs leading-4 text-zinc-400'>{caption}</span>
    <span className={cn("flex items-center gap-2", rowClassName)}>
      {children}
    </span>
  </div>
);

interface HeadlineProps {
  caption: string;
  value: number;
  decimals?: number;
  icon?: React.ReactNode;
  /** Cyan for level, amber for Fame — the currency each is quoted in. */
  tone: "level" | "fame";
}

/** One of the two numbers the strip is read for. */
const Headline = ({
  caption,
  value,
  decimals = 0,
  icon,
  tone,
}: HeadlineProps) => (
  <Stat caption={caption} rowClassName='h-9'>
    {icon}
    <CountUp
      value={value}
      decimals={decimals}
      className={cn(
        "font-teko text-4xl font-bold tabular-nums leading-none",
        tone === "level" ? "text-cyan-300" : "text-amber-300",
      )}
    />
  </Stat>
);

interface FigureProps {
  label: string;
  value: string;
  title?: string;
  icon?: React.ReactNode;
  /** Nothing to pay: the cell stays, the number steps back. */
  muted?: boolean;
}

/** A working figure, at stat size. */
const Figure = ({ label, value, title, icon, muted }: FigureProps) => (
  <Stat caption={label} title={title} rowClassName='h-5'>
    {icon}
    <span
      className={cn(
        "font-mono text-[15px] font-semibold tabular-nums leading-none",
        muted ? "text-zinc-500" : "text-zinc-100",
      )}>
      {value}
    </span>
  </Stat>
);

interface RigStatsPanelProps {
  data: ArsenalUserData;
}

/**
 * The rig's character sheet as one strip: what the gear in service is worth
 * per hour of practice, and which kind of practice it is worth it on.
 *
 * These numbers used to sit in the Arsenal banner, above the tabs — three tabs
 * away from the only screen where the player can change them. Swapping a pedal
 * is what moves them, so they belong beside the pedalboard.
 *
 * Two numbers lead, because two are what a player carries around: the level the
 * gear adds up to, and the Fame an hour of practice is now worth. The working
 * that produces them runs along the same line at stat size: the three sources
 * first, then what each practice category gets on top — each category its own
 * figure under its own name, on the same two lines as everything else.
 *
 * Colour is spent only where it names a currency — cyan for level, amber for
 * Fame. The working stays neutral, so nothing in it competes with the two
 * numbers it adds up to. The numbers roll rather than snap: swapping a pedal
 * is the whole point of the screen below, and a rate that visibly climbs is
 * the feedback for it.
 */
export const RigStatsPanel = ({ data }: RigStatsPanelProps) => {
  const rigLevel = getRigLevel(data);
  const baseRate = getRigFameRate(rigLevel);
  // The saved board, not the live one: this is the sheet of what the gear pays,
  // and the panel over the pedalboard is where a rate still being dragged around
  // belongs.
  const chainRate = getChainFameRate(data);

  const { traitRate, categoryRates } = useMemo(() => {
    const rig = buildRigTraitContext(data);
    return {
      traitRate: getRigTraitShowcaseRate(rig),
      categoryRates: getRigTraitCategoryRates(rig),
    };
  }, [data]);

  // Traits are paid out of whatever headroom the base rate leaves under the one
  // ceiling in the system (see `calculateSessionFame`), so the honest total is
  // the clamped one — base + traits raw would advertise Fame no report pays.
  // The ceiling itself stays off the sheet: nothing in the game reaches it, so
  // showing it only invited the question of why the number was short.
  const totalRate = Math.min(
    RIG_FAME_HOURLY_CEILING,
    baseRate + chainRate + traitRate,
  );

  return (
    <div className='flex flex-wrap items-end gap-x-7 gap-y-5 rounded-lg bg-zinc-900/40 px-5 py-4 sm:px-6'>
      <Headline caption='Rig level' value={rigLevel} tone='level' />

      <Divider />

      <Headline
        caption='Fame / hour'
        value={totalRate}
        decimals={1}
        tone='fame'
        icon={<Star size={20} className='fill-amber-400 text-amber-400' />}
      />

      <Divider />

      <div className='flex items-end gap-7'>
        <Figure label='Base' value={`+${formatRigFameRate(rigLevel)}`} />
        <Figure
          label='Signal path'
          value={formatTraitValue(chainRate)}
          muted={chainRate === 0}
        />
        <Figure
          label='Traits'
          value={formatTraitValue(traitRate)}
          muted={traitRate === 0}
        />
      </div>

      <Divider />

      <div className='flex flex-wrap items-end gap-x-7 gap-y-5'>
        {PRACTICE_CATEGORIES.map((category) => {
          const Icon = SKILL_CATEGORY_ICONS[category];
          const rate = categoryRates[category];
          return (
            <Figure
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              title={`${category} bonus`}
              value={rate > 0 ? formatTraitValue(rate) : "—"}
              muted={rate === 0}
              icon={<Icon size='medium' className='shrink-0 text-zinc-500' />}
            />
          );
        })}
      </div>
    </div>
  );
};
