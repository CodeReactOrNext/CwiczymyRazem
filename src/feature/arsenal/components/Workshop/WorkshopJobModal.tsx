import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import type { SalvagedModOption } from "feature/arsenal/data/salvage";
import type {
  BuildQuote,
  FittedMod,
  ModQuote,
  RepairQuote,
} from "feature/arsenal/data/workshop";
import {
  getGradeByRank,
  MOD_REMOVE_FAME_COST,
} from "feature/arsenal/data/workshop";
import { useWorkshopBuild } from "feature/arsenal/hooks/useWorkshopBuild";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import { useWorkshopRepair } from "feature/arsenal/hooks/useWorkshopRepair";
import type { WorkshopModAction } from "feature/arsenal/types/arsenal.types";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { X } from "lucide-react";
import { useState } from "react";

import { SectionLabel, sectionLabelClass } from "../SectionLabel";
import { ConditionDelta, LevelDelta, RarityDelta } from "./BeforeAfter";
import { BuildLadder } from "./BuildLadder";
import { CostList } from "./CostList";
import { ModPicker } from "./ModPicker";
import { ModRemoveDialog } from "./ModRemoveDialog";
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
  /** Rescued mods this instrument could take, priced against the wallet. */
  salvagedOptions: SalvagedModOption[];
  /** Passed through to the ladder map so every rung shows stock, not just the next. */
  wallet: ScrapPart[];
  /** The player's Fame — the build's gate, and what a mod removal is paid with. */
  fame: number;
  onClose: () => void;
  /** Lets the finished job hand the player straight into the next one. */
  onChangeJob: (job: WorkshopJob) => void;
}

/** The build's own name for itself. "Fit" belongs to mods and nothing else. */
const buildLabel = (quote: BuildQuote): string =>
  quote.requirement.promotesTo
    ? `Promote to ${quote.requirement.promotesTo}`
    : `Build ${quote.requirement.level}`;

/**
 * Everything about one job, on demand.
 *
 * The bench itself only offers the three actions; the full recipe — requirements,
 * bill, before → after — lives here, and once the job runs the very same dialog
 * turns into the result rather than stacking a second one on top.
 *
 * Built on the shared `ui/dialog`, so Escape, the focus trap, the scroll lock and
 * `role="dialog"` all come for free — and the backdrop refuses to close the
 * dialog while a mutation is still in flight.
 */
