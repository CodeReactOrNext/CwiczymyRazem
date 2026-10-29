import { cn } from "assets/lib/utils";
import type { RoadmapExample } from "feature/landing/data/playerRoadmapExamples";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, stagger } from "lib/motion/motion";
import { Dumbbell, Music } from "lucide-react";
import { useState } from "react";
import { FaYoutube } from "react-icons/fa6";

const pad = (n: number) => String(n).padStart(2, "0");

const phaseAnchor = (idx: number) => `phase-${idx + 1}`;

/**
 * One real roadmap, every phase and every step, so the reader judges the
 * thing itself rather than a description of it. On wide screens the goal
 * and a phase index stay pinned on the left and follow the phase in the
 * middle of the screen; on a phone it is a plain list of phase cards.
 */
export const RoadmapWalkthrough = ({
  roadmap,
}: {
  roadmap: RoadmapExample;
}) => {
  const still = !!useReducedMotion();
  const [active, setActive] = useState(0);
  const stepCount = roadmap.phases.reduce((n, p) => n + p.steps.length, 0);

  return (
    <div className='grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-14'>
      <aside className='lg:sticky lg:top-24 lg:self-start'>
        <div className='rounded-lg bg-zinc-900/40 p-6'>
          <p className='text-xs text-zinc-500'>
            {roadmap.level} · {roadmap.phases.length} phases · {stepCount} steps
          </p>
          <h3 className='mt-2 text-2xl font-bold text-white'>
            {roadmap.title}
          </h3>
          <p className='mt-3 text-sm leading-relaxed text-zinc-400'>
            &ldquo;{roadmap.goal}&rdquo;
          </p>

          <nav aria-label='Phases' className='mt-6 hidden lg:block'>
            <ol className='space-y-0.5'>
              {roadmap.phases.map((phase, idx) => (
                <li key={phase.title}>
                  <a
                    href={`#${phaseAnchor(idx)}`}
                    aria-current={active === idx ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded px-2 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500",
                      active === idx
                        ? "bg-zinc-800/60 text-white"
                        : "text-zinc-500 hover:text-zinc-300",
                    )}>
                    <span className='w-6 shrink-0 font-teko text-lg tabular-nums leading-none'>
                      {pad(idx + 1)}
                    </span>
                    <span className='truncate'>{phase.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </aside>

      <div className='space-y-4'>
        {roadmap.phases.map((phase, idx) => (
          <motion.section
            key={phase.title}
            id={phaseAnchor(idx)}
            aria-label={`Phase ${idx + 1}: ${phase.title}`}
            className='scroll-mt-24 rounded-lg bg-zinc-900/40 p-6'
            onViewportEnter={() => setActive(idx)}
            viewport={{ margin: "-45% 0px -45% 0px" }}>
            <div className='mb-5 flex items-baseline gap-3'>
              <span className='font-teko text-3xl tabular-nums leading-none text-zinc-500'>
                {pad(idx + 1)}
              </span>
              <h4 className='text-lg font-bold text-white'>{phase.title}</h4>
              <span className='ml-auto shrink-0 text-xs tabular-nums text-zinc-500'>
                {phase.steps.length} steps
              </span>
            </div>
            <motion.ol
              className='space-y-3'
              variants={stagger(0.05)}
              initial={still ? false : "hidden"}
              whileInView='visible'
              viewport={{ once: true, amount: 0.2 }}>
              {phase.steps.map((step) => (
                <motion.li
                  key={step.title}
                  variants={fadeUp}
                  className='flex flex-wrap items-baseline gap-x-4 gap-y-1'>
                  <span className='text-sm text-zinc-200'>{step.title}</span>
                  <span className='flex items-center gap-3 text-xs text-zinc-500'>
                    {step.song && (
                      <span className='inline-flex items-center gap-1.5 text-amber-300/90'>
                        <Music className='h-3 w-3' aria-hidden='true' />
                        {step.song}
                      </span>
                    )}
                    {step.exercise && (
                      <Dumbbell
                        className='h-3 w-3'
                        aria-label='Comes with an exercise'
                      />
                    )}
                    {step.lessons && (
                      <span
                        className='inline-flex items-center gap-1 tabular-nums'
                        aria-label={`${step.lessons} video lessons`}>
                        <FaYoutube className='h-3 w-3' aria-hidden='true' />
                        {step.lessons}
                      </span>
                    )}
                  </span>
                </motion.li>
              ))}
            </motion.ol>
          </motion.section>
        ))}
      </div>
    </div>
  );
};
