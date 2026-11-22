import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { AnimeChip, AnimeMoment } from "components/AnimeMoment/AnimeMoment";
import { Kostek } from "components/Mascot/Kostek";
import { RewardSummary } from "components/Rewards/RewardSummary";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { AnimatePresence } from "framer-motion";
import { useClaimJourneyReward, useRewardLedger } from "hooks/useRewardLedger";
import { useTranslation } from "hooks/useTranslation";
import { Check, Lock } from "lucide-react";
import { useState } from "react";

import { getJourneyReward, journeyRewardId } from "../../data/journeyRewards";

interface JourneyFinishCardProps {
  moduleId: string;
  done: number;
  total: number;
}

/**
 * The finish line of a roadmap.
 *
 * The guitar is the reward, and the card is built around it: the instrument
 * sits on top at a size nothing else on the path competes with, and the Fame
 * and parts go underneath it as a footnote. A roadmap is a course somebody
 * works through for weeks, and "here is the guitar you get" is a better reason
 * to keep going than any number.
 *
 * Shown from the first visit, greyed and locked. Knowing *which* Legendary is
 * waiting is the whole point — a mystery prize motivates nobody, and this model
 * is fixed for the module, so it can be named up front.
 */
export const JourneyFinishCard = ({
  moduleId,
  done,
  total,
}: JourneyFinishCardProps) => {
  const { t } = useTranslation("journey");
  const reward = getJourneyReward(moduleId);
  const { data: ledger } = useRewardLedger();
  const { mutate: claim, isPending } = useClaimJourneyReward();
  // Collecting the roadmap's guitar is one of the few big wins: it gets the
  // full-screen moment, with the guitar itself as the hero.
  const [celebrating, setCelebrating] = useState(false);

  if (!reward?.guitar || total === 0) return null;

  const { payout, guitar } = reward;
  const isClaimed =
    ledger?.journeys.claimed.includes(journeyRewardId(moduleId)) ?? false;
  const isComplete = done >= total;
  const canClaim = isComplete && !isClaimed;
  const rarityColor = getRarityColor(guitar.rarity);

  return (
    <>
    <AnimatePresence>
      {celebrating && (
        <AnimeMoment
          title={t("finish.moment")}
          subtitle={`${guitar.brand} ${guitar.name}`}
          colors={{ a: rarityColor, b: "#f4b63e" }}
          land={0.9}
          durationMs={3800}
          hero={
            <div className='relative'>
              <img
                src={getRankBadgeSrc(guitar.imageId, "medium")}
                alt=''
                className='h-44 w-80 object-contain md:h-52 md:w-[26rem]'
                draggable={false}
              />
              <Kostek mood='celebrate' short delay={0.9} className='absolute -bottom-10 -right-4 h-24 md:h-28' />
            </div>
          }
          onDone={() => setCelebrating(false)}>
          <AnimeChip className='font-bold' >
            <span style={{ color: rarityColor }}>{guitar.rarity}</span>
          </AnimeChip>
        </AnimeMoment>
      )}
    </AnimatePresence>
    <div
      className={cn(
        "relative z-10 flex w-full max-w-sm flex-col items-center gap-6 overflow-hidden rounded-lg px-8 py-8 text-center",
        canClaim
          ? "bg-zinc-900 bg-gradient-to-b from-emerald-500/10 to-emerald-500/10"
          : "bg-zinc-900",
      )}>
      {/* The rarity's own colour behind the instrument, so a Legendary reads as
          one before a single word is. Only once it is actually won — a locked
          trophy should look like something still out of reach. Static: the
          card sits at the end of a path the player scrolls to read, and a
          breathing glow under it pulled the eye off everything above. */}
      {canClaim && (
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 opacity-50'
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${rarityColor}40, transparent 70%)`,
          }}
        />
      )}

      {/* The finish is reached and the guitar waits: Kostek throws a short party
          in the corner — small, the guitar stays the prize. */}
      {canClaim && (
        <Kostek mood='celebrate' short delay={0.3} className='absolute right-3 top-3 z-10 h-16' />
      )}

      <div className='relative flex flex-col items-center gap-3'>
        <img
          src={getRankBadgeSrc(guitar.imageId, "medium")}
          alt={`${guitar.brand} ${guitar.name}`}
          className={cn(
            "h-32 w-32 object-contain transition-[filter]",
            !canClaim && !isClaimed && "opacity-40 grayscale",
          )}
          draggable={false}
        />

        <div>
          <span
            className='text-[11px] font-bold'
            style={{ color: rarityColor }}>
            {guitar.rarity}
          </span>
          <p className='font-display text-lg font-black leading-tight text-zinc-100'>
            {guitar.brand} {guitar.name}
          </p>
          <p className='mt-1.5 text-xs text-zinc-400'>
            {isClaimed
              ? t("finish.in_arsenal")
              : canClaim
                ? t("finish.complete")
                : t("finish.steps_left", { left: total - done, total })}
          </p>
        </div>
      </div>

      {/* Everything else the finish pays, kept deliberately under the guitar. */}
      <RewardSummary
        reward={payout}
        size='lg'
        muted={!canClaim}
        className='relative items-start text-left'
      />

      {canClaim ? (
        <Button
          size='lg'
          onClick={() => claim(moduleId, { onSuccess: () => setCelebrating(true) })}
          loading={isPending}>
          {isPending ? t("finish.collecting") : t("finish.collect")}
        </Button>
      ) : (
        <span
          className={cn(
            "relative flex items-center gap-2 text-xs font-bold",
            isClaimed ? "text-emerald-400" : "text-zinc-600",
          )}>
          {isClaimed ? (
            <>
              <Check size={14} strokeWidth={3} />
              {t("finish.collected")}
            </>
          ) : (
            <>
              <Lock size={14} strokeWidth={2.5} />
              {t("finish.steps", { done, total })}
            </>
          )}
        </span>
      )}
    </div>
    </>
  );
};
