import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { GoalIcon } from "feature/guilds/components/GoalIcon";
import { GuildChallengeCard } from "feature/guilds/components/GuildChallengeCard";
import { GuildTreasuryPanel } from "feature/guilds/components/GuildTreasuryPanel";
import type { GuildChallengeTier } from "feature/guilds/data/guildChallengeTiers";
import {
  GUILD_CHALLENGE_LEVELS,
  GUILD_CHALLENGE_TIERS,
  nextChallengeTier,
  tierCost,
  tierLevel,
} from "feature/guilds/data/guildChallengeTiers";
import { objectiveLine } from "feature/guilds/data/guildMetrics";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { Guild, GuildChallenge } from "feature/guilds/types/guild.types";
import { Check, Lock } from "lucide-react";

/**
 * The guild's week, the Fame it is sitting on, and the ladder of ranks that
 * Fame can buy.
 *
 * The ladder is drawn as levels, because that is what it is: one row per rank,
 * numbered, the ones behind you marked done, the one you are on lit, and the
 * ones above locked with a price on them. What a level buys is *work* rather
 * than a perk, so a step leads with the goals it adds and only then with what
 * it pays. That order is deliberate: taking a rank on raises the week for every
 * member, and a week the guild cannot clear costs the streak.
 */

type StepState = "passed" | "worn" | "next" | "locked";

/** The numbered plate that makes the ladder read as levels rather than a shop. */
const StepPlate = ({
  tier,
  state,
}: {
  tier: GuildChallengeTier;
  state: StepState;
}) => (
  <span
    aria-label={`Level ${tierLevel(tier)}`}
    className={cn(
      "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg",
      state === "passed" && "bg-emerald-500/10 text-emerald-400",
      state === "worn" && "bg-cyan-500/10 text-cyan-300",
      state === "next" && "bg-zinc-800/60 text-zinc-300",
      state === "locked" && "bg-zinc-800/40 text-zinc-500",
    )}>
    {state === "passed" ? (
      <Check size={18} />
    ) : state === "locked" ? (
      <Lock size={15} />
    ) : (
      <>
        <span className='text-[9px] leading-none opacity-70'>lvl</span>
        <span className='text-lg font-bold tabular-nums leading-tight'>
          {tierLevel(tier)}
        </span>
      </>
    )}
  </span>
);

const StatusLine = ({
  state,
  cost,
}: {
  state: StepState;
  cost: number | null;
}) => {
  if (state === "worn") {
    return (
      <span className='shrink-0 text-xs font-bold text-cyan-300'>
        you are here
      </span>
    );
  }
  if (state === "passed") {
    return <span className='shrink-0 text-xs text-zinc-500'>behind you</span>;
  }
  if (cost === null) return null;

  return (
    <span className='flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-zinc-400'>
      <FameCoin size={13} />
      {cost.toLocaleString()} Fame
    </span>
  );
};

const Step = ({
  tier,
  state,
}: {
  tier: GuildChallengeTier;
  state: StepState;
}) => (
  <div
    className={cn(
      "flex gap-4 rounded-lg p-4 transition-background",
      state === "worn" ? "bg-cyan-500/[0.08]" : "bg-zinc-900/40",
      state === "locked" && "opacity-70",
    )}>
    <StepPlate tier={tier} state={state} />

    <div className='min-w-0 flex-1 space-y-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <p className='text-sm font-bold text-zinc-100'>{tier.name}</p>
        <StatusLine state={state} cost={tierCost(tier)} />
      </div>

      <p className='text-xs leading-relaxed text-zinc-500'>{tier.blurb}</p>

      <div className='flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5'>
        {tier.objectives.map((objective) => (
          <span
            key={objective.metric}
            className='flex items-center gap-1.5 text-xs text-zinc-300'>
            <GoalIcon metric={objective.metric} size={13} />
            {objectiveLine(objective.metric, objective.perMember)}
          </span>
        ))}
      </div>

      {tier.reward > 0 && (
        <p className='flex items-center gap-1.5 pt-0.5 text-xs text-zinc-500'>
          <FameCoin size={13} />
          <span>
            <span className='font-bold text-amber-400'>
              +{tier.reward} Fame
            </span>{" "}
            a member, every week it is cleared
          </span>
        </p>
      )}
    </div>
  </div>
);

