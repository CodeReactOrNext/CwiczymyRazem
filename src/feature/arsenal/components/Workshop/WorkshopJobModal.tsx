import { buttonVariants } from "assets/components/ui/button";
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
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useWorkshopBuild } from "feature/arsenal/hooks/useWorkshopBuild";
import { useWorkshopMod } from "feature/arsenal/hooks/useWorkshopMod";
import { useWorkshopRepair } from "feature/arsenal/hooks/useWorkshopRepair";
import type { WorkshopModAction } from "feature/arsenal/types/arsenal.types";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { WorkshopEntry } from "feature/arsenal/utils/workshopEntries";
import { Lock, Wrench, X } from "lucide-react";
import { useState } from "react";

import { SectionLabel } from "../SectionLabel";
import { BuildLadder } from "./BuildLadder";
import { BuildPanel } from "./BuildPanel";
import { CostChips } from "./CostChips";
import { GO_KEY } from "./goKey";
import { ModPicker } from "./ModPicker";
import { ModRemoveDialog } from "./ModRemoveDialog";
import { RestorePanel } from "./RestorePanel";
import { GateRow } from "./RewardPanel";
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
const buildLabel = (
  quote: BuildQuote,
  labels: ReturnType<typeof useArsenalLabels>,
): string =>
  quote.requirement.promotesTo
    ? labels.t("workshop.promote_to", {
        rarity: labels.rarity(quote.requirement.promotesTo),
      })
    : labels.t("workshop.build_n", { build: quote.requirement.level });

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
  // A fit plays the fit scene; the result below is the receipt it leaves.
  const mod = useWorkshopMod({ scene: true });
  const [result, setResult] = useState<WorkshopResult | null>(null);
  const labels = useArsenalLabels();
  const { t } = labels;
  const conditionName = (key: string) => t(`labels.condition.${key}`, key);
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

  // A build or a restoration that played its scene has said everything the
  // result card would: the dialog closes under the scene rather than waiting
  // behind it with a second "Done" to press. Without a scene — nothing mounted
  // to play one — the card is still the only answer, so it stays.
  const runBuild = () =>
    build.mutate(
      { itemId: entry.id, kind: entry.kind },
      {
        onSuccess: (data, _vars, scene) =>
          scene?.sceneId != null
            ? close()
            : setResult({
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
        onSuccess: (data, _vars, scene) =>
          scene?.sceneId != null
            ? close()
            : setResult({
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
          const name = labels.mod(data.featureId, data.label);
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
                ? `${name} +${data.pointsBefore} → +${data.points}`
                : data.action === "remove"
                  ? t("workshop.mod_taken_off", {
                      name,
                      points: data.pointsBefore,
                    })
                  : `${name} +${data.points}`,
          });
        },
      },
    );

  /** A mod the player owns that fits, with a slot free for it — the only fit there is. */
  const canRefit = modQuote.slots.free > 0 && salvagedOptions.length > 0;

  const conditionCheck = buildQuote.checks.find((c) => c.kind === "condition")!;
  const fameCheck = buildQuote.checks.find((c) => c.kind === "fame")!;

  const title = result
    ? t("mods.done")
    : job === "repair"
      ? t("workshop.restore_name", { name: entry.name })
      : job === "mod"
        ? t("mods.install_mod")
        : t("workshop.upgrade_name", { name: entry.name });

  // The restoration and the upgrade read as a line about the job — what it
  // does, or where it goes — because the item is already in their titles.
  const caption = result
    ? entry.name
    : job === "repair"
      ? t("workshop.improve_condition", { count: repairQuote.gain })
      : job === "mod"
        ? entry.name
        : t("workshop.build_arrow", {
            from: entry.buildLevel,
            to: buildQuote.requirement.level,
          });
  const captionIsSentence = !result && job !== "mod";

  // The quotes behind these were already recomputed by the refetch the job
  // triggered, so what is offered here is what the player can actually afford now.
  const nextJobs: { job: WorkshopJob; label: string }[] = [
    ...(repairQuote.canRepair
      ? [
          {
            job: "repair" as const,
            label: t("workshop.restore_to", {
              grade: conditionName(repairQuote.target ?? ""),
            }),
          },
        ]
      : []),
    ...(buildQuote.canBuild
      ? [{ job: "build" as const, label: buildLabel(buildQuote, labels) }]
      : []),
    ...(canRefit || modQuote.canReroll
      ? [
          {
            job: "mod" as const,
            label: canRefit
              ? t("workshop.install_another_mod")
              : t("workshop.reroll_a_mod"),
          },
        ]
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
          "flex max-h-[100dvh] flex-col gap-7 bg-zinc-900 p-6 sm:max-h-[90vh] sm:overflow-y-auto sm:p-7",
          // MobileBottomNav (z-[100]) floats over this dialog below lg; leave room
          // under the action buttons so they can scroll clear of it.
          "pb-[calc(6rem+env(safe-area-inset-bottom))] sm:pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-7",
          // The mod bench is the one job that is a *list*: every row carries art,
          // a name, a whole bill and two buttons, and at the width the other two
          // jobs need those bills wrap into a second line each. Held for the
          // result too, so finishing a mod does not snap the dialog narrower.
          job === "mod" ? "sm:max-w-5xl" : "sm:max-w-3xl",
        )}>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex min-w-0 items-center gap-4'>
            {/* The item on the bench, so the dialog is unmistakably about it. */}
            <span className='flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-950/60'>
              <img
                src={entry.imageSrc}
                alt=''
                draggable={false}
                className='h-14 w-14 object-contain'
              />
            </span>
            <div className='flex min-w-0 flex-col gap-1'>
              <DialogTitle className='text-2xl font-black text-white'>
                {title}
              </DialogTitle>
              <DialogDescription
                className={
                  captionIsSentence
                    ? "text-sm text-zinc-400"
                    : "text-sm font-semibold text-zinc-400"
                }>
                {caption}
              </DialogDescription>
            </div>
          </div>

          <button
            onClick={close}
            disabled={isPending}
            aria-label={t("common.close")}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
            <X size={16} />
          </button>
        </div>

        {result ? (
          <>
            <WorkshopResultView result={result} />
            <div className='flex flex-col gap-3 sm:flex-row-reverse'>
              <button
                onClick={close}
                className={cn(buttonVariants({ size: "lg" }), "sm:flex-1")}>
                {t("mods.done")}
              </button>
              {nextJobs.map((next) => (
                <button
                  key={next.job}
                  onClick={() => goTo(next.job)}
                  className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "sm:flex-1")}>
                  {next.label}
                </button>
              ))}
            </div>
          </>
        ) : job === "repair" ? (
          <>
            <RestorePanel
              fromCondition={repairQuote.fromCondition}
              toCondition={repairQuote.toCondition}
              fromLevel={entry.level}
              toLevel={entry.level + repairQuote.gain}
            />

            {/* The bill as chips — "have/need" per part, amber when short,
                and "Make" where the tier below can cover the gap. */}
            <CostChips
              lines={repairQuote.recipe}
              wallet={wallet}
              playerFame={fame}
              busy={isPending}
            />

            <div className='flex flex-col gap-3 sm:flex-row'>
              <button
                onClick={close}
                disabled={isPending}
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "sm:w-44")}>
                {t("common.cancel")}
              </button>
              <button
                onClick={runRepair}
                disabled={!repairQuote.canRepair || isPending}
                className={cn(
                  buttonVariants({ size: "xl" }),
                  repairQuote.canRepair && GO_KEY,
                  "flex-1",
                )}>
                <Wrench size={16} />
                {repair.isPending
                  ? t("workshop.restoring")
                  : t("workshop.job_with_gain", {
                      job: t("workshop.restore_to", {
                        grade: conditionName(repairQuote.target ?? ""),
                      }),
                      count: repairQuote.gain,
                    })}
              </button>
            </div>
          </>
        ) : job === "mod" ? (
          <>
            <div className='flex flex-col gap-3 rounded-lg bg-zinc-800/40 p-5'>
              <SectionLabel>{t("workshop.mod_slots")}</SectionLabel>
              <div className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                <span className='text-3xl font-black tabular-nums text-white'>
                  {modQuote.slots.used}
                  <span className='text-zinc-600'>/{modQuote.slots.max}</span>
                </span>
                <span className='text-sm text-zinc-400'>
                  {modQuote.slots.free === 0
                    ? t("workshop.slots_no_more", {
                        rarity: labels.rarity(entry.rarity),
                      })
                    : salvagedOptions.length > 0
                      ? t("workshop.you_own_fit", {
                          count: salvagedOptions.length,
                        })
                      : t("workshop.nothing_fits_yet")}
                </span>
              </div>
            </div>

            <ModPicker
              salvaged={salvagedOptions}
              fitted={modQuote.fitted}
              compatible={modQuote.compatible}
              slotsFull={modQuote.slots.free === 0}
              removeFame={MOD_REMOVE_FAME_COST}
              canRemove={modQuote.canRemove}
              busy={isPending}
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
            <BuildPanel
              fromBuild={entry.buildLevel}
              toBuild={buildQuote.requirement.level}
              fromLevel={entry.level}
              toLevel={entry.level + buildQuote.gain}
              promotesTo={buildQuote.requirement.promotesTo}
            />

            {/* Only when it blocks: a condition that is already good enough
                is not news, and the green line saying so was one more block
                to read past on the way to the button. */}
            {!conditionCheck.ok && (
              <GateRow
                ok={false}
                condition={entry.condition}
                required={getGradeByRank(conditionCheck.required)}
                onRestore={
                  repairQuote.canRepair ? () => goTo("repair") : undefined
                }
              />
            )}

            <CostChips
              lines={buildQuote.recipe}
              fame={{
                need: fameCheck.required,
                have: fameCheck.current,
              }}
              wallet={wallet}
              playerFame={fame}
              busy={isPending}
            />

            <div className='flex flex-col gap-3 sm:flex-row'>
              <button
                onClick={close}
                disabled={isPending}
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "sm:w-44")}>
                {t("common.cancel")}
              </button>
              <button
                onClick={runBuild}
                disabled={!buildQuote.canBuild || isPending}
                className={cn(
                  buttonVariants({ size: "xl" }),
                  buildQuote.canBuild && GO_KEY,
                  "flex-1",
                )}>
                {!conditionCheck.ok && <Lock size={16} />}
                {build.isPending
                  ? t("workshop.building")
                  : t("workshop.job_with_gain", {
                      job: buildQuote.requirement.promotesTo
                        ? buildLabel(buildQuote, labels)
                        : t("workshop.upgrade_to_build", {
                            build: buildQuote.requirement.level,
                          }),
                      count: buildQuote.gain,
                    })}
              </button>
            </div>

            {/* Every rung of the ladder, folded away under its own toggle —
                for the player planning ahead, not in the way of this job. */}
            <BuildLadder subject={entry.subject} wallet={wallet} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
