"use client";

import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { POOL_RARITY_ORDER } from "feature/arsenal/data/dailyCase";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { useMergeDuplicates } from "feature/arsenal/hooks/useMergeDuplicates";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { isAtLeast } from "feature/arsenal/utils/pity";
import { ComponentThumb } from "feature/guitarBuilder/components/ComponentThumb";
import { motion, useReducedMotion } from "framer-motion";
import { Interpolate } from "lib/i18n/Interpolate";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import type {
  CaseDefinition,
  GuitarRarity,
  OpenCasePackResult,
  OpenCaseResult,
} from "../../types/arsenal.types";
import { getCaseArt } from "../CaseShop/CaseCard";
import { RARITY_STYLES } from "../RarityBadge";
import { CountUp } from "./CountUp";

interface CasePackModalProps {
  /** What came out. Null while the request is still in flight. */
  pack: OpenCasePackResult | null;
  /** True from the click until the answer arrives — the case is shown shaking. */
  opening?: boolean;
  /** How many were asked for, for the line shown while waiting. */
  count?: number;
  caseDef?: CaseDefinition;
  onClose: () => void;
  /** Opens the same pack again, if the player can pay for it. */
  onOpenAgain?: () => void;
  canOpenAgain?: boolean;
  isOpeningAgain?: boolean;
}

const rarityOf = (result: OpenCaseResult): GuitarRarity =>
  result.guitar?.rarity ??
  result.effect?.rarity ??
  result.component?.rarity ??
  "Common";

/** Index on the drop ladder, rarest first — so a higher number is a commoner pull. */
const rarityRank = (rarity: GuitarRarity): number => {
  const index = POOL_RARITY_ORDER.indexOf(rarity);
  return index === -1 ? POOL_RARITY_ORDER.length : index;
};

/** Pause after the answer lands before the first card turns. */
const REVEAL_LEAD_MS = 500;

/** Gap between cards turning over. Tighter for a pack of ten, so it does not drag. */
const revealStep = (total: number) => (total > 6 ? 320 : 450);

/** The wait, made into a scene: the case rattles until the answer comes back. */
const OpeningStage = ({
  caseDef,
  count,
}: {
  caseDef?: CaseDefinition;
  count?: number;
}) => {
  const { t } = useArsenalLabels();
  const art = caseDef ? getCaseArt(caseDef) : null;

  return createPortal(
    <motion.div
      role='status'
      className='fixed inset-0 z-[1000] flex flex-col items-center justify-center gap-8 bg-black/95 px-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}>
      {art && (
        <div className='relative flex h-56 w-full max-w-sm items-center justify-center'>
          <div
            className='pointer-events-none absolute inset-0'
            style={{
              background: `radial-gradient(closest-side, ${art.color}33 0%, transparent 100%)`,
            }}
          />
          <motion.img
            src={art.image}
            alt=''
            className='relative z-10 max-h-full w-4/5 object-contain'
            animate={{
              x: [0, -7, 7, -5, 5, -2, 0],
              rotate: [0, -2.5, 2.5, -1.8, 1.8, -0.6, 0],
              y: [0, 0, -3, 0, -2, 0, 0],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              repeatDelay: 0.25,
              ease: "easeInOut",
            }}
          />
        </div>
      )}
      <p className='text-sm font-semibold tracking-widest text-zinc-400'>
        {t("pack.opening", { count: count ?? 0 })}
      </p>
    </motion.div>,
    document.body,
  );
};

/**
 * What a pack came to.
 *
 * It plays out rather than appearing: every card starts face down, turns over
 * one after another from the commonest to the rarest — so the pull the player is
 * waiting for is the last thing to land — and only then do the summary and the
 * buttons come in. Skip turns them all at once, and a player who has asked their
 * system for less motion gets the finished screen straight away.
 *
 * The duplicates, the part of a pack nobody wanted, carry the one button that
 * does something with them: merging each into the copy already owned.
 */
