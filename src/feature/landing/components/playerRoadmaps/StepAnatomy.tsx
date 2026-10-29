import type { RoadmapStepExample } from "feature/landing/data/playerRoadmapExamples";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, stagger } from "lib/motion/motion";
import { Dumbbell, Music } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";

const minutes = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/**
 * One real step, written out the way the step drawer shows it, assembling
 * itself part by part as it scrolls in: what, why, how, the finish line,
 * then the exercise and the lessons. No panels inside the panel — the parts
 * are told apart by spacing alone.
 */
export const StepAnatomy = ({
  step,
  stepCount,
  exerciseTitle,
}: {
  step: RoadmapStepExample;
  /** Steps in the step's phase, for the "step 3 of 7" line. */
  stepCount: number;
  exerciseTitle: string;
}) => {
  const still = !!useReducedMotion();

  return (
    <motion.article
      className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'
      variants={stagger(0.12)}
      initial={still ? false : "hidden"}
      whileInView='visible'
      viewport={{ once: true, amount: 0.2 }}>
      <motion.p variants={fadeUp} className='text-xs text-zinc-500'>
        Phase {step.phaseIndex + 1} · {step.phaseTitle} · step{" "}
        {step.stepIndex + 1} of {stepCount}
      </motion.p>
      <motion.h3
        variants={fadeUp}
        className='mt-2 text-2xl font-bold text-white'>
        {step.title}
      </motion.h3>

      <div className='mt-6 space-y-5'>
        {step.sections.map((section) => (
          <motion.div key={section.heading} variants={fadeUp}>
            <p className='text-sm font-semibold text-zinc-200'>
              {section.heading}
            </p>
            <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
              {section.body}
            </p>
          </motion.div>
        ))}
        <motion.div variants={fadeUp}>
          <p className='text-sm font-semibold text-emerald-400'>Done when</p>
          <p className='mt-1 text-sm leading-relaxed text-zinc-400'>
            {step.successCriteria}
          </p>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className='mt-8 space-y-3'>
        <p className='text-xs text-zinc-500'>Practice kit</p>
        {step.song && (
          <p className='flex items-center gap-3 text-sm font-semibold text-zinc-100'>
            <Music className='h-4 w-4 shrink-0 text-amber-400' aria-hidden />
            {step.song.title}
            <span className='font-normal text-zinc-500'>
              {step.song.artist} · song library
            </span>
          </p>
        )}
        <p className='flex items-center gap-3 text-sm font-semibold text-zinc-100'>
          <Dumbbell className='h-4 w-4 shrink-0 text-zinc-400' aria-hidden />
          {exerciseTitle}
          <span className='font-normal text-zinc-500'>exercise</span>
        </p>
      </motion.div>

      <motion.div variants={fadeUp} className='mt-6'>
        <p className='text-xs text-zinc-500'>Lessons</p>
        <ul className='mt-3 space-y-3'>
          {step.lessons.map((lesson) => (
            <li key={lesson.title} className='flex items-start gap-3'>
              <FaYoutube
                className='mt-0.5 h-4 w-4 shrink-0 text-zinc-400'
                aria-hidden
              />
              <span className='min-w-0'>
                <span className='block text-sm text-zinc-100'>
                  {lesson.title}
                </span>
                <span className='text-xs tabular-nums text-zinc-500'>
                  {lesson.channelName}
                  {lesson.duration > 0 && ` · ${minutes(lesson.duration)}`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.article>
  );
};
