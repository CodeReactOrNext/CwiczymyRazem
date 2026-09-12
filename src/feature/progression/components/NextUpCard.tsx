import { cn } from "assets/lib/utils";
import { PartIcon } from "feature/arsenal/components/Parts/PartIcon";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { TierPlate } from "feature/arsenal/components/TierPlate";
import { ModArt } from "feature/arsenal/components/Workshop/ModArt";
import { PART_TIER_COLORS } from "feature/arsenal/data/partDefinitions";
import { getModDef } from "feature/arsenal/data/workshop";
import type {
  ScrapPart,
  WorkshopKind,
} from "feature/arsenal/types/arsenal.types";
import { FEATURE_UNLOCKS } from "feature/levelGate/data/featureUnlocks";
import { pointsToReachLvl } from "feature/levelGate/utils/levelGate.utils";
import { selectCurrentUserStats } from "feature/user/store/userSlice";
import { useAutoClaimLevels } from "hooks/useRewardLedger";
import { Ticket } from "lucide-react";
import { useAppSelector } from "store/hooks";

import type { LevelMilestone, MilestoneUnlock } from "../data/levelMilestones";
import { LEVEL_MILESTONES } from "../data/levelMilestones";
import { rollLevelReward } from "../utils/levelRewards";

/** How far ahead the path looks. Three stops is a horizon, four is a roadmap. */
const AHEAD = 3;

/** Cases are cyan wherever they appear — the shelf, the banner, this plate. */
const CASE_COLOR = "#22d3ee";

/** What one unlock reads as, and the colour it carries. */
const unlockLabel = (
  unlock: MilestoneUnlock,
): { text: string; color?: string } =>
  unlock.kind === "rarity"
    ? { text: `${unlock.rarity} gear`, color: getRarityColor(unlock.rarity) }
    : { text: FEATURE_UNLOCKS[unlock.feature].name };

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
}: {
  reward: RewardLike;
  size?: number;
  muted?: boolean;
}) => (
  <div className='flex flex-wrap items-center justify-center gap-2'>
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
          <Ticket
            size={Math.round(size * 0.46)}
            strokeWidth={2.25}
            style={{ color: CASE_COLOR }}
          />
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

/**
 * A stop on the trail — a node, not a badge.
 *
 * It used to be the level number inside a 48px disc, which was wrong twice
 * over: the number was already printed underneath, and at `font-black` the app
 * has no such weight to load, so the browser smeared a synthetic one and "12"
 * came out looking double-struck. A path is made of points; the writing goes
 * beside it.
 *
 * Never the rank badge either. Those badges are guitars, and a guitar on this
 * card is a guitar the player has every reason to think they are being given.
 */
const TrailNode = ({ isNext }: { isNext: boolean }) => (
  <span
    className={cn(
      "block h-3.5 w-3.5 shrink-0 rounded-full",
      isNext ? "bg-cyan-400" : "bg-zinc-700",
    )}
    style={
      isNext ? { boxShadow: "0 0 0 5px rgba(34,211,238,0.16)" } : undefined
    }
  />
);

/** Half the node, less half the trail — where the trail meets the nodes. */
const TRAIL_TOP = 7 - 1.5;

/** One stop on the path ahead: the level, what it opens, what it pays. */
const Stop = ({
  milestone,
  points,
  isNext,
  showTrail,
}: {
  milestone: LevelMilestone;
  points: number;
  isNext: boolean;
  /** Draws the segment back to the previous stop. Every stop but the first. */
  showTrail: boolean;
}) => {
  const reward = rollLevelReward(milestone);

  return (
    <div className='relative flex w-[168px] shrink-0 flex-col items-center px-2 text-center sm:w-auto sm:min-w-0 sm:flex-1'>
      {/* Each stop draws its own segment back to the one before it, rather than
          one line laid across the row: the row is a scroller on a phone and a
          stretched flex on a desktop, and a single absolute line cannot be
          right in both. Half a stop back to half a stop is exactly centre to
          centre. */}
      {showTrail && (
        <span
          aria-hidden
          className='absolute left-[-50%] right-1/2 h-[2px] rounded-full bg-zinc-800'
          style={{ top: TRAIL_TOP }}
        />
      )}

      <TrailNode isNext={isNext} />

      {/* Every row below the trail is given its height whether it has anything
          in it or not. Left to pack, three stops with different amounts to say
          put their artwork at three different heights, and the row stopped
          reading as one row. */}
      <p
        className={cn(
          "mt-4 text-sm font-bold",
          isNext ? "text-zinc-100" : "text-zinc-400",
        )}>
        Level {milestone.lvl}
      </p>

      <p className='h-4 text-xs tabular-nums text-cyan-400/90'>
        {isNext &&
          `${pointsToReachLvl(points, milestone.lvl).toLocaleString()} pts to go`}
      </p>

      <div className='mt-2.5 flex min-h-[1.25rem] flex-col items-center gap-0.5'>
        {milestone.unlocks.map((unlock) => {
          const { text, color } = unlockLabel(unlock);
          return (
            <span
              key={text}
              className={cn(
                "text-xs font-semibold",
                !color && "text-zinc-300",
                !isNext && "opacity-70",
              )}
              style={color ? { color } : undefined}>
              {text}
            </span>
          );
        })}
      </div>

      {reward && (
        <div className='mt-3'>
          <RewardIcons reward={reward} muted={!isNext} />
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

  // Nothing paid and nothing left to climb: the card would be an empty box on a
  // screen that is meant to be a reward.
  if (!paid && ahead.length === 0) return null;

  return (
    <div className={cn("rounded-lg bg-zinc-900/40 p-7 md:p-8", className)}>
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

          <div className='rounded-2xl bg-amber-500/10 p-5'>
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
        <div className='space-y-6'>
          <div className='flex items-baseline justify-between gap-4'>
            <h3 className='text-sm font-semibold text-zinc-300'>Coming up</h3>
            <span className='text-xs text-zinc-500'>you&apos;re level {lvl}</span>
          </div>

          {/* Held to a width instead of spanning the card. Stretched across a
              desktop the three stops sat so far apart that the connecting line
              became the biggest thing on the screen, and a trail should be the
              quietest part of a path. */}
          <div className='mx-auto flex max-w-2xl items-start overflow-x-auto pb-1 sm:overflow-x-visible'>
            {ahead.map((milestone, idx) => (
              <Stop
                key={milestone.lvl}
                milestone={milestone}
                points={points}
                isNext={idx === 0}
                showTrail={idx > 0}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
