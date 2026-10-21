import { Button } from "assets/components/ui/button";
import { useBossFightControls } from "feature/exercisePlan/views/PracticeSession/contexts/BossFightControlsContext";
import { AnimatePresence, m } from "framer-motion";
import { fade, popIn } from "lib/motion/motion";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useBossText } from "../hooks/useBossText";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition } from "../types/boss.types";
import { buildOf } from "../utils/boons";
import { artPhaseFor, legPatternFor, moodFor } from "../utils/bossArt";
import { fightAccuracy, phaseNumber, runLog } from "../utils/bossEngine";
import { BoonIcon } from "./BoonIcon";
import { BossArt } from "./BossArt";
import { RunChart } from "./RunChart";

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div className='space-y-1'>
    <p className='font-teko text-3xl leading-none tabular-nums text-zinc-100'>{value}</p>
    <p className='text-xs text-zinc-400'>{label}</p>
  </div>
);

/** Waits a beat after the last note so the bite that ended it is seen. */
const REVEAL_DELAY_MS = 900;

/**
 * The end of a run: the boss gloating over the player, how far they got,
 * whether it beat their record, and the way on. Shown over the session, which
 * has already stopped the clock.
 */
export const BossResultOverlay = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);
  const { restart, finish, isFinishing } = useBossFightControls();
  const fight = useBossFightStore((s) => s.fight);
  const newRecord = useBossFightStore((s) => s.newRecord);
  const recordBefore = useBossFightStore((s) => s.recordBefore);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!fight.outcome) return undefined;
    const timer = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      setRevealed(false);
    };
  }, [fight.outcome]);

  if (typeof document === "undefined") return null;
  const phase = phaseNumber(fight);
  const build = buildOf(fight.boons);
  // Against the record the run set out to beat; nothing to compare on a first run.
  const gap = recordBefore && recordBefore.runs > 0 ? phase - recordBefore.bestPhase : null;
  const versusRecord =
    gap === null
      ? null
      : gap > 0
        ? t("result.ahead", { count: gap })
        : gap < 0
          ? t("result.behind", { count: -gap })
          : t("result.level_with");

  return createPortal(
    <AnimatePresence>
      {fight.outcome && revealed && (
        <m.div
          key='boss-result'
          variants={fade}
          initial='hidden'
          animate='visible'
          exit='hidden'
          className='fixed inset-0 z-[999999999] overflow-y-auto bg-zinc-950/90 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='boss-result-title'>
          {/* Centred while it fits, scrolled from the top when it doesn't. */}
          <div className='flex min-h-full items-center justify-center p-4'>
          <m.div
            variants={popIn}
            className='w-full max-w-lg space-y-6 rounded-lg bg-zinc-900 px-6 py-8 text-center sm:px-8'>
            <BossArt
              boss={boss}
              className='mx-auto h-40 w-52'
              mood={moodFor(fight)}
              form={artPhaseFor(fight)}
              pattern={legPatternFor(fight.plan)}
              webTorn={1 - fight.bossHp / fight.bossMaxHp}
            />

            <div className='space-y-2'>
              <h2
                id='boss-result-title'
                className='font-display text-2xl font-semibold text-zinc-100'>
                {t("result.title")}
              </h2>
              <p className='text-sm text-zinc-400'>{t("result.body", { phase })}</p>
              {newRecord && (
                <p className='text-sm font-medium text-amber-400'>{t("result.new_record")}</p>
              )}
              {versusRecord && <p className='text-sm tabular-nums text-zinc-400'>{versusRecord}</p>}
            </div>

            <div className='grid grid-cols-2 gap-x-4 gap-y-5'>
              <Stat label={t("result.phase")} value={phase} />
              <Stat label={t("result.damage")} value={fight.totalDamage.toLocaleString()} />
              <Stat label={t("result.best_streak")} value={fight.maxCombo} />
              <Stat label={t("result.accuracy")} value={`${fightAccuracy(fight)}%`} />
            </div>

            <RunChart log={runLog(fight)} t={t} />

            {build.length > 0 && (
              <div className='space-y-2'>
                <p className='text-xs text-zinc-500'>{t("result.build")}</p>
                <ul className='flex flex-wrap justify-center gap-x-4 gap-y-2'>
                  {build.map(({ id, stacks }) => (
                    <li key={id} className='flex items-center gap-1.5 text-sm text-zinc-300'>
                      <BoonIcon id={id} className='h-5 w-5' />
                      {t(`boons.${id}.name`)}
                      {stacks > 1 && <span className='tabular-nums text-zinc-500'>×{stacks}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className='flex flex-col gap-2'>
              <Button
                onClick={restart}
                className='h-10 bg-white text-zinc-950 shadow-none hover:bg-zinc-200'>
                {t("result.retry")}
              </Button>
              <Button
                onClick={finish}
                loading={isFinishing}
                variant='ghost'
                className='h-10 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'>
                {t("result.finish")}
              </Button>
            </div>
          </m.div>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