/**
 * The control that spends the treasury, and — for everybody who is not the
 * founder — the sentence that says why there isn't one.
 *
 * A member who cannot press it is told what the guild is waiting on rather than
 * shown a disabled button, because "the founder decides" and "we are 200 Fame
 * short" are different situations with different things to do about them.
 */
const TakeItOn = ({
  next,
  cost,
  saved,
  isFounder,
  busy,
  onBuy,
}: {
  next: GuildChallengeTier;
  cost: number;
  saved: number;
  isFounder: boolean;
  busy: boolean;
  onBuy: () => void;
}) => {
  const short = Math.max(0, cost - saved);

  if (!isFounder) {
    return (
      <p className='text-sm text-zinc-400'>
        {short > 0
          ? `${short.toLocaleString()} more Fame in the guild's and the founder can take on level ${tierLevel(next)}.`
          : `The guild can afford ${next.name} — the founder is the one who takes it on.`}
      </p>
    );
  }

  return (
    <div className='flex flex-wrap items-center gap-3'>
      <Button
        size='sm'
        disabled={busy || short > 0}
        onClick={onBuy}
        className='bg-amber-500 text-zinc-900 hover:bg-amber-400'>
        <span className='flex items-center gap-1.5'>
          <FameCoin size={16} />
          Take on {next.name} · {cost.toLocaleString()} Fame
        </span>
      </Button>
      <span className='text-xs text-zinc-500'>
        {short > 0
          ? `${short.toLocaleString()} short`
          : "Raises the week for every member, from then on."}
      </span>
    </div>
  );
};

export const GuildChallengeTab = ({
  guild,
  challenge,
  fame,
  isFounder,
}: {
  guild: Guild;
  challenge: GuildChallenge;
  /** The caller's own Fame — a deposit comes out of it. */
  fame: number;
  isFounder: boolean;
}) => {
  const { claimChallenge, depositFame, buyChallengeTier } = useGuildMutations();
  const busy =
    claimChallenge.isPending ||
    depositFame.isPending ||
    buyChallengeTier.isPending;

  const next = nextChallengeTier(guild.challengeTier);
  const nextCost = next ? tierCost(next) : null;

  const stateOf = (tier: GuildChallengeTier): StepState => {
    if (tier.id === guild.challengeTier) return "worn";
    if (tier.id < guild.challengeTier) return "passed";
    return tier.id === guild.challengeTier + 1 ? "next" : "locked";
  };

  return (
    <div className='space-y-8'>
      <GuildChallengeCard
        challenge={challenge}
        memberCount={guild.memberCount}
        busy={busy}
        onClaim={() => claimChallenge.mutate()}
      />

      <GuildTreasuryPanel
        treasury={guild.treasury}
        members={guild.members}
        fame={fame}
        goal={
          next && nextCost !== null
            ? {
                label: `level ${tierLevel(next)} · ${next.name}`,
                cost: nextCost,
              }
            : null
        }
        busy={busy}
        onDeposit={(amount) => depositFame.mutate(amount)}
        action={
          next && nextCost !== null ? (
            <TakeItOn
              next={next}
              cost={nextCost}
              saved={guild.treasury.fame}
              isFounder={isFounder}
              busy={busy}
              onBuy={() => buyChallengeTier.mutate()}
            />
          ) : (
            <p className='text-sm text-zinc-400'>
              The guild is on the hardest week there is.
            </p>
          )
        }
      />

      <section className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-2'>
          <div className='space-y-1'>
            <h2 className='text-sm font-bold text-zinc-200'>The rank ladder</h2>
            <p className='max-w-2xl text-xs leading-relaxed text-zinc-500'>
              Every level is permanent, is paid for out of the guild&apos;s own
              Fame, and is dearer than the one below it. Each one adds a goal to
              the week — or makes one bigger — and every goal is asked of every
              member. Clear all of them together and each member who did their
              own share claims the Fame, once a week.
            </p>
          </div>

          <p className='text-xs tabular-nums text-zinc-500'>
            level{" "}
            <span className='font-bold text-cyan-300'>
              {guild.challengeTier + 1}
            </span>{" "}
            of {GUILD_CHALLENGE_LEVELS}
          </p>
        </div>

        <div className='space-y-2'>
          {GUILD_CHALLENGE_TIERS.map((tier) => (
            <Step key={tier.id} tier={tier} state={stateOf(tier)} />
          ))}
        </div>
      </section>
    </div>
  );
};
