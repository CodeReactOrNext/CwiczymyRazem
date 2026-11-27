"use client";

import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FreeCaseIcon } from "components/Rewards/FreeCaseIcon";
import { ExtractorArt } from "feature/arsenal/components/Traits/TraitItemArt";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { getEffectValue } from "feature/arsenal/data/effectStats";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { getConditionGrade, getItemCondition, getItemValue } from "feature/arsenal/data/itemStats";
import { getItemTraits } from "feature/arsenal/data/traits";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useEquipGuitar } from "feature/arsenal/hooks/useEquipGuitar";
import { useMergeScene } from "feature/arsenal/hooks/useMergeScene";
import { useSellEffect } from "feature/arsenal/hooks/useSellEffect";
import { useSellGuitar } from "feature/arsenal/hooks/useSellGuitar";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { isAtLeast } from "feature/arsenal/utils/pity";
import { ComponentThumb } from "feature/guitarBuilder/components/ComponentThumb";
import { SLOT_LABELS } from "feature/guitarBuilder/data/components";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { readableText } from "lib/colorTheme/colorTheme";
import { EASE } from "lib/motion/motion";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { CaseDefinition, OpenCaseResult } from "../../types/arsenal.types";
import { getCaseArt } from "../CaseShop/CaseCard";
import { RARITY_STYLES } from "../RarityBadge";
import { CaseReel } from "./CaseReel";
import { buildRouletteStrip, REEL_WIN_INDEX, type StripItem } from "./reelMath";

/** What the pull is, as a reel item. */
const winItemOf = (result: OpenCaseResult | null): StripItem | null => {
  if (!result) return null;
  if (result.type === "guitar" && result.guitar) {
    const def = GUITARS_BY_ID.get(result.guitar.id);
    return def ? { kind: "guitar", def } : null;
  }
  if (result.type === "effect" && result.effect) {
    const def = EFFECTS_BY_ID.get(result.effect.id);
    return def ? { kind: "effect", def } : null;
  }
  if (result.type === "component" && result.component) {
    return { kind: "component", def: result.component };
  }
  return null;
};

const subscribeToNothing = () => () => {};

/** The big picture on the reward screen. */
const rewardImageOf = (item: StripItem | null): string | null =>
  item?.kind === "guitar"
    ? getRankBadgeSrc(item.def.imageId, "large")
    : item?.kind === "effect"
      ? getEffectImageSrc(item.def.imageId, "full")
      : null;

/** One line of the reward screen arriving, a beat after the one above it. */
const enter = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.38, ease: EASE.out },
});

/** How the same case can be opened once more, if at all. */
export type OpenAgainPayment =
  | { kind: "fame"; cost: number }
  | { kind: "token" }
  | null;

interface CaseOpeningModalProps {
  result: OpenCaseResult | null;
  caseDef?: CaseDefinition;
  onClose: () => void;
  /** Pays for and opens the same case again; the new result replaces this one. */
  onOpenAgain?: (useToken: boolean) => void;
  openAgainPayment?: OpenAgainPayment;
  isOpeningAgain?: boolean;
}

/**
 * A single case opening, in two screens.
 *
 * First the reel (`CaseReel`): the case rattles, bursts, and a drum of items
 * spins onto the pull. Then the reward, on a screen of its own: the pull large
 * in the middle, the one thing to do with it as the big key pinned at the
 * bottom (keep it, or merge it into the copy already owned), opening another
 * under that, and the item's own smaller actions (equip, sell) right under the
 * item. A player who asked for less motion goes straight to the reward.
 */
