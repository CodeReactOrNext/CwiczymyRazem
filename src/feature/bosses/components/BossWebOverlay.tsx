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
 * The colossus does the same in stone — the tab turns to rock and only the
 * progression's chord names are left to play from.
 */
export const BossWebOverlay = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);
  const webbed = useBossFightStore((s) => isWebbed(s.fight) && !s.fight.outcome && !s.fight.holding);
  const progression = useBossFightStore((s) =>
    s.fight.plan.kind === "chords" ? s.fight.plan.variation.progression : null,
  );

  if (progression) {
    return (
      <AnimatePresence>
        {webbed && (
          <m.div
            key='boss-petrify'
            variants={fade}
            initial='hidden'
            animate='visible'
            exit='hidden'
            className='pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 overflow-hidden rounded-lg bg-zinc-800/95 px-4'
            aria-live='polite'>
            <svg
              viewBox='0 0 480 380'
              preserveAspectRatio='xMidYMid slice'
              className='absolute inset-0 h-full w-full'
              aria-hidden>
              <path
                d='M0 120 L90 140 L150 110 L240 150 L330 118 L400 146 L480 128 M0 260 L70 236 L160 270 L250 240 L320 276 L420 248 L480 262 M150 110 L170 190 L160 270 M330 118 L310 200 L320 276'
                stroke='#52525b'
                strokeWidth={3}
                strokeLinejoin='round'
                fill='none'
              />
            </svg>
            <span className='relative font-display text-2xl font-semibold tabular-nums text-zinc-100'>
              {progression.join(" → ")}
            </span>
            <span className='relative text-sm font-medium text-zinc-300'>{t("arena.webbed")}</span>
          </m.div>
        )}
      </AnimatePresence>
    );
  }

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
