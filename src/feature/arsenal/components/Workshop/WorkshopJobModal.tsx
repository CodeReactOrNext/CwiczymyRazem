import { cn } from "assets/lib/utils";
import type {
  BuildQuote,
  ModQuote,
  RepairQuote,
} from "feature/arsenal/data/workshop";
import { getGradeByRank } from "feature/arsenal/data/workshop";
import { useWorkshopBuild } from "feature/arsenal/hooks/useWorkshopBuild";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import { useWorkshopRepair } from "feature/arsenal/hooks/useWorkshopRepair";
import type { WorkshopModAction } from "feature/arsenal/types/arsenal.types";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";

import { ConditionDelta, LevelDelta, RarityDelta } from "./BeforeAfter";
import { BuildLadder } from "./BuildLadder";
import { CostList } from "./CostList";
import { ModPicker } from "./ModPicker";
import { GateRow, RewardPanel } from "./RewardPanel";
import type { WorkshopResult } from "./WorkshopResultView";
import { WorkshopResultView } from "./WorkshopResultView";

export type WorkshopJob = "repair" | "build" | "mod";

interface WorkshopJobModalProps {
  job: WorkshopJob | null;
  entry: WorkshopEntry;
  buildQuote: BuildQuote;
  repairQuote: RepairQuote;
  modQuote: ModQuote;
  /** Passed through to the ladder map so every rung shows stock, not just the next. */
  wallet: ScrapPart[];
  onClose: () => void;
}

/**
 * Everything about one job, on demand.
 *
 * The bench itself only offers the two actions; the full recipe — requirements,
 * bill, before → after — lives here, and once the job runs the very same dialog
 * turns into the result rather than stacking a second one on top.
 */
