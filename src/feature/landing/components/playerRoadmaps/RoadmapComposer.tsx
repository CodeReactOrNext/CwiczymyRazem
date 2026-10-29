import { cn } from "assets/lib/utils";
import type {
  RoadmapExample,
  RoadmapExampleStep,
} from "feature/landing/data/playerRoadmapExamples";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { fadeUp, transitions } from "lib/motion/motion";
import { useEffect, useRef, useState } from "react";

/** How long one roadmap stays on screen before the next goal is written up. */
const CYCLE_MS = 9500;

/** What the job is doing, and the moment (ms) each label takes over. */
const STAGES = [
  { at: 0, label: "Reading the goal" },
  { at: 800, label: "Drafting the phases" },
  { at: 1600, label: "Reviewing the draft" },
  { at: 2400, label: "Writing every step" },
  { at: 3100, label: "Picking lessons" },
  { at: 3800, label: "Ready" },
];
const LAST_STAGE = STAGES.length - 1;

/** Seconds: phases land one after another while the draft is "written". */
const PHASES_FROM = 1;
const PHASE_STAGGER = 0.22;
const STEP_STAGGER = 0.025;

const pad = (n: number) => String(n).padStart(2, "0");

/** One pip per step, coloured by what the step brings — the legend below says which. */
const stepTone = (step: RoadmapExampleStep) =>
  step.song ? "bg-amber-400/80" : step.exercise ? "bg-zinc-400" : "bg-zinc-700";

const LEGEND = [
  { label: "Exercise", tone: "bg-zinc-400" },
  { label: "Song", tone: "bg-amber-400/80" },
  { label: "Lessons", tone: "bg-zinc-700" },
  { label: "Start here", tone: "bg-cyan-400" },
];

