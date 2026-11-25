import { buttonVariants } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { SKILL_CATEGORY_ICONS } from "feature/skills/constants/skillIcons";
import { motion } from "framer-motion";
import { ChevronDown, Star } from "lucide-react";
import { useMemo, useState } from "react";

import {
  describeDuplicateRule,
  readBoardLevel,
} from "../../data/boardDuplicates";
import { isPoweredIn } from "../../data/powerSupply";
import { getRigFameRate } from "../../data/rigFame";
import { getRigLevel } from "../../data/rigLevel";
import { getChainFameRate } from "../../data/signalChain";
import {
  buildRigTraitContext,
  getRigTraitCategoryRates,
  getRigTraitShowcaseRate,
} from "../../data/traitEval";
import {
  formatTraitValue,
  PRACTICE_CATEGORIES,
  type PracticeCategory,
} from "../../data/traits";
import type { ArsenalUserData } from "../../types/arsenal.types";
import { CountUp } from "../Workshop/workshopMotion";
import { RIG_TILE } from "./RigSection";

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

interface GainProps {
  value: number;
  decimals: number;
}

/**
 * What a headline number just went up by, rising off it and fading: "+0.8"
 * beside the Fame rate the moment a pedal is wired in properly.
 *
 * The number already rolls to its new value, but a roll does not say which way
 * or by how much, and the change is the player's doing — so it is named. Only
 * a gain is: a number that dropped has its reason spelled out on the tiles
 * over the board, and does not need rubbing in up here.
 */
const Gain = ({ value, decimals }: GainProps) => {
  const [seen, setSeen] = useState(value);
  const [gain, setGain] = useState<{ amount: number; id: number } | null>(
    null,
  );

  if (value !== seen) {
    const amount = value - seen;
    setSeen(value);
    setGain(
      Number(amount.toFixed(decimals)) > 0
        ? { amount, id: (gain?.id ?? 0) + 1 }
        : null,
    );
  }

  if (!gain) return null;

  return (
    <motion.span
      key={gain.id}
      aria-hidden
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: [0, 1, 1, 0], y: [6, 0, 0, -8] }}
      transition={{ duration: 1.6, times: [0, 0.15, 0.75, 1] }}
      className='pointer-events-none absolute left-full top-0 ml-2 whitespace-nowrap text-sm font-bold tabular-nums text-emerald-400'>
      +{gain.amount.toFixed(decimals)}
    </motion.span>
  );
};

interface HeadlineProps {
  caption: string;
  value: number;
  decimals?: number;
  icon?: React.ReactNode;
  /** Cyan for level, amber for Fame — the currency each is quoted in. */
  tone: "level" | "fame";
  title?: string;
  /** Name a rise as it happens — on the owner's sheet, where they caused it. */
  showGain?: boolean;
}

/**
 * One of the two numbers the strip is read for. Exported so a visitor reads
 * the rig level on a profile in the same type the owner reads it here.
 */
export const RigHeadline = ({
  caption,
  value,
  decimals = 0,
  icon,
  tone,
  title,
  showGain = false,
}: HeadlineProps) => (
  <Stat caption={caption} title={title} rowClassName='h-9'>
    {icon}
    <span className='relative flex'>
      <CountUp
        value={value}
        decimals={decimals}
        className={cn(
          "font-teko text-4xl font-bold tabular-nums leading-none",
          tone === "level" ? "text-cyan-300" : "text-amber-300",
        )}
      />
      {showGain && <Gain value={value} decimals={decimals} />}
    </span>
  </Stat>
);

interface FigureProps {
  label: string;
  value: string;
  title?: string;
}

/** A working figure, at stat size. */
const Figure = ({ label, value, title }: FigureProps) => (
  <Stat caption={label} title={title} rowClassName='h-5'>
    <span className='font-mono text-[15px] font-semibold tabular-nums leading-none text-zinc-100'>
      {value}
    </span>
  </Stat>
);

interface TermProps {
  label: string;
  value: string;
  /** Nothing to add: the term stays in the sum, the number steps back. */
  muted?: boolean;
}

/** One term of the sum: what it is called, then what it adds. */
const Term = ({ label, value, muted }: TermProps) => (
  <span className='flex items-baseline gap-2'>
    {label}
    <span
      className={cn(
        "font-semibold tabular-nums",
        muted ? "text-zinc-500" : "text-zinc-100",
      )}>
      {value}
    </span>
  </span>
);

/** The sign between two terms. */
const Sign = ({ children }: { children: string }) => (
  <span aria-hidden className='text-zinc-500'>
    {children}
  </span>
);

interface RigBreakdownProps {
  baseRate: number;
  chainRate: number;
  traitRate: number;
  totalRate: number;
  categoryRates: Record<PracticeCategory, number>;
}

