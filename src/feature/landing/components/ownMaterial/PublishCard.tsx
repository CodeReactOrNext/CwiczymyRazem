import { cn } from "assets/lib/utils";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { fadeUp, stagger, transitions } from "lib/motion/motion";
import { useRef } from "react";

/** The publish form's own defaults (pages/tab-editor/publish.tsx), plus a title. */
const FIELDS = [
  { label: "Title", value: "String skipping in G" },
  { label: "Category", value: "Technique" },
  { label: "Difficulty", value: "Medium" },
  { label: "Tempo", value: "60–120 BPM, 80 recommended" },
  { label: "Length", value: "5 minutes" },
];

/**
 * The step between a tab and an exercise, as a card that fills itself in: the
 * fields the publish form asks for land one after another, then the
 * visibility switch flips to public. The values are the form's defaults.
 */
export const PublishCard = () => {
  const still = !!useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const switchOn = still || inView;
  // The switch flips after the fields have landed, colour and knob together.
  const flipDelay = still ? undefined : { transitionDelay: "1.1s" };

  return (
    <div ref={ref} aria-hidden className='rounded-lg bg-zinc-900/40 p-6 sm:p-8'>
      <p className='text-xs text-zinc-500'>Publish exercise</p>
      <motion.dl
        className='mt-5 space-y-4'
        variants={stagger(0.14)}
        initial={still ? false : "hidden"}
        animate={inView ? "visible" : "hidden"}>
        {FIELDS.map((field) => (
          <motion.div
            key={field.label}
            variants={fadeUp}
            className='flex items-baseline justify-between gap-6'>
            <dt className='text-sm text-zinc-500'>{field.label}</dt>
            <dd className='text-right text-sm font-semibold text-zinc-100'>
              {field.value}
            </dd>
          </motion.div>
        ))}
        <motion.div
          variants={fadeUp}
          className='flex items-center justify-between gap-6'>
          <dt className='text-sm text-zinc-500'>Visible to</dt>
          <dd className='flex items-center gap-3 text-sm font-semibold text-zinc-100'>
            <span
              className={cn(
                "transition-colors duration-slow",
                switchOn ? "text-zinc-100" : "text-zinc-500",
              )}
              style={flipDelay}>
              {switchOn ? "Every player" : "Only you"}
            </span>
            <span
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors duration-slow",
                switchOn ? "bg-emerald-500/80" : "bg-zinc-700",
              )}
              style={flipDelay}>
              <motion.span
                className='absolute top-0.5 h-4 w-4 rounded-full bg-white'
                initial={false}
                animate={{ left: switchOn ? 18 : 2 }}
                transition={{ ...transitions.spring, delay: still ? 0 : 1.1 }}
              />
            </span>
          </dd>
        </motion.div>
      </motion.dl>
    </div>
  );
};