export const CasePackModal = ({
  pack,
  opening = false,
  count,
  caseDef,
  onClose,
  onOpenAgain,
  canOpenAgain = false,
  isOpeningAgain = false,
}: CasePackModalProps) => {
  const labels = useArsenalLabels();
  const { t } = labels;
  const reduceMotion = useReducedMotion();
  // Which pack has had its duplicates merged. Keyed by the pack itself, so a
  // fresh pack starts unmerged without an effect having to reset anything.
  const [mergedPack, setMergedPack] = useState<OpenCasePackResult | null>(null);
  const merged = pack !== null && mergedPack === pack;
  const { mutateAsync: merge, isPending: isMerging } = useMergeDuplicates();

  // How many cards have turned over, keyed by the pack for the same reason.
  const [progress, setProgress] = useState<{
    pack: OpenCasePackResult | null;
    shown: number;
  }>({ pack: null, shown: 0 });

  const total = pack?.results.length ?? 0;
  const revealed = !pack
    ? 0
    : reduceMotion
      ? total
      : progress.pack === pack
        ? progress.shown
        : 0;
  const done = pack !== null && revealed >= total;

  useEffect(() => {
    if (!pack || reduceMotion) return;
    const size = pack.results.length;
    let shown = 0;
    let ticker: ReturnType<typeof setInterval> | undefined;

    const lead = setTimeout(() => {
      ticker = setInterval(() => {
        shown += 1;
        // Never walks it back: Skip may already have turned everything.
        setProgress((p) => ({
          pack,
          shown: Math.max(p.pack === pack ? p.shown : 0, shown),
        }));
        if (shown >= size && ticker) clearInterval(ticker);
      }, revealStep(size));
    }, REVEAL_LEAD_MS);

    return () => {
      clearTimeout(lead);
      if (ticker) clearInterval(ticker);
    };
  }, [pack, reduceMotion]);

  // Commonest first, so the rarest is what the reveal ends on.
  const sorted = useMemo(
    () =>
      pack
        ? [...pack.results].sort(
            (a, b) => rarityRank(rarityOf(b)) - rarityRank(rarityOf(a)),
          )
        : [],
    [pack],
  );

  const stats = useMemo(() => {
    const results = pack?.results ?? [];
    return {
      fresh: results.filter((r) => r.type !== "component" && r.isNewToDex)
        .length,
      dupes: results.filter((r) => r.type !== "component" && !r.isNewToDex)
        .length,
      parts: results.filter((r) => r.type === "component").length,
      gain: results.reduce((sum, r) => sum + (r.merge?.gain ?? 0), 0),
    };
  }, [pack]);

  const mergeable = (pack?.results ?? []).filter((r) => r.merge);

  const handleMerge = async () => {
    const guitars = mergeable.flatMap((r) =>
      r.type === "guitar" && r.newItem ? [r.newItem.id] : [],
    );
    const effects = mergeable.flatMap((r) =>
      r.type === "effect" && r.effectItem ? [r.effectItem.id] : [],
    );
    try {
      if (guitars.length) await merge({ kind: "guitar", itemIds: guitars });
      if (effects.length) await merge({ kind: "effect", itemIds: effects });
      setMergedPack(pack);
    } catch {
      // The hook has already told the player; the button stays available.
    }
  };

  // Nothing to portal until there is something to show, which also keeps the
  // server render and the first client render identical.
  if (!pack) {
    return opening ? <OpeningStage caseDef={caseDef} count={count} /> : null;
  }

  const stoppedEarly = pack.results.length < pack.requested;
  const art = caseDef ? getCaseArt(caseDef) : null;

  // The card that has just turned, if it is one worth a flash of the screen.
  const latest = revealed > 0 ? sorted[revealed - 1] : null;
  const flashRarity =
    latest && !reduceMotion && isAtLeast(rarityOf(latest), "Legendary")
      ? rarityOf(latest)
      : null;

  return createPortal(
    <motion.div
      className='fixed inset-0 z-[1000] flex flex-col items-center overflow-y-auto py-6'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}>
      <div
        className='fixed inset-0 bg-black/95'
        onClick={done ? onClose : undefined}
      />

      {flashRarity && (
        <motion.div
          key={revealed}
          className='pointer-events-none fixed inset-0 z-20'
          style={{
            background: `radial-gradient(circle at center, ${RARITY_STYLES[flashRarity].baseColor}66 0%, transparent 65%)`,
          }}
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}

      <div className='relative z-10 my-auto flex w-full max-w-5xl flex-col gap-8 px-4'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h2 className='text-2xl font-black capitalize tracking-[0.3em] text-zinc-300'>
            {caseDef
              ? t("pack.title", {
                  name: labels.caseName(caseDef),
                  count: pack.results.length,
                })
              : t("opening.title")}
          </h2>

          {/* One row for both states, so nothing jumps when the reveal ends. */}
          <div className='flex min-h-6 flex-col items-center gap-1'>
            {!done ? (
              <button
                type='button'
                onClick={() => setProgress({ pack, shown: total })}
                className='text-sm font-semibold text-zinc-400 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-zinc-100'>
                {t("pack.skip")}
              </button>
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className='flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm font-medium'>
                {stats.fresh > 0 && (
                  <span className='text-amber-300'>
                    {t("pack.new", { count: stats.fresh })}
                  </span>
                )}
                {stats.dupes > 0 && (
                  <span className='text-zinc-400'>
                    {t("pack.dupes", { count: stats.dupes })}
                  </span>
                )}
                {stats.parts > 0 && (
                  <span className='text-zinc-400'>
                    {t("pack.parts", { count: stats.parts })}
                  </span>
                )}
              </motion.p>
            )}
          </div>

          {done && merged && stats.gain > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-sm font-bold text-amber-300'>
              <Interpolate
                text={t("pack.merged_total")}
                values={{
                  gain: <CountUp to={stats.gain} duration={1} delay={0.3} />,
                }}
              />
            </motion.p>
          )}
          {done && stoppedEarly && (
            <p className='text-xs font-medium text-red-400'>
              {t("pack.stopped", {
                done: pack.results.length,
                asked: pack.requested,
              })}
            </p>
          )}
        </div>

        <ul className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'>
          {sorted.map((result, index) => {
            const rarity = rarityOf(result);
            const rs = RARITY_STYLES[rarity];
            const isComponent = result.type === "component";
            const name =
              result.guitar?.name ??
              result.effect?.name ??
              result.component?.name ??
              "";
            const isDupe = !isComponent && !result.isNewToDex;
            // A duplicate that has just been folded in. Each tile takes its bump in
            // turn, down the grid, so the merge reads as a wave rather than a flicker.
            const absorbed = merged && isDupe && Boolean(result.merge);
            const stagger = Math.min(index, 12) * 0.05;
            const isUp = index < revealed;
            const key =
              result.newItem?.id ??
              result.effectItem?.id ??
              result.componentItem?.uid ??
              String(index);
            return (
              <motion.li
                key={key}
                className='relative h-52'
                style={{ perspective: 900 }}
                initial={{ opacity: 0, y: 16 }}
                animate={
                  absorbed
                    ? { opacity: 1, y: 0, scale: [1, 1.07, 1] }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                transition={{
                  delay: stagger,
                  ...(absorbed ? { duration: 0.55, ease: "easeOut" } : {}),
                }}>
                <motion.div
                  className='relative h-full w-full'
                  style={{ transformStyle: "preserve-3d" }}
                  initial={false}
                  animate={{ rotateY: isUp ? 0 : 180 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.55,
                    ease: [0.3, 1.25, 0.5, 1],
                  }}>
                  {/* The front: the pull itself. */}
                  <div
                    className='absolute inset-0 flex flex-col overflow-hidden rounded-lg bg-zinc-900/70'
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}>
                    <div
                      className='relative flex h-28 shrink-0 items-center justify-center overflow-hidden'
                      style={{
                        background: `radial-gradient(circle at center, ${rs.baseColor}2e 0%, ${rs.baseColor}0d 50%, rgba(24,24,27,0.85) 90%)`,
                      }}>
                      {result.guitar ? (
                        <img
                          src={getRankBadgeSrc(result.guitar.imageId, "small")}
                          alt={name}
                          className='relative z-10 h-[300px] w-[300px] -rotate-45 object-contain'
                        />
                      ) : result.effect ? (
                        <img
                          src={getEffectImageSrc(
                            result.effect.imageId,
                            "medium",
                          )}
                          alt={name}
                          className='relative z-10 h-24 w-24 object-contain'
                        />
                      ) : result.component ? (
                        <ComponentThumb
                          def={result.component}
                          className='relative z-10 h-20 w-36'
                        />
                      ) : null}
                      <div
                        className='absolute inset-x-0 bottom-0 z-20 h-1'
                        style={{ background: rs.baseColor, opacity: 0.8 }}
                      />
                      {absorbed && result.merge && (
                        <motion.span
                          initial={{ opacity: 0, y: 8, scale: 0.7 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            delay: stagger + 0.2,
                            type: "spring",
                            stiffness: 320,
                            damping: 16,
                          }}
                          className='absolute right-2 top-2 z-30 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[11px] font-black tabular-nums'
                          style={{ color: rs.baseColor }}>
                          +{result.merge.gain}
                        </motion.span>
                      )}
                    </div>
                    <div className='flex flex-1 flex-col gap-1 px-3 py-3'>
                      <span
                        className='truncate text-xs font-bold'
                        style={{ color: rs.baseColor }}>
                        {name}
                      </span>
                      <span className='text-[11px] font-medium text-zinc-500'>
                        {labels.rarity(rarity)}
                      </span>
                      <span
                        className={cn(
                          "mt-1 text-[11px] font-semibold",
                          isDupe ? "text-zinc-400" : "text-amber-300",
                        )}>
                        {isComponent
                          ? t("opening.builder_part")
                          : isDupe
                            ? result.merge
                              ? merged
                                ? t("pack.merged")
                                : t("pack.dup_gain", {
                                    gain: result.merge.gain,
                                  })
                              : t("pack.dup_tag")
                            : t("pack.new_tag")}
                      </span>
                    </div>
                  </div>

                  {/* The back: the case it came out of, nothing about the pull. */}
                  <div
                    className='absolute inset-0 flex items-center justify-center overflow-hidden rounded-lg bg-zinc-900 p-5'
                    style={{
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}>
                    {art && (
                      <img
                        src={art.image}
                        alt=''
                        className='max-h-full max-w-full object-contain opacity-40'
                      />
                    )}
                  </div>
                </motion.div>

                {/* A ring thrown off the moment a good one turns over. */}
                {isUp && !reduceMotion && isAtLeast(rarity, "Epic") && (
                  <motion.span
                    aria-hidden
                    className='pointer-events-none absolute inset-0 rounded-lg'
                    style={{ border: `2px solid ${rs.baseColor}` }}
                    initial={{ opacity: 0.9, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.3 }}
                    transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
                  />
                )}
              </motion.li>
            );
          })}
        </ul>

        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className='mx-auto flex w-full max-w-xl flex-col gap-3'>
            {mergeable.length > 0 && (
              <Button
                onClick={handleMerge}
                disabled={merged || isMerging}
                className='h-12 w-full bg-white text-sm font-medium tracking-widest text-zinc-900 disabled:opacity-50 hover:bg-zinc-200'>
                {merged
                  ? t("pack.merged")
                  : isMerging
                    ? t("pack.merging")
                    : t("pack.merge", { gain: stats.gain })}
              </Button>
            )}
            <div className='flex flex-col gap-3 sm:flex-row'>
              {onOpenAgain && caseDef && (
                <Button
                  variant='outline'
                  onClick={onOpenAgain}
                  disabled={!canOpenAgain || isOpeningAgain || isMerging}
                  className='h-12 w-full border-zinc-700 bg-zinc-900 text-sm font-medium tracking-widest text-white disabled:opacity-50 hover:bg-zinc-800'>
                  {isOpeningAgain
                    ? t("cases.opening")
                    : t("pack.again", { count: pack.requested })}
                </Button>
              )}
              <Button
                variant='outline'
                onClick={onClose}
                disabled={isMerging}
                className='h-12 w-full border-zinc-700 bg-zinc-900 text-sm font-medium tracking-widest text-white disabled:opacity-50 hover:bg-zinc-800'>
                {t("pack.close")}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>,
    document.body,
  );
};
