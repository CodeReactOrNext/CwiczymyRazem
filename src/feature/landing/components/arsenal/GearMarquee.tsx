import type { ArsenalGear } from "feature/landing/lib/arsenalProps";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

import { RARITY_COLOR } from "./rarity";

/** Seconds for one row to slide past its own length. Slow on purpose. */
const LOOP_SECONDS = 60;

const Row = ({
  gear,
  reverse,
  still,
}: {
  gear: ArsenalGear[];
  reverse?: boolean;
  still: boolean;
}) => (
  <div className='overflow-hidden'>
    <motion.ul
      className='flex w-max gap-10 py-3'
      initial={false}
      animate={
        still ? { x: 0 } : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }
      }
      transition={
        still
          ? undefined
          : { duration: LOOP_SECONDS, ease: "linear", repeat: Infinity }
      }>
      {/* Twice over, so the row can slide by half and land where it began. */}
      {[...gear, ...gear].map((item, idx) => (
        <li key={`${item.name}-${idx}`} className='flex w-56 flex-col gap-3'>
          <Image
            src={item.image}
            alt=''
            width={900}
            height={382}
            draggable={false}
            className='h-24 w-full select-none object-contain'
          />
          <span className='flex items-center gap-2 text-xs'>
            <span
              className='h-1.5 w-1.5 shrink-0 rounded-full'
              style={{ background: RARITY_COLOR[item.rarity] }}
            />
            <span className='truncate text-zinc-300'>{item.name}</span>
            <span className='shrink-0 text-zinc-600'>{item.rarity}</span>
          </span>
        </li>
      ))}
    </motion.ul>
  </div>
);

/**
 * Two rows of real guitars from the catalogue drifting past in opposite
 * directions, a dot of rarity colour under each. Decorative: the numbers
 * beside it say what is in the game.
 */
export const GearMarquee = ({ gear }: { gear: ArsenalGear[] }) => {
  const still = !!useReducedMotion();
  const half = Math.ceil(gear.length / 2);
  return (
    <div
      aria-hidden
      className='[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]'>
      <Row gear={gear.slice(0, half)} still={still} />
      <Row gear={gear.slice(half)} reverse still={still} />
    </div>
  );
};
