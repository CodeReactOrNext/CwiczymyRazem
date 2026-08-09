import { cn } from "assets/lib/utils";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import {
  getPromotions,
  getPromotionsAvailable,
  RARITY_LADDER,
  RARITY_MAX_FEATURES,
} from "feature/arsenal/data/itemStats";
import { getPartLabel } from "feature/arsenal/data/partDefinitions";
import type { ModQuote } from "feature/arsenal/data/workshop";
import {
  getBuildQuote,
  getGradeByRank,
  getModQuote,
  getRepairQuote,
} from "feature/arsenal/data/workshop";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { Hammer, SlidersHorizontal, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { ConditionMeter } from "../ConditionMeter";
import { HoloFoil } from "../HoloFoil";
import { LevelEmblem } from "../LevelEmblem";
import { ConditionPath } from "./ConditionPath";
import { JobCard } from "./JobCard";
import { RarityPath } from "./RarityPath";
import { SlotPips } from "./SlotPips";
import type { WorkshopJob } from "./WorkshopJobModal";
import { WorkshopJobModal } from "./WorkshopJobModal";

interface WorkshopBenchProps {
  entry: WorkshopEntry;
  wallet: ScrapPart[];
  fame: number;
}

/**
 * Why a build cannot run yet, in the fewest words that still point somewhere.
 * A missing part names itself — that is the whole advantage of a fixed recipe.
 */
const getBuildBlocker = (
  quote: ReturnType<typeof getBuildQuote>,
): string | undefined => {
  const failedCheck = quote.checks.find((c) => !c.ok);
  if (failedCheck?.kind === "condition") {
    return `restore it to ${getGradeByRank(failedCheck.required).label} first`;
  }

  const missing = quote.recipe.filter((line) => !line.ok);
  if (missing.length === 1) {
    const line = missing[0];
    return `${line.need - line.have} more ${line.tier} ${getPartLabel(line.partId).toLowerCase()}`;
  }
  if (missing.length > 1) return `missing ${missing.length} of the parts`;

  if (failedCheck?.kind === "fame") {
    return `needs ${failedCheck.required - failedCheck.current} more fame`;
  }
  return undefined;
};

/**
 * Why the mod bench is closed. Every mod has its own bill, so "not enough parts"
 * is only true when *none* of them are affordable — otherwise the block is the
 * slot cap, which a promotion fixes.
 */
const getModBlocker = (quote: ModQuote): string | undefined => {
  if (quote.canFit || quote.canReroll) return undefined;
  if (quote.slots.free === 0 && quote.fitted.length > 0) {
    return "no parts for a re-roll";
  }
  if (quote.candidates.length === 0) return "nothing else fits this build";
  return "no parts for any mod yet";
};

export const WorkshopBench = ({ entry, wallet, fame }: WorkshopBenchProps) => {
  const rs = RARITY_STYLES[entry.rarity];

  const buildQuote = useMemo(
    () => getBuildQuote(entry.subject, wallet, fame),
    [entry.subject, wallet, fame],
  );
  const repairQuote = useMemo(
    () => getRepairQuote(entry.subject, wallet),
    [entry.subject, wallet],
  );
  const modQuote = useMemo(
    () => getModQuote(entry.subject, wallet),
    [entry.subject, wallet],
  );

  const [job, setJob] = useState<WorkshopJob | null>(null);

  const mintRarity = entry.subject.mintRarity;
  const promotionsDone = getPromotions(mintRarity, entry.buildLevel);
  const promotionsTotal = getPromotionsAvailable(mintRarity);
  // Slots the next promotion would unlock — drawn as ghosts past the current cap.
  const nextRarity =
    RARITY_LADDER[RARITY_LADDER.indexOf(entry.rarity) + 1] ?? null;
  const lockedModSlots =
    nextRarity && promotionsDone < promotionsTotal
      ? Math.max(0, (RARITY_MAX_FEATURES[nextRarity] ?? 0) - modQuote.slots.max)
      : 0;

  return (
    <div className='flex flex-col gap-4'>
      <WorkshopJobModal
        job={job}
        entry={entry}
        buildQuote={buildQuote}
        repairQuote={repairQuote}
        modQuote={modQuote}
        wallet={wallet}
        onClose={() => setJob(null)}
      />

      {/* ─── The item on the bench ─── */}
      <div
        className='relative flex flex-col gap-6 overflow-hidden rounded-lg bg-zinc-900/40 p-7 sm:flex-row sm:items-center'
        style={{
          backgroundImage: `linear-gradient(135deg, ${rs.baseColor}${entry.rarity === "Custom Shop" ? "0f" : "1f"}, transparent 55%)`,
        }}>
        {entry.rarity === "Custom Shop" && <HoloFoil />}
        <div className='flex h-28 w-28 shrink-0 items-center justify-center self-center'>
          <img
            src={entry.imageSrc}
            alt={entry.name}
            className={cn(
              "h-28 w-28 object-contain",
              entry.rotate && "-rotate-90 scale-[1.7]",
            )}
          />
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-4'>
          <div className='flex flex-col gap-1'>
            <span
              className='text-[10px] font-semibold tracking-[0.18em]'
              style={{ color: rs.baseColor }}>
              {entry.brand}
            </span>
            <span className='truncate text-2xl font-black text-white'>
              {entry.name}
            </span>
            <span className='text-xs' style={{ color: rs.baseColor }}>
              {entry.rarity}
              {entry.serial != null && (
                <span className='font-mono ml-2 text-zinc-500'>
                  #{String(entry.serial).padStart(4, "0")}
                </span>
              )}
            </span>
          </div>

          <ConditionMeter
            condition={entry.condition}
            restored={entry.restored}
            className='max-w-[280px]'
          />
        </div>

        {/*
          Level only. Build level and promotions used to sit here too, but both
          are already spelled out on the build card in the words that matter
          ("Build 1 → 2 · 2 more to the next promotion") — as bare counters they
          were three numbers competing for the one the player is actually here to
          move.
        */}
        <div className='flex shrink-0 flex-col items-center gap-1.5 self-center'>
          <LevelEmblem level={entry.level} rarity={entry.rarity} size={52} />
          <span className='text-xs text-zinc-500'>level</span>
        </div>
      </div>

      {/* ─── The two things you can do ─── */}
      <JobCard
        icon={Wrench}
        title='Restore condition'
        summary={
          repairQuote.target ? (
            <ConditionPath
              condition={entry.condition}
              target={repairQuote.target}
            />
          ) : (
            "Museum grade — nothing left to restore"
          )
        }
        gain={repairQuote.gain}
        ready={repairQuote.canRepair}
        blockedNote={repairQuote.target ? "not enough parts" : undefined}
        accent='emerald'
        disabled={!repairQuote.target}
        onClick={() => setJob("repair")}
      />

      <JobCard
        icon={Hammer}
        title={
          buildQuote.requirement.promotesTo
            ? `Promote to ${buildQuote.requirement.promotesTo}`
            : "Next build"
        }
        summary={
          <>
            <span>
              Build {entry.buildLevel} → {buildQuote.requirement.level}
            </span>
            <RarityPath
              mintRarity={entry.subject.mintRarity}
              buildLevel={entry.buildLevel}
            />
          </>
        }
        gain={buildQuote.gain}
        ready={buildQuote.canBuild}
        blockedNote={getBuildBlocker(buildQuote)}
        accent='cyan'
        onClick={() => setJob("build")}
      />

      <JobCard
        icon={SlidersHorizontal}
        title='Fit a mod'
        summary={
          <SlotPips
            used={modQuote.slots.used}
            max={modQuote.slots.max}
            locked={lockedModSlots}
          />
        }
        readyNote={
          modQuote.canFit
            ? `${modQuote.slots.free} slot${modQuote.slots.free === 1 ? "" : "s"} free`
            : "re-roll only"
        }
        ready={modQuote.canFit || modQuote.canReroll}
        blockedNote={getModBlocker(modQuote)}
        accent='purple'
        disabled={
          modQuote.fitted.length === 0 && modQuote.candidates.length === 0
        }
        onClick={() => setJob("mod")}
      />

      {/* ─── Mods fitted ─── */}
      {entry.buildLog.length > 0 && (
        <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-6'>
          <span className='text-xs font-bold tracking-[0.2em] text-zinc-400'>
            Mods fitted
          </span>
          <div className='flex flex-col gap-2.5'>
            {[...entry.buildLog].reverse().map((mod, i) => (
              <div key={`${mod}-${i}`} className='flex items-baseline gap-3'>
                <span className='w-6 shrink-0 text-right text-xs font-bold tabular-nums text-zinc-600'>
                  {entry.buildLog.length - i}
                </span>
                <span className='text-sm text-zinc-300'>{mod}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