/**
 * Where the Fame / hour comes from, written as the sum it is: the three
 * sources, added up to the headline number, then what each practice category
 * gets on top. Folded away by default — the two headline numbers are what a
 * player carries around, the working is for the one who asks.
 *
 * It used to be seven figures in a row, with nothing to say that the first
 * three add up to the big one.
 */
const RigBreakdown = ({
  baseRate,
  chainRate,
  traitRate,
  totalRate,
  categoryRates,
}: RigBreakdownProps) => {
  const { t } = useArsenalLabels();

  return (
    <div className='flex flex-col gap-5'>
      <p className='flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-zinc-400'>
        <Term label={t("rig.base")} value={baseRate.toFixed(1)} />
        <Sign>+</Sign>
        <Term
          label={t("signal.path")}
          value={chainRate.toFixed(1)}
          muted={chainRate === 0}
        />
        <Sign>+</Sign>
        <Term
          label={t("rig.traits")}
          value={traitRate.toFixed(1)}
          muted={traitRate === 0}
        />
        <Sign>=</Sign>
        <span className='font-bold tabular-nums text-amber-300'>
          {totalRate.toFixed(1)} {t("rig.fame_per_hour")}
        </span>
      </p>

      <div className='flex flex-col gap-2'>
        <p className='text-xs text-zinc-400'>{t("rig.category_extra")}</p>
        <div className='flex flex-wrap gap-2'>
          {PRACTICE_CATEGORIES.map((category) => {
            const Icon = SKILL_CATEGORY_ICONS[category];
            const rate = categoryRates[category];
            return (
              <span
                key={category}
                className={cn(
                  "flex items-center gap-2 rounded px-3 py-1.5 text-sm",
                  rate > 0 ? "bg-zinc-800/40 text-zinc-300" : "text-zinc-500",
                )}>
                <Icon size='medium' className='shrink-0 text-zinc-500' />
                {t(`categories.${category}`)}
                <span
                  className={cn(
                    "font-semibold tabular-nums",
                    rate > 0 && "text-zinc-100",
                  )}>
                  {rate > 0 ? formatTraitValue(rate) : "—"}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

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
 * gear adds up to, and the Fame an hour of practice is now worth. The level
 * carries one working figure of its own — what duplicates on the board cost it
 * (`data/boardDuplicates`) — but only while they cost something; the tile over
 * the board is where the rule is spelled out. The Fame working (`RigBreakdown`)
 * is folded behind a toggle: the three sources as one sum, then what each
 * practice category gets on top.
 *
 * Colour is spent only where it names a currency — cyan for level, amber for
 * Fame. The working stays neutral, so nothing in it competes with the two
 * numbers it adds up to. The numbers roll rather than snap, and a rise is named
 * beside them (`Gain`): swapping a pedal is the whole point of the screen below,
 * and a rate that visibly climbs is the feedback for it.
 */
export const RigStatsPanel = ({ data }: RigStatsPanelProps) => {
  const rigLevel = getRigLevel(data);
  const { t } = useArsenalLabels();
  // What the board gave up to duplicates on the way to that level — the one
  // deduction in the sum, so it is the one figure the level carries with it.
  const duplicatePenalty = readBoardLevel(
    data.rig.pedalboardItems,
    data.effectInventory,
    isPoweredIn(data.rig),
  ).penalty;
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

  // No hourly ceiling: every gear payout is paid in full (see
  // `calculateSessionFame`), so the total is the plain sum.
  const totalRate = baseRate + chainRate + traitRate;
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className={cn(RIG_TILE, "flex flex-col gap-6 px-6 py-5")}>
      {/* The two numbers the sheet is read for, and nothing else on their line
          but the way into how they are made up. The duplicates figure joins
          the level only while it is costing something. */}
      <div className='flex flex-wrap items-end gap-x-10 gap-y-5'>
        <div className='flex items-end gap-7'>
          <RigHeadline
            caption={t("rig.rig_level")}
            value={rigLevel}
            tone='level'
            showGain={duplicatePenalty === 0}
          />
          {duplicatePenalty > 0 && (
            <Figure
              label={t("duplicates.title")}
              title={describeDuplicateRule(t)}
              value={`−${duplicatePenalty}`}
            />
          )}
        </div>

        <RigHeadline
          caption={t("rig.fame_per_hour")}
          value={totalRate}
          decimals={1}
          tone='fame'
          icon={<Star size={20} className='fill-amber-400 text-amber-400' />}
          showGain
        />

        <button
          type='button'
          onClick={() => setShowBreakdown((open) => !open)}
          aria-expanded={showBreakdown}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "ml-auto self-center",
          )}>
          {t("rig.breakdown")}
          <ChevronDown
            className={cn(
              "transition-transform duration-fast",
              showBreakdown && "rotate-180",
            )}
          />
        </button>
      </div>

      {showBreakdown && (
        <RigBreakdown
          baseRate={baseRate}
          chainRate={chainRate}
          traitRate={traitRate}
          totalRate={totalRate}
          categoryRates={categoryRates}
        />
      )}
    </div>
  );
};
