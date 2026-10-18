import { cn } from "assets/lib/utils";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { transitions } from "lib/motion/motion";
import { Dumbbell, Music } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { FaYoutube } from "react-icons/fa6";

type StepKind = "exercise" | "song" | "lesson";

/** A step as the preview draws it: what it brings, and how long its title runs (% of the column). */
type PreviewStep = [StepKind, number];

const KIND_ICON: Record<StepKind, ComponentType<{ className?: string }>> = {
  exercise: Dumbbell,
  song: Music,
  lesson: FaYoutube,
};

/**
 * One made-up roadmap per example goal in `supporter:panel.generate.examples`
 * — three phases, a few steps each — so every loop builds a different plan.
 */
const SHAPES: PreviewStep[][][] = [
  [
    [
      ["exercise", 84],
      ["lesson", 62],
      ["exercise", 72],
    ],
    [
      ["exercise", 68],
      ["song", 90],
    ],
    [
      ["lesson", 76],
      ["exercise", 58],
      ["song", 82],
    ],
  ],
  [
    [
      ["exercise", 74],
      ["exercise", 60],
    ],
    [
      ["lesson", 86],
      ["exercise", 66],
      ["song", 70],
    ],
    [
      ["song", 80],
      ["song", 64],
    ],
  ],
  [
    [
      ["exercise", 70],
      ["lesson", 82],
      ["song", 60],
    ],
    [
      ["exercise", 88],
      ["song", 66],
    ],
    [
      ["song", 74],
      ["exercise", 56],
      ["song", 84],
    ],
  ],
  [
    [
      ["exercise", 90],
      ["exercise", 64],
      ["lesson", 72],
    ],
    [
      ["exercise", 76],
      ["song", 58],
    ],
    [
      ["lesson", 66],
      ["exercise", 82],
      ["song", 70],
    ],
  ],
];

/** The three things the coach does, as the line under the preview names them. */
const ACTS = ["goal", "phases", "steps"] as const;

const TICK_MS = 50;
const CYCLE_MS = 6400;
const TYPE_FROM = 200;
const TYPE_MS = 900;
const PHASES_FROM = 1500;
const PHASE_STAGGER = 160;
const STEPS_FROM = 2200;
const STEP_STAGGER = 110;
const READY_FROM = 3300;
const FADE_FROM = 6000;

/**
 * How a roadmap gets made, played on a loop on the folded generator card: a
 * goal is typed, the coach lays out numbered phases, each phase fills with
 * exercises, songs and video lessons, and the first step is marked as where
 * practice starts. The line underneath names each act as it plays.
 *
 * Grey on purpose — the only colour is the cyan mark on the first step, the
 * same "next" the map uses. With reduced motion it shows the finished plan
 * and stays still.
 */
export const RoadmapBuildPreview = ({ className }: { className?: string }) => {
  const { t } = useTranslation("supporter");
  const reduceMotion = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (reduceMotion) return undefined;
    const id = window.setInterval(
      () => setElapsed((value) => value + TICK_MS),
      TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const local = reduceMotion ? READY_FROM : elapsed % CYCLE_MS;
  const example = reduceMotion
    ? 0
    : Math.floor(elapsed / CYCLE_MS) % SHAPES.length;
  const shape = SHAPES[example];
  const goal = t(`panel.generate.examples.${example}.title`);

  const typedShare = Math.min(1, Math.max(0, (local - TYPE_FROM) / TYPE_MS));
  const typed = goal.slice(0, Math.round(goal.length * typedShare));
  const typing = local < PHASES_FROM;
  const ready = local >= READY_FROM;
  const fading = local >= FADE_FROM;
  const act = local < PHASES_FROM ? 0 : local < STEPS_FROM ? 1 : 2;
  // Steps arrive phase by phase: where each phase's first step sits in that order.
  const phaseOffsets = shape.map((_, index) =>
    shape.slice(0, index).reduce((sum, steps) => sum + steps.length, 0),
  );

  return (
    <div aria-hidden className={cn("flex flex-col gap-5", className)}>
      <motion.div
        initial={false}
        animate={{ opacity: fading ? 0 : 1 }}
        transition={transitions.slow}
        className='flex flex-col gap-5'>
        <p className='flex h-7 min-w-0 items-center text-base font-semibold text-zinc-100'>
          <span className='truncate'>{typed}</span>
          {typing && (
            <motion.span
              className='ml-0.5 inline-block h-5 w-0.5 shrink-0 rounded bg-zinc-300'
              animate={{ opacity: [1, 0] }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          )}
        </p>

        <div className='grid grid-cols-3 gap-4 sm:gap-6'>
          {shape.map((steps, phaseIndex) => {
            const phaseShown =
              local >= PHASES_FROM + phaseIndex * PHASE_STAGGER;
            return (
              <motion.div
                key={`${example}-${phaseIndex}`}
                initial={false}
                animate={{ opacity: phaseShown ? 1 : 0, y: phaseShown ? 0 : 6 }}
                transition={transitions.base}
                className='flex min-w-0 flex-col gap-3'>
                <span className='flex items-center gap-2'>
                  <span className='text-xs font-semibold tabular-nums text-zinc-400'>
                    {String(phaseIndex + 1).padStart(2, "0")}
                  </span>
                  <span className='h-2 flex-1 rounded-full bg-zinc-600/80' />
                </span>
                {steps.map(([kind, width], stepIndex) => {
                  const order = phaseOffsets[phaseIndex] + stepIndex;
                  const shown = local >= STEPS_FROM + order * STEP_STAGGER;
                  const isNext = ready && order === 0;
                  const Icon = KIND_ICON[kind];
                  return (
                    <motion.span
                      key={stepIndex}
                      initial={false}
                      animate={{ opacity: shown ? 1 : 0, x: shown ? 0 : -4 }}
                      transition={transitions.base}
                      className='flex items-center gap-2'>
                      <Icon
                        className={cn(
                          "h-3 w-3 shrink-0 transition-colors duration-base",
                          isNext ? "text-cyan-300" : "text-zinc-500",
                        )}
                      />
                      <span
                        className={cn(
                          "h-1.5 rounded-full transition-colors duration-base",
                          isNext ? "bg-zinc-300" : "bg-zinc-700/70",
                        )}
                        style={{ width: `${width}%` }}
                      />
                    </motion.span>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <ol className='flex flex-wrap gap-x-5 gap-y-1.5 text-xs'>
        {ACTS.map((id, index) => (
          <li
            key={id}
            className={cn(
              "flex items-center gap-1.5 transition-colors duration-base",
              index === act ? "text-zinc-100" : "text-zinc-500",
            )}>
            <span className='tabular-nums'>{index + 1}</span>
            {t(`panel.generate.preview.${id}`)}
          </li>
        ))}
      </ol>
    </div>
  );
};