export const WorkshopJobModal = ({
  job,
  entry,
  buildQuote,
  repairQuote,
  modQuote,
  salvagedOptions,
  wallet,
  fame,
  onClose,
  onChangeJob,
}: WorkshopJobModalProps) => {
  const build = useWorkshopBuild();
  const repair = useWorkshopRepair();
  const mod = useWorkshopMod();
  const [result, setResult] = useState<WorkshopResult | null>(null);
  /** The mod the player has asked to strip off, waiting on the confirm. */
  const [removing, setRemoving] = useState<FittedMod | null>(null);

  const isPending = build.isPending || repair.isPending || mod.isPending;

  const close = () => {
    setResult(null);
    setRemoving(null);
    onClose();
  };

  /** Hands the player into the next job without a trip back to the bench. */
  const goTo = (next: WorkshopJob) => {
    setResult(null);
    onChangeJob(next);
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

  const runMod = (
    featureId: string | null,
    action: WorkshopModAction,
    salvagedId?: string,
  ) =>
    mod.mutate(
      { itemId: entry.id, kind: entry.kind, featureId, action, salvagedId },
      {
        onSuccess: (data) => {
          setRemoving(null);
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
              data.action === "reroll"
                ? `${data.label} +${data.pointsBefore} → +${data.points}`
                : data.action === "remove"
                  ? `${data.label} +${data.pointsBefore} taken off`
                  : `${data.label} +${data.points}`,
          });
        },
      },
    );

  const conditionCheck = buildQuote.checks.find((c) => c.kind === "condition")!;
  const fameCheck = buildQuote.checks.find((c) => c.kind === "fame")!;

  const title = result
    ? "Done"
    : job === "repair"
      ? `Restore to ${repairQuote.target}`
      : job === "mod"
        ? "Install mod"
        : buildLabel(buildQuote);

  const caption = result
    ? entry.name
    : job === "repair" || job === "mod"
      ? entry.name
      : `${entry.name} · build ${entry.buildLevel} → ${buildQuote.requirement.level}`;

  // The quotes behind these were already recomputed by the refetch the job
  // triggered, so what is offered here is what the player can actually afford now.
  const nextJobs: { job: WorkshopJob; label: string }[] = [
    ...(repairQuote.canRepair
      ? [{ job: "repair" as const, label: `Restore to ${repairQuote.target}` }]
      : []),
    ...(buildQuote.canBuild
      ? [{ job: "build" as const, label: buildLabel(buildQuote) }]
      : []),
    ...(modQuote.canFit ||
    modQuote.canReroll ||
    (modQuote.slots.free > 0 && salvagedOptions.length > 0)
      ? [{ job: "mod" as const, label: "Install another mod" }]
      : []),
  ];

  return (
    <Dialog
      open={job !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) close();
      }}>
      {/* Stacked on top of the bench rather than replacing it: cancelling a
          removal should put the player back in the list they were reading. */}
      <ModRemoveDialog
        mod={removing}
        itemName={entry.name}
        fameCost={MOD_REMOVE_FAME_COST}
        fame={fame}
        isLoading={mod.isPending}
        onConfirm={() => removing && runMod(removing.id, "remove")}
        onCancel={() => setRemoving(null)}
      />
      <DialogContent
        hideCloseButton
        // A job in flight must not be dismissed out from under itself.
        onEscapeKeyDown={(e) => isPending && e.preventDefault()}
        onInteractOutside={(e) => isPending && e.preventDefault()}
        className={cn(
          "flex max-h-[100dvh] flex-col gap-7 border-0 bg-zinc-900 p-6 sm:max-h-[90vh] sm:overflow-y-auto sm:p-7",
          // The mod bench is the one job that is a *list*: every row carries art,
          // a name, a whole bill and two buttons, and at the width the other two
          // jobs need those bills wrap into a second line each. Held for the
          // result too, so finishing a mod does not snap the dialog narrower.
          job === "mod" ? "sm:max-w-5xl" : "sm:max-w-3xl",
        )}>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <DialogDescription className={sectionLabelClass}>
              {caption}
            </DialogDescription>
            <DialogTitle className='text-2xl font-black text-white'>
              {title}
            </DialogTitle>
          </div>

          <button
            onClick={close}
            disabled={isPending}
            aria-label='Close'
            className='rounded-lg p-2 text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:opacity-40 hover:bg-zinc-800 hover:text-zinc-200'>
            <X size={16} />
          </button>
        </div>

        {result ? (
          <>
            <WorkshopResultView result={result} />
            <div className='flex flex-col gap-3 sm:flex-row-reverse'>
              <button
                onClick={close}
                className='rounded-lg bg-zinc-100 px-5 py-3.5 text-sm font-bold text-zinc-900 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-white sm:flex-1'>
                Done
              </button>
              {nextJobs.map((next) => (
                <button
                  key={next.job}
                  onClick={() => goTo(next.job)}
                  className='rounded-lg bg-zinc-800 px-5 py-3.5 text-sm font-bold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 hover:bg-zinc-700 hover:text-white sm:flex-1'>
                  {next.label}
                </button>
              ))}
            </div>
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
              <SectionLabel>Mod slots</SectionLabel>
              <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                <span className='text-3xl font-black tabular-nums text-white'>
                  {modQuote.slots.used}
                  <span className='text-zinc-600'>/{modQuote.slots.max}</span>
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
              salvaged={salvagedOptions}
              slotsFull={modQuote.slots.free === 0}
              removeFame={MOD_REMOVE_FAME_COST}
              canRemove={modQuote.canRemove}
              busy={isPending}
              onFit={(featureId) => runMod(featureId, "fit")}
              onReroll={(featureId) => runMod(featureId, "reroll")}
              onFitSalvaged={(salvagedId) =>
                runMod(null, "fit-salvaged", salvagedId)
              }
              onRemove={(featureId) =>
                setRemoving(
                  modQuote.fitted.find((f) => f.id === featureId) ?? null,
                )
              }
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
              {build.isPending ? "Building…" : buildLabel(buildQuote)}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
