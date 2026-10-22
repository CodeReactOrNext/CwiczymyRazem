import { AnimatePresence, m } from "framer-motion";
import { fade, popIn } from "lib/motion/motion";
import { createPortal } from "react-dom";

import { useBossText } from "../hooks/useBossText";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition } from "../types/boss.types";
import { artPhaseFor, legPatternFor } from "../utils/bossArt";
import { phaseBpm, phaseNumber } from "../utils/bossEngine";
import { describePhaseShift } from "../utils/phaseChanges";
import { BossArt } from "./BossArt";
import { speedHeadline } from "./PhaseBriefing";
import { ThreatIcon } from "./ThreatIcon";

/**
 * The phase card the break opens on: the boss changing form large, the
 * phase's number, how much faster the notes come and what new threat it
 * brings — before the draft is dealt over it.
 */
export const BossPhaseIntro = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);
  // The fight only while the intro is up — no re-render on every note.
  const fight = useBossFightStore((s) =>
    s.fight.holding && s.fight.draft !== null && !s.draftOpen ? s.fight : null,
  );

  if (typeof document === "undefined") return null;
  const changes =
    fight?.previousPlan &&
    describePhaseShift(fight.previousPlan, fight.plan, fight.previousBpm, phaseBpm(fight));

  return createPortal(
    <AnimatePresence>
      {fight && (
        <m.div
          key={`phase-intro-${fight.phaseTick}`}
          variants={fade}
          initial='hidden'
          animate='visible'
          exit='hidden'
          className='fixed inset-0 z-[999999985] flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-sm'
          role='status'>
          <m.div variants={popIn} className='flex flex-col items-center gap-6 text-center'>
            <BossArt
              boss={boss}
              className='h-48 w-60 sm:h-56 sm:w-72'
              form={artPhaseFor(fight)}
              pattern={legPatternFor(fight.plan)}
              molting
            />
            <div className='space-y-2'>
              <p className='font-display text-5xl font-semibold text-zinc-100'>
                {t("arena.phase", { phase: phaseNumber(fight) })}
              </p>
              {changes && <p className='text-lg text-zinc-300'>{speedHeadline(changes.speedChange, t)}</p>}
              <p className='text-sm tabular-nums text-zinc-500'>{phaseBpm(fight)} BPM</p>
            </div>
            {changes && changes.gained.length > 0 && (
              <ul className='flex flex-wrap justify-center gap-x-5 gap-y-2'>
                {changes.gained.map((id) => (
                  <li key={id} className='flex items-center gap-2 text-sm font-medium text-orange-400'>
                    <ThreatIcon id={id} boss={boss.id} className='h-6 w-6' />
                    {t("briefing.gained", { list: t(`threats.${id}`) })}
                  </li>
                ))}
              </ul>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
