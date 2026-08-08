import { cn } from "assets/lib/utils";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { getConditionGrade } from "feature/arsenal/data/itemStats";
import {
  getBuildPPCost,
  getBuildQuote,
  getRepairQuote,
} from "feature/arsenal/data/workshop";
import { useWorkshopBuild } from "feature/arsenal/hooks/useWorkshopBuild";
import { useWorkshopRepair } from "feature/arsenal/hooks/useWorkshopRepair";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { AnimatePresence, motion } from "framer-motion";
import { Hammer, Sparkles, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ScrapYieldList } from "../Parts/ScrapYieldList";
import { RequirementList } from "./RequirementList";

interface WorkshopBenchProps {
  entry: WorkshopEntry;
  wallet: ScrapPart[];
  fame: number;
}

interface Burst {
  title: string;
  subtitle: string;
  gain: number;
}

export const WorkshopBench = ({ entry, wallet, fame }: WorkshopBenchProps) => {
  const rs = RARITY_STYLES[entry.rarity];
  const grade = getConditionGrade(entry.condition);

  const build = useWorkshopBuild();
  const repair = useWorkshopRepair();

  const buildQuote = useMemo(
    () => getBuildQuote(entry.subject, wallet, fame),
    [entry.subject, wallet, fame],
  );
  const repairQuote = useMemo(
    () => getRepairQuote(entry.subject, wallet),
    [entry.subject, wallet],
  );

  const [burst, setBurst] = useState<Burst | null>(null);

  // The reward moment is the whole point of the tab — but it must not sit there
  // blocking the next job, so it clears itself.
  useEffect(() => {
    const timer = burst ? setTimeout(() => setBurst(null), 2200) : undefined;
    return () => clearTimeout(timer);
  }, [burst]);

  const isWorking = build.isPending || repair.isPending;

  const handleBuild = () => {
    build.mutate(
      { itemId: entry.id, kind: entry.kind },
      {
        onSuccess: (data) =>
          setBurst({
            title: data.modName,
            subtitle: `Build ${data.buildLevel}`,
            gain: data.levelGain,
          }),
      },
    );
  };

  const handleRepair = () => {
    repair.mutate(
      { itemId: entry.id, kind: entry.kind },
      {
        onSuccess: (data) =>
          setBurst({
            title: `Restored to ${data.grade}`,
            subtitle: "Condition",
            gain: data.levelGain,
          }),
      },
    );
  };

  // Makes the curve visible: the player can see the wall coming, not just hit it.
  const upcoming = [1, 2, 3].map((step) =>
    getBuildPPCost(buildQuote.requirement.level + step),
  );

  return (
    <div className='relative flex flex-col gap-6'>
      <AnimatePresence>
        {burst && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='bg-zinc-950/92 absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 rounded-lg backdrop-blur-sm'>
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className='flex flex-col items-center gap-3'>
              <Sparkles size={30} style={{ color: rs.baseColor }} />
              <span className='text-4xl font-black tabular-nums text-white'>
                +{burst.gain}
              </span>
              <span className='text-xs text-zinc-500'>item level</span>
            </motion.div>

            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className='flex flex-col items-center gap-1'>
              <span className='text-base font-bold text-zinc-100'>
                {burst.title}
              </span>
              <span className='text-xs text-zinc-500'>{burst.subtitle}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── The item on the bench ─── */}
      <div
        className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-6 sm:flex-row sm:items-center'
        style={{
          backgroundImage: `linear-gradient(135deg, ${rs.baseColor}1f, transparent 55%)`,
        }}>
        <div className='flex h-24 w-24 shrink-0 items-center justify-center self-center'>
          <img
            src={entry.imageSrc}
            alt={entry.name}
            className={cn(
              "h-24 w-24 object-contain",
              entry.rotate && "-rotate-90 scale-[1.7]",
            )}
          />
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-3'>
          <div className='flex flex-col gap-0.5'>
            <span
              className='text-[10px] font-semibold tracking-[0.18em]'
              style={{ color: rs.baseColor }}>
              {entry.brand}
            </span>
            <span className='truncate text-xl font-black text-white'>
              {entry.name}
            </span>
            <span className='text-[11px]' style={{ color: rs.baseColor }}>
              {entry.rarity}
              {entry.serial != null && (
                <span className='font-mono ml-2 text-zinc-500'>
                  #{String(entry.serial).padStart(4, "0")}
                </span>
              )}
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <span className='rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-bold tabular-nums text-zinc-200'>
              Lv {entry.level}
            </span>
            <span className='rounded bg-cyan-950/40 px-2.5 py-1 text-[11px] font-bold tabular-nums text-cyan-400'>
              Build {entry.buildLevel}
            </span>
            <span
              className='rounded px-2.5 py-1 text-[11px] font-bold'
              style={{
                backgroundColor: `${grade.color}1a`,
                color: grade.color,
              }}>
              {grade.label}
            </span>
            {entry.restored && (
              <span
                className='rounded bg-zinc-800/60 px-2.5 py-1 text-[11px] font-bold text-zinc-400'
                title='Restored gear keeps its original collector value'>
                Restored
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Build ─── */}
      <div className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-6'>
        <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
          <div className='flex flex-col gap-1'>
            <span className='flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-zinc-500'>
              <Hammer size={12} className='text-zinc-500' />
              Build
            </span>
            <span className='text-lg font-black text-white'>
              {entry.buildLevel} <span className='text-zinc-600'>→</span>{" "}
              {buildQuote.requirement.level}
            </span>
          </div>

          <div className='flex flex-col items-end gap-0.5'>
            <span className='text-2xl font-black tabular-nums text-cyan-400'>
              +{buildQuote.gain}
            </span>
            <span className='text-[10px] text-zinc-500'>item level</span>
          </div>
        </div>

        <RequirementList checks={buildQuote.checks} />

        {buildQuote.payment && (
          <div className='flex flex-col gap-3 rounded-lg bg-zinc-950/40 p-4'>
            <span className='text-[10px] font-bold tracking-[0.15em] text-zinc-500'>
              This job consumes
            </span>
            <ScrapYieldList parts={buildQuote.payment.parts} compact />
          </div>
        )}

        <button
          onClick={handleBuild}
          disabled={!buildQuote.canBuild || isWorking}
          className={cn(
            "rounded-lg px-5 py-3 text-sm font-bold transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
            "disabled:pointer-events-none disabled:opacity-40",
            buildQuote.canBuild
              ? "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
              : "bg-zinc-800/60 text-zinc-500",
          )}>
          {build.isPending
            ? "Fitting…"
            : `Fit next mod — ${buildQuote.requirement.pp.toLocaleString()} pp · ${buildQuote.requirement.fame} fame`}
        </button>

        <p className='text-[11px] text-zinc-500'>
          Then {upcoming.map((pp) => pp.toLocaleString()).join(" · ")} pp —
          every level wants more parts, rarer parts, and more different parts at
          once.
        </p>
      </div>

      {/* ─── Restore ─── */}
      <div className='flex flex-col gap-5 rounded-lg bg-zinc-900/40 p-6'>
        <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
          <div className='flex flex-col gap-1'>
            <span className='flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-zinc-500'>
              <Wrench size={12} className='text-zinc-500' />
              Restore
            </span>
            <span className='text-lg font-black text-white'>
              {repairQuote.target ? (
                <>
                  {grade.label} <span className='text-zinc-600'>→</span>{" "}
                  {repairQuote.target}
                </>
              ) : (
                "Museum grade"
              )}
            </span>
          </div>

          {repairQuote.target && (
            <div className='flex flex-col items-end gap-0.5'>
              <span className='text-2xl font-black tabular-nums text-emerald-400'>
                +{repairQuote.gain}
              </span>
              <span className='text-[10px] text-zinc-500'>item level</span>
            </div>
          )}
        </div>

        {repairQuote.target ? (
          <>
            <RequirementList checks={repairQuote.checks} />

            {repairQuote.payment && (
              <div className='flex flex-col gap-3 rounded-lg bg-zinc-950/40 p-4'>
                <span className='text-[10px] font-bold tracking-[0.15em] text-zinc-500'>
                  This job consumes
                </span>
                <ScrapYieldList parts={repairQuote.payment.parts} compact />
              </div>
            )}

            <button
              onClick={handleRepair}
              disabled={!repairQuote.canRepair || isWorking}
              className={cn(
                "rounded-lg px-5 py-3 text-sm font-bold transition-colors",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400",
                "disabled:pointer-events-none disabled:opacity-40",
                repairQuote.canRepair
                  ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                  : "bg-zinc-800/60 text-zinc-500",
              )}>
              {repair.isPending
                ? "Restoring…"
                : `Restore — ${repairQuote.pp.toLocaleString()} pp`}
            </button>

            <p className='text-[11px] text-zinc-500'>
              Restoring raises Item Level and unlocks higher build levels. It
              never raises what the game pays for the item — a restored
              instrument keeps its original collector value.
            </p>
          </>
        ) : (
          <p className='text-[11px] text-zinc-500'>
            Nothing left to restore. Condition is maxed, so every build gate is
            open.
          </p>
        )}
      </div>

      {/* ─── Build log ─── */}
      {entry.buildLog.length > 0 && (
        <div className='flex flex-col gap-4 rounded-lg bg-zinc-900/40 p-6'>
          <span className='text-[10px] font-bold tracking-[0.2em] text-zinc-500'>
            Build log
          </span>
          <div className='flex flex-col gap-2'>
            {[...entry.buildLog].reverse().map((mod, i) => (
              <div key={`${mod}-${i}`} className='flex items-baseline gap-3'>
                <span className='w-6 shrink-0 text-right text-[11px] font-bold tabular-nums text-zinc-600'>
                  {entry.buildLog.length - i}
                </span>
                <span className='text-xs text-zinc-300'>{mod}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
