import { motion, useScroll } from "framer-motion";
import { transitions } from "lib/motion/motion";
import { useRef } from "react";

/** zinc-600 / white: a stage the reader has not reached yet, and one they have. */
const IDLE = "#52525b";
const LIT = "#ffffff";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The job's stages down a line that fills as the reader scrolls through
 * them. A stage lights up once it reaches the lower third of the screen and
 * stays lit, so scrolling back up never "unwrites" anything. Only colour and
 * opacity change per stage, which reduced motion leaves alone; the fill is a
 * scale on one line.
 */
export const RoadmapPipeline = ({
  stages,
}: {
  stages: readonly { title: string; text: string }[];
}) => {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 75%", "end 60%"],
  });

  return (
    <ol ref={ref} className='relative space-y-12 pl-14 sm:pl-16'>
      <span
        aria-hidden
        className='absolute bottom-3 left-[15px] top-3 w-px bg-zinc-800'
      />
      <motion.span
        aria-hidden
        style={{ scaleY: scrollYProgress }}
        className='absolute bottom-3 left-[15px] top-3 w-px origin-top bg-zinc-300'
      />
      {stages.map((stage, idx) => (
        <motion.li
          key={stage.title}
          className='relative max-w-2xl'
          initial='idle'
          whileInView='lit'
          viewport={{ once: true, margin: "0px 0px -35% 0px" }}>
          <motion.span
            aria-hidden
            variants={{ idle: { color: IDLE }, lit: { color: LIT } }}
            transition={transitions.slow}
            className='absolute -left-14 top-0 w-8 bg-zinc-950 py-1 text-center font-teko text-3xl leading-none sm:-left-16'>
            {pad(idx + 1)}
          </motion.span>
          <motion.div
            variants={{ idle: { opacity: 0.4 }, lit: { opacity: 1 } }}
            transition={transitions.slow}>
            <h3 className='mb-2 text-lg font-bold text-white'>{stage.title}</h3>
            <p className='leading-relaxed text-zinc-400'>{stage.text}</p>
          </motion.div>
        </motion.li>
      ))}
    </ol>
  );
};
