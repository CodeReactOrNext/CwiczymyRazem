import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { useMemo } from "react";

import {
  formatRigFameRate,
  getRigFameRate,
  RIG_FAME_HOURLY_CEILING,
} from "../../data/rigFame";
import { getRigLevel } from "../../data/rigLevel";
import {
  buildRigTraitContext,
  getRigTraitCategoryRates,
  getRigTraitShowcaseRate,
} from "../../data/traitEval";
import { formatTraitValue, PRACTICE_CATEGORIES } from "../../data/traits";
import type { ArsenalUserData } from "../../types/arsenal.types";

interface HeadlineProps {
  /** Sits before the number, small — "Lv". */
  prefix?: string;
  value: string;
  /** Sits after it, same treatment — "/h". */
  suffix?: string;
  caption: string;
}

/** One of the two numbers the sheet is read for. */
const Headline = ({ prefix, value, suffix, caption }: HeadlineProps) => (
  <div className='flex flex-col gap-1'>
    <div className='flex items-baseline gap-1.5'>
      {prefix && (
        <span className='font-teko text-xl leading-none text-zinc-500'>
          {prefix}
        </span>
      )}
      <span className='font-teko text-6xl font-bold tabular-nums leading-none text-zinc-100'>
        {value}
      </span>
      {suffix && (
        <span className='font-teko text-xl leading-none text-zinc-500'>
          {suffix}
        </span>
      )}
    </div>
    <span className='text-[11px] tracking-wide text-zinc-500'>{caption}</span>
  </div>
);

interface StatGroupProps {
  label: string;
  children: React.ReactNode;
}

const StatGroup = ({ label, children }: StatGroupProps) => (
  <div className='flex flex-col gap-2.5'>
    <p className='text-[10px] font-bold tracking-[0.2em] text-zinc-500'>
      {label}
    </p>
    <dl className='flex flex-col gap-2'>{children}</dl>
  </div>
);

interface StatRowProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  /** Brightest line in its group — the rig's strongest category. */
  strong?: boolean;
  /** Nothing to pay: the row stays, the number steps back. */
  muted?: boolean;
}

const StatRow = ({ label, value, icon, strong, muted }: StatRowProps) => (
  <div className='flex items-baseline justify-between gap-4'>
    <dt className='flex min-w-0 items-center gap-2'>
      {icon}
      <span className='truncate text-[11px] capitalize tracking-wide text-zinc-400'>
        {label}
      </span>
    </dt>
    <dd
      className={cn(
        "font-mono text-[13px] tabular-nums",
        muted
          ? "text-zinc-500"
          : strong
            ? "font-bold text-zinc-100"
            : "text-zinc-300",
      )}>
      {value}
    </dd>
  </div>
);

interface RigStatsPanelProps {
  data: ArsenalUserData;
}

/**
 * The rig's character sheet: what the gear in service is worth per hour of
 * practice, and which kind of practice it is worth it on.
 *
 * These numbers used to sit in the Arsenal banner, above the tabs — three tabs
 * away from the only screen where the player can change them. Swapping a pedal
 * is what moves them, so they belong beside the pedalboard.
 *
 * Two numbers lead, because two are what a player carries around: the level the
 * gear adds up to, and the Fame an hour of practice is now worth. Everything
 * else is the working that produces them and sits to the side at stat size.
 *
 * Deliberately monochrome. Every figure here is the same currency measured the
 * same way, so tinting them apart would invent a distinction the game does not
 * make — rank is carried by size and brightness instead.
 */
export const RigStatsPanel = ({ data }: RigStatsPanelProps) => {
  const rigLevel = getRigLevel(data);
  const baseRate = getRigFameRate(rigLevel);

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
  const rawTotal = baseRate + traitRate;
  const totalRate = Math.min(RIG_FAME_HOURLY_CEILING, rawTotal);
  const isCapped = rawTotal > RIG_FAME_HOURLY_CEILING;

  const bestCategoryRate = Math.max(
    ...PRACTICE_CATEGORIES.map((category) => categoryRates[category]),
  );

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-0.5'>
        <p className='text-[9px] font-bold capitalize tracking-[0.2em] text-zinc-500'>
          Loadout
        </p>
        <p className='text-base font-black capitalize tracking-wide text-white'>
          Rig Sheet
        </p>
      </div>

      <div className='flex flex-col gap-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
        <div className='grid grid-cols-1 gap-8 sm:grid-cols-[minmax(0,180px)_1fr] sm:gap-12'>
          <div className='flex flex-col gap-5'>
            <Headline
              prefix='Lv'
              value={String(rigLevel)}
              caption='Rig level'
            />
            <Headline
              value={totalRate.toFixed(1)}
              suffix='/h'
              caption='Fame per hour'
            />
          </div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-10'>
            <StatGroup label='Sources'>
              <StatRow label='Base' value={`+${formatRigFameRate(rigLevel)}`} />
              <StatRow label='Traits' value={formatTraitValue(traitRate)} />
            </StatGroup>

            <StatGroup label='Affinity'>
              {PRACTICE_CATEGORIES.map((category) => {
                const Icon = SKILL_CATEGORY_ICONS[category];
                const rate = categoryRates[category];

                return (
                  <StatRow
                    key={category}
                    label={category}
                    value={rate > 0 ? formatTraitValue(rate) : "—"}
                    icon={
                      <Icon
                        size='small'
                        className='shrink-0 self-center text-zinc-500'
                      />
                    }
                    strong={rate > 0 && rate === bestCategoryRate}
                    muted={rate === 0}
                  />
                );
              })}
            </StatGroup>
          </div>
        </div>

        <p className='text-[10px] leading-relaxed text-zinc-500'>
          Fame per hour of practice. Traits are quoted on an even hour, affinity
          on a full hour of one category.
          {bestCategoryRate === 0 &&
            " Traits pay only while the gear carrying them is on the rig."}
          {isCapped && ` Capped at ${RIG_FAME_HOURLY_CEILING}/h.`}
        </p>
      </div>
    </div>
  );
};
