import { cn } from "assets/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import type { Translate } from "lib/i18n/translate";
import { useEffect, useState } from "react";

import { useBossFightStore } from "../store/bossFightStore";
import type { ChangeCombo, ComboResult } from "../utils/bossEngine";
import { comboMultiplier } from "../utils/bossEngine";

/** How long a combo's ending — paid out or lost — stays up. */
const ENDING_MS = 1600;
/** Tricks the chain shows, newest last; the older ones fold into "…". */
const SHOWN_TRICKS = 4;
/** A game's combo: louder than the app's own motion on purpose — it overshoots and settles. */
const POP = { type: "spring", stiffness: 520, damping: 17, mass: 0.7 } as const;

export interface ComboEnding {
  id: number;
  banked: boolean;
  combo: ComboResult;
}

/** The combo's last ending, held up for a moment — fed from the store's own subscription, so none is missed. */
export const useComboEnding = () => {
  const [ending, setEnding] = useState<ComboEnding | null>(null);
  useEffect(() => {
    let id = 0;
    let timer = 0;
    const unsubscribe = useBossFightStore.subscribe(
      ({ fight }, { fight: before }) => {
        if (fight.runSeed !== before.runSeed) {
          setEnding(null);
          return;
        }
        const banked = fight.bankTick > before.bankTick;
        if ((!banked && fight.bailTick <= before.bailTick) || !fight.lastCombo)
          return;
        const shown = ++id;
        setEnding({ id: shown, banked, combo: fight.lastCombo });
        window.clearTimeout(timer);
        timer = window.setTimeout(
          () =>
            setEnding((current) => (current?.id === shown ? null : current)),
          ENDING_MS,
        );
      },
    );
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);
  return ending;
};

interface ComboHudProps {
  /** From useComboEnding — the board holds it, to clear the space under the HUD while it is up. */
  ending: ComboEnding | null;
  t: Translate;
  className?: string;
}

interface ComboViewProps extends ComboHudProps {
  combo: ChangeCombo | null;
  /** Changes when one combo ends and the next begins, so the next one pops in fresh. */
  comboKey: string;
}

/**
 * The changeling's combo, played like a skate game's: the tricks strung so
 * far, each one popping in as it lands, and what they are worth × the
 * multiplier; then the payout, big and gold, or the combo crossed out when a
 * miss loses it.
 */
export const ComboView = ({ combo, comboKey, ending, t, className }: ComboViewProps) => {
  const hidden = combo ? Math.max(0, combo.tricks.length - SHOWN_TRICKS) : 0;
  const multiplier = combo ? comboMultiplier(combo) : 0;

  return (
    <div
      className={cn("pointer-events-none flex items-center", className)}
      aria-live='polite'>
      <AnimatePresence mode='popLayout' initial={false}>
        {combo ? (
          <m.div
            key={`live-${comboKey}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={POP}
            className='flex -skew-x-6 items-baseline gap-4 whitespace-nowrap'>
            <ol className='flex items-baseline gap-2 whitespace-nowrap font-teko text-2xl leading-none text-zinc-100'>
              {hidden > 0 && <li className='text-zinc-500'>…</li>}
              {combo.tricks.slice(hidden).map((trick, i) => (
                <m.li
                  key={hidden + i}
                  initial={{ opacity: 0, scale: 2, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={POP}
                  className='flex items-baseline gap-2'>
                  {(i > 0 || hidden > 0) && (
                    <span className='text-zinc-500'>+</span>
                  )}
                  <span
                    className={
                      trick === "smooth" ? "text-amber-200" : "text-zinc-50"
                    }>
                    {t(`combo.${trick}`)}
                  </span>
                </m.li>
              ))}
            </ol>
            <p className='flex items-baseline gap-2 font-teko text-4xl tabular-nums leading-none'>
              <m.span
                key={combo.points}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={POP}
                className='text-zinc-50'>
                {combo.points}
              </m.span>
              <m.span
                key={multiplier}
                initial={{ scale: 1.8 }}
                animate={{ scale: 1 }}
                transition={POP}
                className='text-amber-300'>
                ×{multiplier}
              </m.span>
            </p>
          </m.div>
        ) : ending?.banked ? (
          <m.div
            key={`bank-${ending.id}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
            transition={{ ...POP, damping: 12 }}
            className='flex -skew-x-6 items-baseline gap-3 whitespace-nowrap'>
            <p className='font-teko text-6xl tabular-nums leading-none text-amber-300'>
              +{ending.combo.value}
            </p>
            <p className='text-sm font-semibold text-zinc-200'>
              {t("combo.banked", { multiplier: ending.combo.multiplier })}
            </p>
          </m.div>
        ) : ending ? (
          <m.div
            key={`bail-${ending.id}`}
            initial={{ opacity: 1, x: 0 }}
            animate={{ x: [0, -12, 10, -6, 3, 0] }}
            exit={{ opacity: 0, transition: { duration: 0.25 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className='flex -skew-x-6 items-baseline gap-3 whitespace-nowrap'>
            <p className='font-teko text-4xl tabular-nums leading-none text-orange-400 line-through decoration-4'>
              {ending.combo.points} ×{ending.combo.multiplier}
            </p>
            <p className='text-sm font-semibold text-orange-300'>
              {t("combo.lost")}
            </p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

/** The fight's combo on the board — see ComboView. */
export const ComboHud = ({ ending, t, className }: ComboHudProps) => {
  const combo = useBossFightStore((s) => s.fight.changeCombo);
  // A combo dropped at a phase break ends without a payout or a miss: the next one is still a new one.
  const comboKey = useBossFightStore(
    (s) => `${s.fight.bankTick}-${s.fight.bailTick}-${s.fight.phaseTick}`,
  );
  return <ComboView combo={combo} comboKey={comboKey} ending={ending} t={t} className={className} />;
};
