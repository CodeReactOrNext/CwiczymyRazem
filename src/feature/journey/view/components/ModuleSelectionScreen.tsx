import { PRESSABLE_IN_GROUP } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { PageTitle } from "components/PageTitle/PageTitle";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { Lock, Play, Plus, RotateCcw, Signpost } from "lucide-react";
import Link from "next/link";
import React from "react";

import { getComingSoonModules } from "../../data/comingSoonModules";
import type { JourneyModuleWithStatus } from "../../types/journey.types";
import { LandmarkScene } from "./JourneyLandmark";

// ─── Scene ────────────────────────────────────────────────────────────────────
// Each card has one fixed cover: the road's landmark that says what the whole
// module is about (picked by the owner, 2026-11-27). Section scenes like the
// bend only read beside the road, not as the face of a module. A module with
// no cover yet shows its current section's scene.

const MODULE_COVER: Record<string, string> = {
  fundamentals: "stage_1", // metronome
  fretboard: "stage_1", // note names on the neck
  intervals: "stage_1", // a note and the one a fret above it
};

const cardSceneStageId = (
  module: JourneyModuleWithStatus,
  stageIdx: number,
): string | undefined => MODULE_COVER[module.id] ?? module.stages[stageIdx]?.id;

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * One thick bar for the whole module. The road inside the module shows the
 * lessons one by one; the card only needs how far along it is.
 */
