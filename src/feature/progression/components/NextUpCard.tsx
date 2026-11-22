import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { FreeCaseIcon } from "components/Rewards/FreeCaseIcon";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { TierPlate } from "feature/arsenal/components/TierPlate";
import { ModArt } from "feature/arsenal/components/Workshop/ModArt";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { getModDef } from "feature/arsenal/data/workshop";
import type {
  ScrapPart,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";
import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";
import {
  pointsToReachLvl,
  progressToLvl,
} from "feature/levelGate/utils/levelGate.utils";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useAutoClaimLevels } from "hooks/useRewardLedger";
import { useAppSelector } from "store/hooks";

import type { LevelMilestone, MilestoneUnlock } from "../data/levelMilestones";
import { LEVEL_MILESTONES } from "../data/levelMilestones";
import { rollLevelReward } from "../utils/levelRewards";

/** How far ahead the path looks. Three stops is a horizon, four is a roadmap. */
const AHEAD = 3;

/** Cases are cyan wherever they appear — the shelf, the banner, this plate. */
const CASE_COLOR = "#22d3ee";

/**
 * What one unlock reads as. Plain words: the rewards under it already carry
 * the tiers' colours, and a rarity's name in its own colour on top of them made
 * the card four colours wide.
 */
const unlockLabel = (unlock: MilestoneUnlock): string =>
  unlock.kind === "rarity"
    ? `${unlock.rarity} gear`
    : FEATURE_UNLOCKS[unlock.feature].name;

/** Whatever a rung pays, in the loosest shape that covers both callers. */
interface RewardLike {
  caseTokens: number;
  parts: ScrapPart[];
  mods: { featureId: string; kind: WorkshopKind; points: number }[];
}

/**
 * A mod's name, looked up rather than carried.
 *
 * The two callers disagree about it: a rung the player has not reached yet
 * rolls a `RolledMod`, which has a label, while one the server just paid comes
 * back as the `SalvagedMod` now in the stash, which does not. The definition
 * has the name either way, so neither caller has to.
 */
const modName = (mod: RewardLike["mods"][number]): string =>
  getModDef(mod.kind, mod.featureId)?.label ?? "Upgrade";

const totalParts = (parts: ScrapPart[]) =>
  parts.reduce((sum, part) => sum + part.qty, 0);

/**
 * What a rung pays, as the things themselves.
 *
 * Every reward gets the same box, and it is the stash's own box: `TierPlate` is
 * what a part sits on in the cabinet, and `ModArt` draws the blueprint plate a
 * mod sits on there. Mixing a plated mod with a bare cut-out part — which is
 * what this used to do — made a row of equals look like one framed picture
 * beside some loose clip art. Counts ride in the plate's own corner chip, in a
 * different shape from a level, so `×2` is never read as "level 2".
 *
 * A player who has seen the picture recognises the drop when it lands; a player
 * who read "2 Epic parts" has to go and look it up.
 */
const RewardIcons = ({
  reward,
  size = 46,
  muted,
  align = "center",
}: {
  reward: RewardLike;
  size?: number;
  muted?: boolean;
  /** The receipt centres its haul; a stop on the path hangs it under its node. */
  align?: "end" | "center";
}) => (
  <div
    className={cn(
      "flex flex-wrap items-center gap-2",
      align === "center" ? "justify-center" : "justify-end",
    )}>
    {reward.caseTokens > 0 && (
      <span
        title={
          reward.caseTokens > 1
            ? `${reward.caseTokens} free cases`
            : "A free case"
        }>
        <TierPlate
          color={CASE_COLOR}
          size={size}
          muted={muted}
          count={reward.caseTokens > 1 ? reward.caseTokens : undefined}>
          <FreeCaseIcon size={Math.round(size * 0.6)} />
        </TierPlate>
      </span>
    )}

    {reward.parts.map((part) => (
      <span
        key={`${part.partId}:${part.tier}`}
        title={`${part.qty}× ${part.tier} part`}>
        <TierPlate
          color={PART_TIER_COLORS[part.tier]}
          size={size}
          muted={muted}
          count={part.qty > 1 ? part.qty : undefined}>
          <PartIcon partId={part.partId} size={Math.round(size * 0.74)} />
        </TierPlate>
      </span>
    ))}

    {reward.mods.map((mod, idx) => (
      <span
        key={`${mod.featureId}:${idx}`}
        className='inline-flex'
        title={`${modName(mod)} +${mod.points} — fits a ${
          mod.kind === "guitar" ? "guitar" : "pedal"
        }`}>
        <ModArt modId={mod.featureId} size={size} dimmed={muted} />
      </span>
    ))}
  </div>
);

/** The least a started stretch shows, so two points in still reads as begun. */
const MIN_FILL_PCT = 2;

/**
 * One stop on the path ahead: the level, what it opens, what it pays.
 *
 * It hangs off the right end of its stretch of the track, under its node — the
 * road to a stop is the part of the bar on its left. Only the next stop is at
 * full strength; the two after it are the same thing, quieter.
 *
 * Never the rank badge for a stop. Those badges are guitars, and a guitar on
 * this card is a guitar the player has every reason to think they are being
 * given.
 */
