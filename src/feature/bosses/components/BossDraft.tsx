import { cn } from "assets/lib/utils";
import { AnimatePresence, m } from "framer-motion";
import type { Translate } from "lib/i18n/translate";
import { fade, fadeUp, stagger } from "lib/motion/motion";
import { Shuffle } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useBossText } from "../hooks/useBossText";
import { useBossFightStore } from "../store/bossFightStore";
import type { BossDefinition } from "../types/boss.types";
import { boonPreview } from "../utils/boonPreview";
import type { BoonRarity } from "../utils/boons";
import { BOON, boonDef, buildOf, counteredThreat, stacksOf, synergiesWith } from "../utils/boons";
import type { BossFightState } from "../utils/bossEngine";
import { momentumStreakFor, multiplierStreakFor, phaseNumber } from "../utils/bossEngine";
import { threatsOf } from "../utils/phaseChanges";
import { BoonIcon, RARITY_TEXT } from "./BoonIcon";
import { PhaseBriefing } from "./PhaseBriefing";

/** Every number a card's text may quote, as percentages where it reads better. */
const BOON_VARS = {
  ...BOON,
  armorPercent: Math.round(BOON.armorCut * 100),
  bladePercent: Math.round(BOON.bladeBonus * 100),
  lightBladePercent: Math.round(BOON.lightBladeCut * 100),
  thornsPercent: Math.round(BOON.thornsShare * 100),
  overdrivePercent: Math.round((BOON.overdriveDamage - 1) * 100),
};

/** The same, with the streaks of the boss being fought — changes count slower than notes. */
const boonVars = (fight: BossFightState) => ({
  ...BOON_VARS,
  momentumStreak: momentumStreakFor(fight.plan),
  maxStreak: multiplierStreakFor(fight.plan),
});

/** A rare card glows faintly of its rarity — tinted, not outlined. */
const RARITY_CARD: Record<BoonRarity, string> = {
  common: "bg-zinc-900 hover:bg-zinc-800",
  rare: "bg-purple-950/50 hover:bg-purple-950/80",
  epic: "bg-amber-950/40 hover:bg-amber-950/70",
};

