import { PRESSABLE_IN_GROUP } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FeedbackModal } from "components/FeedbackBubble/FeedbackBubble";
import { PageTitle } from "components/PageTitle/PageTitle";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import {
  Check,
  Grid3x3,
  Guitar,
  Lightbulb,
  type LucideIcon,
  Play,
  RotateCcw,
  Ruler,
} from "lucide-react";
import React, { useState } from "react";

import type {
  JourneyModuleWithStatus,
  LockedModulePlaceholder,
} from "../../types/journey.types";

// ─── Config ───────────────────────────────────────────────────────────────────
// One accent per module, drawn from the app's semantic palette. It colours the
// icon tile only: the card itself is plain zinc, and the road inside it keeps
// the app's meaning colours (emerald = done, white = next) whatever the module.

const MODULE_CFG: Record<
  string,
  {
    Icon: LucideIcon;
    tileBg: string;
    tileFg: string;
  }
> = {
  fundamentals: {
    Icon: Guitar,
    tileBg: "bg-cyan-500/10",
    tileFg: "text-cyan-400",
  },
  fretboard: {
    Icon: Grid3x3,
    tileBg: "bg-purple-500/10",
    tileFg: "text-purple-400",
  },
  intervals: {
    Icon: Ruler,
    tileBg: "bg-amber-500/10",
    tileFg: "text-amber-400",
  },
};

// ─── Road ─────────────────────────────────────────────────────────────────────
// A miniature of the module's path: one small key per lesson, grouped by the
// module's real sections, so the card shows what is inside and how far along
// the player is.

const ModuleRoad = ({ module }: { module: JourneyModuleWithStatus }) => {
  const { t } = useTranslation("journey");
  const steps = module.stages.flatMap((stage) => stage.steps);
  const currentId = steps.find((step) => step.status !== "completed")?.id;

  return (
    <div
      aria-hidden
      className='flex min-w-0 flex-1 flex-wrap gap-x-4 gap-y-3 sm:gap-x-[22px] sm:gap-y-3.5'>
      {module.stages.map((stage, idx) => {
        const isCurrentStage = stage.steps.some(
          (step) => step.id === currentId,
        );

        return (
          <div key={stage.id} className='flex min-w-0 flex-col gap-2'>
            <span
              className={cn(
                "truncate text-[11px] font-medium",
                isCurrentStage ? "text-zinc-300" : "text-zinc-500",
              )}>
              {stage.label ?? t("path.stage", { n: idx + 1 })}
            </span>
            <div className='flex items-end gap-[5px] sm:gap-1.5'>
              {stage.steps.map((step) => {
                if (step.status === "completed") {
                  return (
                    <span
                      key={step.id}
                      className='grid h-4 w-4 place-items-center rounded-[5px] border-b-[3px] border-b-black/35 bg-emerald-500 text-emerald-950 sm:h-5 sm:w-5 sm:rounded-md'>
                      <Check
                        className='h-2.5 w-2.5 sm:h-3 sm:w-3'
                        strokeWidth={3.5}
                      />
                    </span>
                  );
                }
                if (step.id === currentId) {
                  return (
                    <span
                      key={step.id}
                      className='grid h-[22px] w-[22px] place-items-center rounded-md border-b-[3px] border-b-black/35 bg-white text-zinc-950 sm:h-[26px] sm:w-[26px] sm:rounded-[7px]'>
                      <Play
                        className='h-2.5 w-2.5 fill-current sm:h-3 sm:w-3'
                        strokeWidth={0}
                      />
                    </span>
                  );
                }
                return (
                  <span
                    key={step.id}
                    className='h-4 w-4 rounded-[5px] border-b-[3px] border-b-black/35 bg-zinc-800 sm:h-5 sm:w-5 sm:rounded-md'
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ModuleSelectionScreenProps {
  modules: JourneyModuleWithStatus[];
  placeholders: LockedModulePlaceholder[];
  onSelectModule: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ModuleSelectionScreen: React.FC<ModuleSelectionScreenProps> = ({
  modules,
  placeholders,
  onSelectModule,
}) => {
  const { t } = useTranslation("journey");
  const [suggestOpen, setSuggestOpen] = useState(false);

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

        <div className='space-y-3.5'>
          {modules.map((module, idx) => {
            const cfg = MODULE_CFG[module.id] ?? MODULE_CFG.fundamentals;
            const Icon = cfg.Icon;
            const completed = module.completedCount;
            const total = module.totalCount;
            const isComplete = total > 0 && completed === total;
            const isCurrent = idx === activeIdx;
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
                className='group relative flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-zinc-900 px-4 py-[18px] text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-[#1f1f23] sm:gap-5 sm:px-6 sm:py-[22px]'>
                <div className='flex items-center gap-4'>
                  <div
                    className={cn(
                      "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12",
                      isComplete ? "bg-emerald-500/10" : cfg.tileBg,
                    )}>
                    {isComplete ? (
                      <Check
                        className='h-5 w-5 text-emerald-400'
                        strokeWidth={2.5}
                      />
                    ) : (
                      <Icon
                        className={cn(
                          "h-5 w-5 sm:h-[22px] sm:w-[22px]",
                          cfg.tileFg,
                        )}
                        strokeWidth={2}
                      />
                    )}
                  </div>

                  <div className='min-w-0 flex-1'>
                    <h2 className='truncate font-display text-base font-bold text-white sm:text-lg'>
                      {module.title}
                    </h2>
                    <p className='mt-0.5 hidden truncate text-sm text-zinc-400 sm:block'>
                      {module.subtitle}
                    </p>
                  </div>

                  <span className='shrink-0 whitespace-nowrap font-teko text-[34px] font-semibold tabular-nums leading-[0.8] text-white'>
                    {completed}
                    <span className='text-[22px] text-zinc-500'>/{total}</span>
                  </span>
                </div>

                <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6'>
                  <ModuleRoad module={module} />
                  <span
                    aria-hidden
                    className={cn(
                      PRESSABLE_IN_GROUP,
                      "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm transition-colors [&_svg]:size-4",
                      isCurrent
                        ? "border-b-black/25 bg-primary text-primary-foreground group-hover:bg-primary/90"
                        : "border-b-black/25 bg-zinc-800/60 text-zinc-200 group-hover:bg-zinc-800 group-hover:text-white",
                    )}>
                    {isComplete && <RotateCcw strokeWidth={2.5} />}
                    {ctaLabel}
                  </span>
                </div>
              </motion.button>
            );
          })}

          {/* ─── Suggest a path ─── */}
          <button
            onClick={() => setSuggestOpen(true)}
            className='flex w-full items-center gap-4 rounded-lg bg-zinc-900 px-5 py-4 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 active:click-behavior'>
            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800'>
              <Lightbulb className='h-4 w-4 text-zinc-400' />
            </div>
            <div>
              <p className='text-sm font-semibold text-zinc-300'>
                {t("modules.suggest")}
              </p>
              <p className='text-xs text-zinc-500'>
                {placeholders.length > 0
                  ? t("modules.missing_coming", {
                      topics: placeholders.map((p) => p.title).join(", "),
                    })
                  : t("modules.missing")}
              </p>
            </div>
          </button>
        </div>
      </div>

      <FeedbackModal
        isOpen={suggestOpen}
        onClose={() => setSuggestOpen(false)}
      />
    </div>
  );
};