const Stop = ({
  milestone,
  isNext,
}: {
  milestone: LevelMilestone;
  isNext: boolean;
}) => {
  const reward = rollLevelReward(milestone);

  return (
    <div className='flex min-w-0 flex-col items-end gap-3 pl-3 text-right'>
      <span
        className={cn(
          "font-teko text-4xl font-bold leading-[0.8] tabular-nums sm:text-5xl",
          isNext ? "text-zinc-100" : "text-zinc-400",
        )}>
        {milestone.lvl}
      </span>

      {/* Given its height whether it has anything in it or not, so three stops
          with different amounts to say keep their rewards on one line. */}
      <div className='flex min-h-[1.25rem] flex-col items-end'>
        {milestone.unlocks.map((unlock) => (
          <span
            key={unlockLabel(unlock)}
            className={cn(
              "text-xs sm:text-sm",
              isNext ? "font-semibold text-zinc-100" : "text-zinc-400",
            )}>
            {unlockLabel(unlock)}
          </span>
        ))}
      </div>

      {reward && (
        <div className={cn(!isNext && "opacity-60")}>
          <RewardIcons reward={reward} size={40} align='end' />
        </div>
      )}
    </div>
  );
};

/**
 * The climb ahead, on the screen that just moved the player along it.
 *
 * This sits at the end of a session because that is the moment the number
 * changed — points landed a minute ago, and "what does the next level get me"
 * is a question the player is already asking. A ladder parked on a profile page
 * answered it only for whoever went looking; here it arrives on its own.
 *
 * Nothing on it is a button. Reaching a level is what earns the rung, so the
 * payout happens on its own the moment the screen opens (`useAutoClaimLevels`)
 * and this card reports it rather than offering it. A Collect button would only
 * have invented a way to forget.
 */
export const NextUpCard = ({ className }: { className?: string }) => {
  const stats = useAppSelector(selectCurrentUserStats);
  // Fires once, pays whatever is owed, and returns what it paid — or null when
  // the account was already square, which is the usual answer.
  const collected = useAutoClaimLevels();

  const lvl = stats?.lvl ?? 1;
  const points = stats?.points ?? 0;

  const ahead = LEVEL_MILESTONES.filter(
    (milestone) => milestone.lvl > lvl,
  ).slice(0, AHEAD);

  const paid = collected && collected.levels.length > 0 ? collected : null;
  // 0–1 along the stretch to the next stop.
  const progress =
    ahead.length > 0 ? progressToLvl(points, lvl, ahead[0].lvl) : 0;

  // Nothing paid and nothing left to climb: the card would be an empty box on a
  // screen that is meant to be a reward.
  if (!paid && ahead.length === 0) return null;

  return (
    <Card className={cn("p-5 sm:p-6", className)}>
      {paid && (
        <div className='mb-9 space-y-4'>
          <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
            <h3 className='text-sm font-semibold text-zinc-300'>
              {paid.levels.length === 1
                ? `Level ${paid.levels[0]} paid out`
                : `${paid.levels.length} levels paid out`}
            </h3>
            <span className='text-xs text-zinc-500'>
              already in your stash
            </span>
          </div>

          <div>
            <RewardIcons reward={paid} size={52} />
          </div>

          {/* The levels themselves, once there are too many to read off the
              heading. Nothing to press — this is a receipt. */}
          {paid.levels.length > 1 && (
            <p className='text-xs text-zinc-500'>
              Levels {paid.levels.join(", ")} —{" "}
              {totalParts(paid.parts)} parts
              {paid.mods.length > 0 && `, ${paid.mods.length} upgrades`}
              {paid.caseTokens > 0 && `, ${paid.caseTokens} free cases`}.
            </p>
          )}
        </div>
      )}

      {ahead.length > 0 && (
        <div className='flex flex-col gap-6'>
          {/* One track for the whole climb, cut into as many stretches as
              there are stops, each ending in its stop's node. Only the first
              stretch can be part-filled — it is the progress to the next
              level, so the card needs no second bar and no heading. */}
          <div
            className='relative h-3 rounded-full bg-zinc-800'
            role='progressbar'
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label={`Level ${ahead[0].lvl}`}>
            {progress > 0 && (
              <div
                className='h-full rounded-full bg-cyan-400'
                style={{
                  width: `${Math.max(MIN_FILL_PCT, (progress * 100) / ahead.length)}%`,
                }}
              />
            )}
            {ahead.map((milestone, idx) => (
              <span
                key={milestone.lvl}
                aria-hidden
                className='absolute top-1/2 h-5 w-5 -translate-x-full -translate-y-1/2 rounded-full bg-zinc-700'
                style={{ left: `${((idx + 1) * 100) / ahead.length}%` }}
              />
            ))}
          </div>

          <div
            // No gap: each column ends exactly where its node sits on the
            // track, and keeps its distance with padding instead.
            className='grid'
            style={{
              gridTemplateColumns: `repeat(${ahead.length}, minmax(0, 1fr))`,
            }}>
            {ahead.map((milestone, idx) => (
              <Stop
                key={milestone.lvl}
                milestone={milestone}
                isNext={idx === 0}
              />
            ))}
          </div>

          <p className='text-sm tabular-nums text-zinc-400'>
            <span className='font-bold text-zinc-100'>
              {pointsToReachLvl(points, ahead[0].lvl).toLocaleString()}
            </span>{" "}
            pts to level {ahead[0].lvl}
          </p>
        </div>
      )}
    </Card>
  );
};