const ModuleProgress = ({
  percent,
  isComplete,
}: {
  percent: number;
  isComplete: boolean;
}) => (
  <div className='h-4 overflow-hidden rounded-full bg-zinc-800'>
    {percent > 0 && (
      <div
        className={cn(
          "bar-shine h-full min-w-4 rounded-full [--shine-inset:6px]",
          isComplete ? "bg-emerald-500" : "bg-cyan-400",
        )}
        style={{ width: `${percent}%` }}
      />
    )}
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModuleSelectionScreenProps {
  modules: JourneyModuleWithStatus[];
  onSelectModule: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const CARD =
  "rounded-2xl bg-zinc-900 px-6 py-6 sm:px-9 sm:py-9 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export const ModuleSelectionScreen: React.FC<ModuleSelectionScreenProps> = ({
  modules,
  onSelectModule,
}) => {
  const { t } = useTranslation("journey");
  const comingSoon = getComingSoonModules();

  // First module that isn't fully finished yet — gets the white key.
  const activeIdx = modules.findIndex(
    (m) => m.totalCount === 0 || m.completedCount < m.totalCount,
  );

  return (
    <div className='relative min-h-screen w-full overflow-y-auto overflow-x-hidden'>
      <div className='relative mx-auto max-w-3xl px-4 pb-10 pt-6 md:px-8'>
        <PageTitle
          title={t("modules.title")}
          subtitle={t("modules.subtitle")}
          className='mb-6'
        />

        <div className='space-y-5 sm:space-y-6'>
          {modules.map((module, idx) => {
            const completed = module.completedCount;
            const total = module.totalCount;
            const isComplete = total > 0 && completed === total;
            const isCurrent = idx === activeIdx;
            const percent =
              total > 0 ? Math.round((completed / total) * 100) : 0;

            // The section holding the first unfinished step; the last one once
            // the module is done.
            const openIdx = module.stages.findIndex((stage) =>
              stage.steps.some((step) => step.status !== "completed"),
            );
            const stageIdx =
              openIdx === -1 ? module.stages.length - 1 : openIdx;
            const stage = module.stages[stageIdx];
            const sceneStageId = cardSceneStageId(module, stageIdx);

            const ctaLabel = isComplete
              ? t("modules.replay")
              : completed > 0
                ? t("modules.continue")
                : t("modules.start");

            return (
              <motion.button
                key={module.id}
                type='button'
                onClick={() => onSelectModule(module.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: idx * 0.05,
                  ease: "easeOut",
                }}
                aria-label={module.title}
                className={cn(
                  CARD,
                  "group grid w-full grid-cols-[minmax(0,1fr)_96px] items-center gap-5 text-left hover:bg-[var(--road-card-hover,#1f1f23)] sm:grid-cols-[minmax(0,1fr)_220px] sm:gap-10",
                )}>
                <div className='flex min-w-0 flex-col gap-5 sm:gap-7'>
                  <div className='min-w-0'>
                    <h2 className='font-display text-lg font-extrabold leading-tight text-white sm:text-[22px]'>
                      {module.title}
                    </h2>
                    {/* Where the player is, and how far: the percent stands
                        on its own here, in white, where the bar's own label
                        sank into the fill. */}
                    <div className='mt-2.5 flex items-baseline justify-between gap-3'>
                      <p className='min-w-0 truncate text-[13px] text-zinc-400 sm:text-sm'>
                        {isComplete || !stage ? (
                          t("sidebar.status.completed")
                        ) : (
                          <>
                            {t("path.stage", { n: stageIdx + 1 })}
                            {stage.label && (
                              <>
                                {" · "}
                                <span className='font-semibold text-zinc-200'>
                                  {stage.label}
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </p>
                      <span className='shrink-0 text-base font-bold tabular-nums text-white sm:text-lg'>
                        {percent}%
                      </span>
                    </div>
                  </div>

                  <ModuleProgress percent={percent} isComplete={isComplete} />

                  <span
                    aria-hidden
                    className={cn(
                      PRESSABLE_IN_GROUP,
                      "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm transition-colors sm:max-w-[300px] sm:text-[15px] [&_svg]:size-4",
                      isCurrent
                        ? "border-b-black/25 bg-primary text-primary-foreground group-hover:bg-primary/90"
                        : "border-b-black/25 bg-zinc-800 text-zinc-200 group-hover:bg-zinc-700 group-hover:text-white",
                    )}>
                    {isComplete ? (
                      <RotateCcw strokeWidth={2.5} />
                    ) : (
                      isCurrent && (
                        <Play className='fill-current' strokeWidth={0} />
                      )
                    )}
                    {ctaLabel}
                  </span>
                </div>

                {sceneStageId && (
                  <LandmarkScene
                    moduleId={module.id}
                    stageId={sceneStageId}
                    className='light-hide flex h-24 items-end justify-center sm:h-[170px] [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full'
                  />
                )}
              </motion.button>
            );
          })}

          {/* ─── Coming next ─── */}
          {/* The Journey modules still waiting on the public roadmap, so this
              list promises what /roadmap does. Each opens the roadmap. */}
          {comingSoon.map((upcoming) => (
            <Link
              key={upcoming.id}
              href='/roadmap'
              className={cn(
                CARD,
                "flex items-center justify-between gap-4 hover:bg-[var(--road-card-hover,#1f1f23)]",
              )}>
              <div className='min-w-0'>
                <h2 className='font-display text-lg font-extrabold leading-tight text-zinc-500 sm:text-[22px]'>
                  {upcoming.title}
                </h2>
                {upcoming.subtitle && (
                  <p className='mt-2 text-[13px] text-zinc-500 sm:text-sm'>
                    {upcoming.subtitle}
                  </p>
                )}
                <p className='mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-zinc-500'>
                  <Lock size={13} strokeWidth={2.5} aria-hidden />
                  {t("modules.coming_soon")}
                </p>
              </div>
            </Link>
          ))}

          {/* ─── Own roadmap ─── */}
          {/* The modules are the same for everyone; the coach builds a path
              around the player's own goal on Player Roadmaps. */}
          <Link
            href='/my-roadmaps'
            className='group flex w-full flex-col gap-4 rounded-2xl bg-zinc-900 px-6 py-6 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-[var(--road-card-hover,#1f1f23)] sm:flex-row sm:items-center sm:gap-8 sm:px-9 sm:py-8'>
            <div className='flex min-w-0 flex-1 items-center gap-4'>
              <div className='flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-zinc-800 sm:h-12 sm:w-12'>
                <Signpost
                  className='h-5 w-5 text-zinc-200 sm:h-[22px] sm:w-[22px]'
                  strokeWidth={2}
                />
              </div>
              <div className='min-w-0 flex-1'>
                <h2 className='font-display text-base font-bold text-white sm:text-lg'>
                  {t("modules.create_title")}
                </h2>
                <p className='mt-0.5 text-sm text-zinc-400'>
                  {t("modules.create_body")}
                </p>
              </div>
            </div>
            <span
              aria-hidden
              className={cn(
                PRESSABLE_IN_GROUP,
                "inline-flex h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border-b-black/25 bg-zinc-800 px-4 text-sm text-zinc-200 transition-colors group-hover:bg-zinc-700 group-hover:text-white sm:self-auto [&_svg]:size-4",
              )}>
              <Plus strokeWidth={2.5} />
              {t("modules.create_cta")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};
