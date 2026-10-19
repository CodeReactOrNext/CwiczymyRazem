import { AnimatePresence, m } from "framer-motion";
import { fade } from "lib/motion/motion";

import { useBossText } from "../hooks/useBossText";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition } from "../types/boss.types";
import { isWebbed } from "../utils/bossEngine";
import { SpiderWeb } from "./SpiderWeb";

/**
 * The web the spider spits over the tab: the notes vanish under silk for a
 * few seconds and the player keeps going from memory. Laid over the tab by
 * the session (TabOverlayContext); the notes underneath are still judged.
 */
export const BossWebOverlay = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);
  const webbed = useBossFightStore((s) => isWebbed(s.fight) && !s.fight.outcome && !s.fight.holding);

  return (
    <AnimatePresence>
      {webbed && (
        <m.div
          key='boss-web'
          variants={fade}
          initial='hidden'
          animate='visible'
          exit='hidden'
          className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-lg bg-zinc-950/90'
          aria-live='polite'>
          <svg
            viewBox='0 0 480 380'
            preserveAspectRatio='xMidYMid slice'
            className='absolute inset-0 h-full w-full'
            aria-hidden>
            <SpiderWeb torn={0} stroke='#71717a' />
          </svg>
          <span className='relative rounded-lg bg-zinc-950/80 px-4 py-2 text-sm font-medium text-zinc-200'>
            {t("arena.webbed")}
          </span>
        </m.div>
      )}
    </AnimatePresence>
  );
};