export const WorkshopJobModal = ({
  job,
  entry,
  buildQuote,
  repairQuote,
  modQuote,
  wallet,
  onClose,
}: WorkshopJobModalProps) => {
  const build = useWorkshopBuild();
  const repair = useWorkshopRepair();
  const mod = useWorkshopMod();
  const [result, setResult] = useState<WorkshopResult | null>(null);

  const isPending = build.isPending || repair.isPending || mod.isPending;

  const close = () => {
    setResult(null);
    onClose();
  };

  const runBuild = () =>
    build.mutate(
      { itemId: entry.id, kind: entry.kind },
      {
        onSuccess: (data) =>
          setResult({
            kind: entry.kind,
            rarity: buildQuote.requirement.promotesTo ?? entry.rarity,
            rarityBefore: buildQuote.requirement.promotesTo
              ? entry.rarity
              : undefined,
            rarityAfter: buildQuote.requirement.promotesTo ?? undefined,
            levelBefore: entry.level,
            levelAfter: entry.level + data.levelGain,
            conditionBefore: entry.condition,
            conditionAfter: entry.condition,
            spent: data.spent,
            item: data.item,
          }),
      },
    );

  const runRepair = () =>
    repair.mutate(
      { itemId: entry.id, kind: entry.kind },
      {
        onSuccess: (data) =>
          setResult({
            kind: entry.kind,
            rarity: entry.rarity,
            levelBefore: entry.level,
            levelAfter: entry.level + data.levelGain,
            conditionBefore: entry.condition,
            conditionAfter: data.condition,
            spent: data.spent,
            item: data.item,
          }),
      },
    );

  const runMod = (featureId: string, action: WorkshopModAction) =>
    mod.mutate(
      { itemId: entry.id, kind: entry.kind, featureId, action },
      {
        onSuccess: (data) =>
          setResult({
            kind: entry.kind,
            rarity: entry.rarity,
            levelBefore: entry.level,
            levelAfter: entry.level + data.levelGain,
            conditionBefore: entry.condition,
            conditionAfter: entry.condition,
            spent: data.spent,
            item: data.item,
            headline:
              data.action === "fit"
                ? `${data.label} +${data.points}`
                : `${data.label} +${data.pointsBefore} → +${data.points}`,
          }),
      },
    );

  const conditionCheck = buildQuote.checks.find((c) => c.kind === "condition")!;
  const fameCheck = buildQuote.checks.find((c) => c.kind === "fame")!;

  const title = result
    ? "Done"
    : job === "repair"
      ? `Restore to ${repairQuote.target}`
      : job === "mod"
        ? "Fit a mod"
        : (buildQuote.requirement.promotesTo ?? null)
          ? `Promote to ${buildQuote.requirement.promotesTo}`
          : "Next build";

  const caption = result
    ? entry.name
    : job === "repair" || job === "mod"
      ? entry.name
      : `${entry.name} · build ${entry.buildLevel} → ${buildQuote.requirement.level}`;

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className='fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center'>
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className='my-auto flex w-full max-w-3xl flex-col gap-7 rounded-lg bg-zinc-900 p-7'>
            <div className='flex items-start justify-between gap-4'>
              <div className='flex flex-col gap-1'>
                <span className='text-xs font-bold tracking-[0.2em] text-zinc-400'>
                  {caption}
                </span>
                <h2 className='text-2xl font-black text-white'>{title}</h2>
              </div>

              <button
                onClick={close}
                aria-label='Close'
                className='rounded-lg p-2 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 hover:bg-zinc-800 hover:text-zinc-200'>
                <X size={16} />
              </button>
            </div>

            {result ? (
              <>
                <WorkshopResultView result={result} />
                <button
                  onClick={close}
                  className='rounded-lg bg-zinc-100 px-5 py-3.5 text-sm font-bold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-white'>
                  Done
                </button>
              </>
            ) : job === "repair" ? (
              <>
                <RewardPanel accent='emerald'>
                  <ConditionDelta
                    from={repairQuote.fromCondition}
                    to={repairQuote.toCondition}
                  />
                  <LevelDelta
                    from={entry.level}
                    to={entry.level + repairQuote.gain}
                    rarity={entry.rarity}
                  />
                </RewardPanel>

                <CostList recipe={repairQuote.recipe} />

                <button
                  onClick={runRepair}
                  disabled={!repairQuote.canRepair || isPending}
                  className={cn(
                    "rounded-lg px-5 py-3.5 text-sm font-bold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400",
                    "disabled:pointer-events-none disabled:opacity-40",
                    repairQuote.canRepair
                      ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                      : "bg-zinc-800/60 text-zinc-500",
                  )}>
                  {repair.isPending
                    ? "Restoring…"
                    : `Restore to ${repairQuote.target}`}
                </button>
              </>
            ) : job === "mod" ? (
              <>
                <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-5'>
                  <span className='text-xs font-bold tracking-[0.15em] text-zinc-400'>
                    Mod slots
                  </span>
                  <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                    <span className='text-3xl font-black tabular-nums text-white'>
                      {modQuote.slots.used}
                      <span className='text-zinc-600'>
                        /{modQuote.slots.max}
                      </span>
                    </span>
                    <span className='text-sm text-zinc-400'>
                      {modQuote.slots.free > 0
                        ? `${modQuote.candidates.length} mod${modQuote.candidates.length === 1 ? "" : "s"} still fit this build`
                        : `${entry.rarity} holds no more — a promotion buys the room`}
                    </span>
                  </div>
                </div>

                <ModPicker
                  candidates={modQuote.candidates}
                  fitted={modQuote.fitted}
                  slotsFull={modQuote.slots.free === 0}
                  busy={isPending}
                  onFit={(featureId) => runMod(featureId, "fit")}
                  onReroll={(featureId) => runMod(featureId, "reroll")}
                />
              </>
            ) : (
              <>
                <RewardPanel accent='cyan'>
                  {buildQuote.requirement.promotesTo && (
                    <RarityDelta
                      from={entry.rarity}
                      to={buildQuote.requirement.promotesTo}
                    />
                  )}
                  <LevelDelta
                    from={entry.level}
                    to={entry.level + buildQuote.gain}
                    rarity={buildQuote.requirement.promotesTo ?? entry.rarity}
                  />
                </RewardPanel>

                <GateRow
                  ok={conditionCheck.ok}
                  condition={entry.condition}
                  required={getGradeByRank(conditionCheck.required)}
                />

                <CostList
                  recipe={buildQuote.recipe}
                  fame={{
                    need: fameCheck.required,
                    have: fameCheck.current,
                  }}
                />

                <BuildLadder subject={entry.subject} wallet={wallet} />

                <button
                  onClick={runBuild}
                  disabled={!buildQuote.canBuild || isPending}
                  className={cn(
                    "rounded-lg px-5 py-3.5 text-sm font-bold transition-colors",
                    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
                    "disabled:pointer-events-none disabled:opacity-40",
                    buildQuote.canBuild
                      ? "bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25"
                      : "bg-zinc-800/60 text-zinc-500",
                  )}>
                  {build.isPending
                    ? "Fitting…"
                    : buildQuote.requirement.promotesTo
                      ? `Promote to ${buildQuote.requirement.promotesTo}`
                      : `Fit mod — build ${buildQuote.requirement.level}`}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