/** HP and the build so far — what a card is weighed against. */
const PlayerStatus = ({ fight, t }: { fight: BossFightState; t: Translate }) => {
  const build = buildOf(fight.boons);
  return (
    <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-sm'>
      <span className='tabular-nums'>
        <span className='text-zinc-400'>{t("arena.your_hp")} </span>
        <span className='font-medium text-emerald-400'>
          {fight.playerHp} / {fight.playerMaxHp}
        </span>
      </span>
      {build.length > 0 && (
        <ul className='flex flex-wrap items-center gap-2' aria-label={t("result.build")}>
          {build.map(({ id, stacks }) => {
            const name = t(`boons.${id}.name`);
            const label = stacks > 1 ? `${name} ×${stacks}` : name;
            return (
              <li key={id} className='flex items-center gap-0.5' title={label} aria-label={label}>
                <BoonIcon id={id} className='h-5 w-5' />
                {stacks > 1 && (
                  <span className='font-teko text-base leading-none tabular-nums text-zinc-300'>
                    {stacks}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

/**
 * The draft between two phases: what the next phase changes, the player's
 * HP and build to weigh it against, and three boons dealt at random — one to
 * take, by click or by the key on its card, with a reroll while the run has
 * one. The session stays held until a card is taken.
 */
export const BossDraft = ({ boss }: { boss: BossDefinition }) => {
  const { t } = useBossText(boss);
  // The fight only while the draft is up — no re-render on every note.
  const fight = useBossFightStore((s) => (s.draftOpen && s.fight.draft ? s.fight : null));
  const pick = useBossFightStore((s) => s.pickBoon);
  const reroll = useBossFightStore((s) => s.rerollDraft);
  const draft = fight?.draft ?? null;

  // The cards are numbered: a player with both hands on the guitar can take
  // one with a key.
  useEffect(() => {
    if (!draft) return undefined;
    const onKey = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && draft[index]) {
        event.preventDefault();
        pick(draft[index]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, pick]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {fight && draft && (
        <m.div
          key='boss-draft'
          variants={fade}
          initial='hidden'
          animate='visible'
          exit='hidden'
          className='fixed inset-0 z-[999999990] overflow-y-auto bg-zinc-950/95 backdrop-blur-sm'
          role='dialog'
          aria-modal='true'
          aria-labelledby='boss-draft-title'>
          {/* Centred while it fits, scrolled from the top when it doesn't. */}
          <div className='flex min-h-full items-center justify-center px-4 py-10'>
            <div className='w-full max-w-3xl space-y-8'>
              <header className='flex flex-wrap items-start justify-between gap-4'>
                <div className='space-y-2'>
                  <p className='text-sm text-zinc-400'>
                    {t("draft.eyebrow", { phase: phaseNumber(fight) })}
                  </p>
                  <h2
                    id='boss-draft-title'
                    className='font-display text-2xl font-semibold text-zinc-100'>
                    {t("draft.title")}
                  </h2>
                  <PlayerStatus fight={fight} t={t} />
                </div>
                <button
                  type='button'
                  onClick={reroll}
                  disabled={fight.rerollsLeft <= 0}
                  className='inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-900 px-3 text-sm text-zinc-200 transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40'>
                  <Shuffle className='h-4 w-4 text-zinc-400' aria-hidden />
                  {t("draft.reroll", { count: fight.rerollsLeft })}
                </button>
              </header>

              <PhaseBriefing fight={fight} t={t} />

              <m.ul
                key={draft.join()}
                variants={stagger(0.06)}
                initial='hidden'
                animate='visible'
                className='grid gap-3 sm:grid-cols-3'>
                {draft.map((id, i) => {
                  const def = boonDef(id);
                  const owned = stacksOf(fight.boons, id);
                  const preview = boonPreview(fight, id);
                  const countersNow = counteredThreat(id, threatsOf(fight.plan));
                  const pairs = synergiesWith(id, fight.boons);
                  return (
                    <m.li key={id} variants={fadeUp}>
                      <button
                        type='button'
                        onClick={() => pick(id)}
                        className={cn(
                          "flex h-full w-full flex-col gap-4 rounded-lg p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          RARITY_CARD[def.rarity],
                        )}>
                        <span className='flex items-start justify-between gap-3'>
                          <BoonIcon id={id} className='h-12 w-12' />
                          <kbd className='hidden rounded bg-zinc-950/60 px-2 py-0.5 font-sans text-xs tabular-nums text-zinc-400 sm:inline-block'>
                            {i + 1}
                          </kbd>
                        </span>
                        <span className='space-y-1'>
                          <span className={cn("block text-xs font-medium", RARITY_TEXT[def.rarity])}>
                            {t(`rarity.${def.rarity}`)}
                          </span>
                          <span className='block font-display text-lg font-semibold text-zinc-100'>
                            {t(`boons.${id}.name`)}
                          </span>
                        </span>
                        {preview && (
                          <span className='block text-base font-semibold tabular-nums text-zinc-100'>
                            {t(`preview.${id}`, { from: preview.from, to: preview.to })}
                          </span>
                        )}
                        <span className='flex-1 text-sm leading-relaxed text-zinc-300'>
                          {t(`boons.${id}.body`, boonVars(fight))}
                        </span>
                        {(countersNow || pairs.length > 0) && (
                          <span className='space-y-1 text-xs font-medium'>
                            {countersNow && (
                              <span className='block text-emerald-400'>
                                {t("draft.counters", { threat: t(`threats.${countersNow}`) })}
                              </span>
                            )}
                            {pairs.length > 0 && (
                              <span className='block text-zinc-300'>
                                {t("draft.pairs", {
                                  list: pairs.map((other) => t(`boons.${other}.name`)).join(", "),
                                })}
                              </span>
                            )}
                          </span>
                        )}
                        {owned > 0 && (
                          <span className='text-xs tabular-nums text-zinc-500'>
                            {t("draft.owned", { count: owned })}
                          </span>
                        )}
                      </button>
                    </m.li>
                  );
                })}
              </m.ul>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