const ComposedRoadmap = ({
  roadmap,
  still,
}: {
  roadmap: RoadmapExample;
  still: boolean;
}) => {
  const [stage, setStage] = useState(still ? LAST_STAGE : 0);

  useEffect(() => {
    if (still) return undefined;
    const timers = STAGES.slice(1).map((entry, idx) =>
      window.setTimeout(() => setStage(idx + 1), entry.at),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [still]);

  const ready = stage === LAST_STAGE;
  const stepCount = roadmap.phases.reduce((n, p) => n + p.steps.length, 0);
  const songCount = new Set(
    roadmap.phases.flatMap((p) => p.steps.map((s) => s.song).filter(Boolean)),
  ).size;
  const firstStep = roadmap.phases[0]?.steps[0];

  return (
    <motion.div
      initial={still ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transitions.base}>
      <p className='text-xs text-zinc-500'>Goal · {roadmap.level}</p>
      <motion.p
        className='mt-1.5 text-lg font-bold text-white'
        initial={still ? false : { clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: 0.7, ease: "linear" }}>
        {roadmap.title}
      </motion.p>
      <motion.p
        className='mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400'
        initial={still ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...transitions.slow, delay: 0.35 }}>
        &ldquo;{roadmap.goal}&rdquo;
      </motion.p>

      <div className='mt-6'>
        <div className='flex items-baseline justify-between gap-4 text-xs'>
          <span
            aria-live='polite'
            className={cn(
              "font-semibold transition-colors duration-base",
              ready ? "text-emerald-400" : "text-zinc-300",
            )}>
            {STAGES[stage].label}
          </span>
          <motion.span
            className='tabular-nums text-zinc-500'
            initial={false}
            animate={{ opacity: ready ? 1 : 0 }}
            transition={transitions.base}>
            {roadmap.phases.length} phases · {stepCount} steps
            {songCount > 0 && ` · ${songCount} songs`}
          </motion.span>
        </div>
        <div className='mt-2 h-1 overflow-hidden rounded-full bg-zinc-800'>
          <motion.div
            className={cn(
              "h-full origin-left rounded-full transition-colors duration-base",
              ready ? "bg-emerald-500" : "bg-zinc-400",
            )}
            initial={still ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: STAGES[LAST_STAGE].at / 1000,
              ease: "linear",
            }}
          />
        </div>
      </div>

      {/* Room for eight phases, the most a roadmap has, so switching
          roadmaps never moves the page. */}
      <ol className='mt-6 min-h-[14.5rem] space-y-2.5'>
        {roadmap.phases.map((phase, phaseIdx) => {
          const phaseAt = PHASES_FROM + phaseIdx * PHASE_STAGGER;
          return (
            <motion.li
              key={phase.title}
              className='flex items-center gap-3'
              initial={still ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...transitions.base, delay: phaseAt }}>
              <span className='w-6 shrink-0 font-teko text-xl tabular-nums leading-none text-zinc-500'>
                {pad(phaseIdx + 1)}
              </span>
              <span className='min-w-0 flex-1 truncate text-sm text-zinc-200'>
                {phase.title}
              </span>
              <span className='flex w-[30%] shrink-0 flex-wrap justify-end gap-1 sm:w-[42%]'>
                {phase.steps.map((step, stepIdx) => (
                  <motion.span
                    key={stepIdx}
                    className={cn(
                      "h-1.5 w-1.5 origin-left rounded-full transition-colors duration-base sm:w-2.5",
                      ready && phaseIdx === 0 && stepIdx === 0
                        ? "bg-cyan-400"
                        : stepTone(step),
                    )}
                    initial={still ? false : { opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{
                      ...transitions.base,
                      delay: phaseAt + 0.15 + stepIdx * STEP_STAGGER,
                    }}
                  />
                ))}
              </span>
            </motion.li>
          );
        })}
      </ol>

      <div className='mt-5 h-6'>
        <AnimatePresence>
          {ready && firstStep && (
            <motion.p
              key='start'
              variants={fadeUp}
              initial={still ? false : "hidden"}
              animate='visible'
              exit='hidden'
              className='flex min-w-0 items-center gap-3 text-sm'>
              <span className='h-2 w-2 shrink-0 rounded-full bg-cyan-400' />
              <span className='shrink-0 text-xs font-semibold text-cyan-400'>
                Start here
              </span>
              <span className='truncate text-zinc-200'>{firstStep.title}</span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

/**
 * The hero's moving picture: a real player's goal is written up, the job
 * runs through its stages, the phases land one by one and fill with steps,
 * and the first step is marked as where practice starts. Then the next
 * player's goal. Every title is from a real public roadmap.
 *
 * Grey on purpose, like the map in the app: amber marks a song, cyan the one
 * step to start with, emerald that the roadmap is ready. With reduced motion
 * it shows the finished roadmap and only changes when a tab is picked.
 */
export const RoadmapComposer = ({
  examples,
}: {
  examples: RoadmapExample[];
}) => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const [index, setIndex] = useState(0);
  // A picked tab stops the carousel: the reader is now reading that one.
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (still || !auto || !inView) return undefined;
    const id = window.setTimeout(
      () => setIndex((value) => (value + 1) % examples.length),
      CYCLE_MS,
    );
    return () => window.clearTimeout(id);
  }, [index, auto, inView, still, examples.length]);

  return (
    <div ref={ref} className='flex flex-col gap-4'>
      <div
        role='group'
        aria-label='Example roadmaps'
        className='flex flex-wrap gap-2'>
        {examples.map((example, idx) => (
          <button
            key={example.id}
            type='button'
            aria-pressed={idx === index}
            onClick={() => {
              setAuto(false);
              setIndex(idx);
            }}
            className={cn(
              "rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
              idx === index
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
            )}>
            {example.title}
          </button>
        ))}
      </div>

      <div className='rounded-lg bg-zinc-900/40 p-6 sm:p-7'>
        <AnimatePresence mode='wait'>
          <ComposedRoadmap
            key={examples[index].id}
            roadmap={examples[index]}
            still={still}
          />
        </AnimatePresence>
      </div>

      <ul className='flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-zinc-500'>
        {LEGEND.map((item) => (
          <li key={item.label} className='flex items-center gap-1.5'>
            <span className={cn("h-1.5 w-2.5 rounded-full", item.tone)} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