export const CaseOpeningModal = ({
  result,
  caseDef,
  onClose,
  onOpenAgain,
  openAgainPayment = null,
  isOpeningAgain = false,
}: CaseOpeningModalProps) => {
  // Which pull has finished its reel. Keyed by the result itself, so "Open
  // another" starts on the reel again without an effect resetting anything.
  const [revealedFor, setRevealedFor] = useState<OpenCaseResult | null>(null);
  const reduceMotion = useReducedMotion();
  const labels = useArsenalLabels();
  const { t } = labels;
  const { mutate: equip, isPending: isEquipping } = useEquipGuitar();
  const { mutate: sellGuitar, isPending: isSellingGuitar } = useSellGuitar();
  const { mutate: sellEffect, isPending: isSellingEffect } = useSellEffect();
  // The merge scene and the request behind it run together; the modal closes
  // only when both are finished.
  const merge = useMergeScene({ onFinished: onClose });
  const isMerging = merge.isActive;
  const isSelling = isSellingGuitar || isSellingEffect;
  const isBusy = isEquipping || isSelling || isMerging || isOpeningAgain;
  const router = useRouter();

  // False on the server and in the hydrating render, true after: the portal
  // needs `document`.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  const winItem = useMemo(() => winItemOf(result), [result]);
  // Built once per pull: a new strip mid-spin would swap every image on it.
  const strip = useMemo(
    () => (caseDef && winItem ? buildRouletteStrip(caseDef, winItem) : []),
    [caseDef, winItem],
  );
  const rewardImage = rewardImageOf(winItem);
  const isOpen = result !== null && winItem !== null;
  const showReward = isOpen && (reduceMotion || revealedFor === result);

  const guitar = winItem?.kind === "guitar" ? winItem.def : null;
  const component = winItem?.kind === "component" ? winItem.def : null;
  const rarity = winItem?.def.rarity ?? "Common";
  const color = RARITY_STYLES[rarity].baseColor;

  // The same functions /api/arsenal/sell-guitar and sell-effect pay out with:
  // a guitar is worth its own rolled condition and year, not a flat rarity
  // price, so the reveal and the Arsenal quote the same number.
  const sellValue =
    winItem?.kind === "guitar"
      ? result?.newItem
        ? getItemValue(result.newItem, winItem.def)
        : 0
      : winItem?.kind === "effect"
        ? getEffectValue(winItem.def)
        : 0;

  // A duplicate with a copy to go into can be folded into it for a few levels.
  const mergeOffer = result?.merge ?? null;
  const handleMerge = () => {
    if (!mergeOffer || isBusy || !winItem || winItem.kind === "component") return;
    const itemId = winItem.kind === "guitar" ? result?.newItem?.id : result?.effectItem?.id;
    if (!itemId) return;
    merge.start({ kind: winItem.kind, itemId, def: winItem.def, offer: mergeOffer });
  };

  const handleSell = () => {
    if (!winItem || isBusy) return;
    if (winItem.kind === "guitar" && result?.newItem?.id) {
      sellGuitar(result.newItem.id, { onSuccess: onClose });
    } else if (winItem.kind === "effect" && result?.effectItem?.id) {
      sellEffect(result.effectItem.id, { onSuccess: onClose });
    }
  };

  const openBuilder = () => {
    onClose();
    router.replace({ query: { ...router.query, tab: "builder" } }, undefined, { shallow: true });
  };

  // Escape leaves the reward screen as the big key would: the pull is already
  // saved, so closing keeps it.
  useEffect(() => {
    if (!showReward) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showReward, isBusy, onClose]);

  const keepLabel =
    winItem?.kind === "guitar" ? t("opening.keep_in_arsenal") : t("opening.add_to_collection");

  // One line under the name: what the thing is, and the roll that sets it apart.
  const meta = (() => {
    if (!winItem) return "";
    if (winItem.kind === "component") {
      return [
        t(`builder.slots.${winItem.def.slot}`, SLOT_LABELS[winItem.def.slot]),
        result?.componentItem ? t("common.lvl", { level: result.componentItem.level }) : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    if (winItem.kind === "effect") return labels.effectType(winItem.def.type);
    const item = result?.newItem;
    return [
      winItem.def.brand,
      item?.year,
      item ? labels.condition(getConditionGrade(getItemCondition(item))) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  })();

  const traits = getItemTraits(result?.newItem ?? result?.effectItem)
    .map((trait) => labels.traitLabel(trait))
    .join(" · ");

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {result && winItem && strip.length > 0 && (
            <motion.div
              // force-dark: the opening is a show on a black stage, in either theme.
              className='force-dark fixed inset-0 z-[1000] bg-black'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}>
              <AnimatePresence mode='wait'>
                {!showReward ? (
                  <motion.div
                    key={`reel-${result.newItem?.id ?? result.effectItem?.id ?? result.componentItem?.uid ?? "pull"}`}
                    className='absolute inset-0'
                    exit={{ opacity: 0, transition: { duration: 0.22 } }}>
                    <CaseReel
                      strip={strip}
                      winIndex={REEL_WIN_INDEX}
                      caseImage={caseDef ? getCaseArt(caseDef).image : undefined}
                      rewardImage={rewardImage}
                      onFinished={() => setRevealedFor(result)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key='reward'
                    className='absolute inset-0 flex flex-col'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                    <div className='flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-5 pb-4 pt-10 text-center'>
                      <motion.span
                        {...enter(0.14)}
                        className='flex items-center gap-2 text-sm font-bold'
                        style={{ color: readableText(color) }}>
                        <span className='h-2 w-2 rounded-full' style={{ background: color }} />
                        {labels.rarity(rarity)}
                      </motion.span>

                      <div className='relative my-1 flex h-44 w-full max-w-sm items-center justify-center sm:h-56'>
                        <div
                          className='absolute h-48 w-48 rounded-full sm:h-60 sm:w-60'
                          style={{
                            background: `radial-gradient(closest-side, ${color}38, ${color}10 70%, transparent)`,
                          }}
                        />
                        {isAtLeast(rarity, "Epic") && (
                          <motion.span
                            aria-hidden
                            className='absolute h-48 w-48 rounded-full border-2 sm:h-60 sm:w-60'
                            style={{ borderColor: color }}
                            initial={{ opacity: 0.9, scale: 0.8 }}
                            animate={{ opacity: 0, scale: 1.35 }}
                            transition={{ delay: 0.26, duration: 0.7, ease: "easeOut" }}
                          />
                        )}
                        <motion.div
                          className='relative z-10 flex h-full w-full items-center justify-center'
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: [0.6, 1.05, 1] }}
                          transition={{ duration: 0.56, ease: EASE.out }}>
                          {component ? (
                            <ComponentThumb def={component} className='h-32 w-56' />
                          ) : (
                            <img
                              src={rewardImage ?? ""}
                              alt={winItem.def.name}
                              draggable={false}
                              className={cn(
                                "object-contain",
                                guitar ? "max-h-full max-w-full" : "max-h-[75%] max-w-[60%]",
                              )}
                            />
                          )}
                        </motion.div>
                      </div>

                      <motion.h2
                        {...enter(0.22)}
                        className='text-balance font-display text-2xl font-extrabold leading-tight text-zinc-50 sm:text-3xl'>
                        {winItem.def.name}
                      </motion.h2>
                      {meta && (
                        <motion.p {...enter(0.28)} className='text-sm text-zinc-400'>
                          {meta}
                        </motion.p>
                      )}
                      {traits && (
                        <motion.p {...enter(0.3)} className='max-w-sm text-xs font-medium text-zinc-300'>
                          {traits}
                        </motion.p>
                      )}

                      <motion.span
                        {...enter(0.34)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          result.isNewToDex || component
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-zinc-800/60 text-zinc-300",
                        )}>
                        {component
                          ? t("opening.builder_part")
                          : result.isNewToDex
                            ? t("opening.first_pull")
                            : t("opening.duplicate")}
                      </motion.span>

                      {result.pityHit && (
                        <motion.p {...enter(0.38)} className='text-xs font-medium text-amber-400'>
                          {result.pityHit === "top" && caseDef?.pity?.top
                            ? t("opening.pity_top", { rarity: labels.rarity(caseDef.pity.top.rarity) })
                            : t("opening.pity_new")}
                        </motion.p>
                      )}

                      {/* The bonus a Parts Crate sometimes carries: it lands a beat
                          after the part, so it reads as a second drop. */}
                      {result.extractor && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6, y: 12 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: 0.9, type: "spring", stiffness: 420, damping: 16 }}
                          className='flex items-center gap-3 rounded-lg bg-amber-500/15 px-4 py-2'>
                          <div className='h-9 w-9 shrink-0'>
                            <ExtractorArt />
                          </div>
                          <span className='text-sm font-bold text-amber-200'>
                            {t("trait_craft.bonus_extractor")}
                          </span>
                        </motion.div>
                      )}

                      {/* A duplicate: the copy it would go into, and how far it would take it. */}
                      {mergeOffer && (
                        <motion.div
                          {...enter(0.42)}
                          className='mt-1 flex w-full max-w-xs flex-col gap-2 rounded-xl bg-zinc-800/40 px-4 py-3 text-left'>
                          <div className='flex items-baseline justify-between gap-3 text-sm'>
                            <span className='font-semibold text-zinc-200'>{t("opening.best_copy")}</span>
                            <span className='tabular-nums text-zinc-400'>
                              <span className='font-bold text-zinc-50'>
                                {t("common.lvl", { level: mergeOffer.levelBefore })}
                              </span>{" "}
                              → {mergeOffer.levelAfter}
                            </span>
                          </div>
                          <div className='relative h-4 overflow-hidden rounded-full bg-zinc-800'>
                            <div
                              className='absolute inset-y-0 left-0 w-full rounded-full opacity-35'
                              style={{ background: color }}
                            />
                            <motion.div
                              className='absolute inset-y-0 left-0 rounded-full'
                              style={{ background: color }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(mergeOffer.levelBefore / Math.max(1, mergeOffer.levelAfter)) * 100}%`,
                              }}
                              transition={{ delay: 0.5, duration: 0.6, ease: EASE.out }}>
                              <span className='absolute inset-x-2 top-[3px] h-1 rounded-full bg-white/35' />
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {!component && (
                        <motion.div {...enter(0.48)} className='mt-1 flex flex-wrap justify-center gap-2'>
                          {mergeOffer ? (
                            <Button variant='ghost' size='sm' onClick={onClose} disabled={isBusy}>
                              {keepLabel}
                            </Button>
                          ) : guitar ? (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                equip(
                                  {
                                    guitarId: guitar.id,
                                    year: result.newItem?.year,
                                    country: result.newItem?.country,
                                  },
                                  { onSuccess: onClose },
                                )
                              }
                              disabled={isBusy}>
                              {t("opening.equip_now")}
                            </Button>
                          ) : null}
                          <Button variant='ghost' size='sm' onClick={handleSell} disabled={isBusy}>
                            {isSelling ? (
                              t("common.selling")
                            ) : (
                              <>
                                <span>{t("common.sell")}</span>
                                <span className='flex items-center gap-1 text-amber-400'>
                                  <img src='/images/tokens/coin.png' alt='' className='h-4 w-4 object-contain' />
                                  {sellValue}
                                </span>
                              </>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </div>

                    {/* The one thing to do, pinned where the thumb is. */}
                    <motion.div
                      {...enter(0.56)}
                      className='mx-auto flex w-full max-w-md shrink-0 flex-col gap-2.5 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-3'>
                      {component ? (
                        <>
                          <Button size='xl' className='w-full' onClick={openBuilder} disabled={isBusy}>
                            {t("opening.open_in_builder")}
                          </Button>
                          <Button variant='ghost' size='lg' className='w-full' onClick={onClose} disabled={isBusy}>
                            {t("opening.keep")}
                          </Button>
                        </>
                      ) : mergeOffer ? (
                        <Button size='xl' className='w-full' onClick={handleMerge} disabled={isBusy}>
                          {isMerging ? t("pack.merging") : t("stash.menu.merge", { gain: mergeOffer.gain })}
                        </Button>
                      ) : (
                        <Button size='xl' className='w-full' onClick={onClose} disabled={isBusy}>
                          {keepLabel}
                        </Button>
                      )}

                      {onOpenAgain && caseDef && (
                        <Button
                          variant='ghost'
                          size='lg'
                          className='w-full'
                          onClick={() => onOpenAgain(openAgainPayment?.kind === "token")}
                          disabled={isBusy || !openAgainPayment}>
                          {isOpeningAgain ? (
                            t("cases.opening")
                          ) : (
                            <>
                              <span className='truncate'>
                                {t("opening.open_another", { name: labels.caseName(caseDef) })}
                              </span>
                              {openAgainPayment?.kind === "fame" ? (
                                <span className='flex items-center gap-1.5 text-amber-400'>
                                  <img src='/images/tokens/coin.png' alt='' className='h-5 w-5 object-contain' />
                                  {openAgainPayment.cost}
                                </span>
                              ) : openAgainPayment?.kind === "token" ? (
                                <span className='flex items-center gap-1.5 text-emerald-400'>
                                  <FreeCaseIcon size={20} />
                                  {t("view.free_cases", { count: 1 })}
                                </span>
                              ) : (
                                <span className='flex items-center gap-1.5 text-zinc-500'>
                                  <img
                                    src='/images/tokens/coin.png'
                                    alt=''
                                    className='h-5 w-5 object-contain opacity-50'
                                  />
                                  {t("opening.cost_needed", { cost: caseDef.fameCost })}
                                </span>
                              )}
                            </>
                          )}
                        </Button>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
      {merge.element}
    </>
  );
};
