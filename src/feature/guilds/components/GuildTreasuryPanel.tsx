import {
  GuildSpendPanel,
  PledgeButton,
} from "feature/guilds/components/GuildSpendPanel";
import type {
  GuildMember,
  GuildTreasury,
} from "feature/guilds/types/guild.types";
import { rankDepositors } from "feature/guilds/utils/guildTreasury.utils";
import type { ReactNode } from "react";

/**
 * The guild's own Fame: what it holds, who put it there, and the way to add to
 * it.
 *
 * Deliberately not an upgrade pot. That pot has one destination and buys
 * itself the moment it fills; this is a balance the guild is sitting on, and
 * the bar here — when there is one — is a *quest* the balance counts towards,
 * not a purchase in progress. Drawn as the same `GuildSpendPanel` as the pots,
 * in Fame's own amber, so it reads as "money goes in here" at a glance and as
 * "not a token upgrade" a moment later.
 *
 * Amounts are offered rather than typed, because the useful ones are the round
 * handful, everything you have, and exactly what the guild is still short —
 * and an input box is mostly a way to fat-finger the third.
 */

/** The round amounts offered before "what it still needs". */
const HANDFULS = [50, 200];

const offers = (fame: number, short: number): number[] => {
  const amounts = [...new Set([...HANDFULS, short])]
    .filter((amount) => amount > 0 && amount <= fame)
    .sort((a, b) => a - b);

  // Nothing round fits the wallet, but there is something in it. A member
  // holding thirty Fame should be able to put thirty in rather than be told to
  // come back richer.
  if (amounts.length === 0 && fame > 0) return [fame];

  return amounts;
};

const Depositors = ({
  treasury,
  members,
}: {
  treasury: GuildTreasury;
  members: GuildMember[];
}) => {
  const paid = rankDepositors(treasury);
  if (paid.length === 0) return null;

  const named = (uid: string) =>
    members.find((member) => member.uid === uid)?.displayName ??
    "a member who left";

  return (
    <p className='text-xs text-zinc-500'>
      Filled by{" "}
      {paid.slice(0, 6).map(({ uid, fame }, index) => (
        <span key={uid}>
          {index > 0 && ", "}
          <span className='font-semibold text-zinc-400'>{named(uid)}</span>{" "}
          {fame.toLocaleString()}
        </span>
      ))}
      {paid.length > 6 && ` and ${paid.length - 6} more`}
    </p>
  );
};

export const GuildTreasuryPanel = ({
  treasury,
  members,
  fame,
  goal,
  saved,
  busy,
  onDeposit,
  action,
  className,
}: {
  treasury: GuildTreasury;
  /** The roster, to put names to the deposits. */
  members: GuildMember[];
  /** The caller's own Fame — a deposit comes out of it. */
  fame: number;
  /** What the guild is saving towards, if there is anything to save for. */
  goal: { label: string; cost: number } | null;
  /**
   * What counts towards the goal, when it is not the balance — a quest counts
   * everything ever put in, which outlives whatever an older guild once spent.
   */
  saved?: number;
  busy: boolean;
  onDeposit: (fame: number) => void;
  /** Whatever acts on the balance, for whoever is allowed to. */
  action?: ReactNode;
  className?: string;
}) => {
  const towards = saved ?? treasury.fame;
  const short = goal ? Math.max(0, goal.cost - towards) : 0;
  const amounts = offers(fame, short);

  return (
    <GuildSpendPanel
      currency='fame'
      title="The guild's Fame"
      blurb={
        goal ? (
          <>
            Counting towards{" "}
            <span className='font-semibold text-zinc-200'>{goal.label}</span>.
          </>
        ) : (
          "Counts towards the guild's quests, never spent."
        )
      }
      have={goal ? towards : treasury.fame}
      need={goal ? goal.cost : null}
      className={className}>
      {/* One row: who has already filled it on the left, the ways to put in
          on the right — `ml-auto` rather than `justify-between` so the
          buttons still land on the right with nobody having paid in yet. */}
      <div className='flex flex-wrap items-center gap-3'>
        <Depositors treasury={treasury} members={members} />

        {amounts.length === 0 ? (
          <p className='ml-auto text-xs text-zinc-500'>
            Nothing in your own Fame this time.
          </p>
        ) : (
          <div
            title={`You have ${fame.toLocaleString()} Fame`}
            className='ml-auto flex flex-wrap items-center justify-end gap-2'>
            {amounts.map((amount) => (
              <PledgeButton
                key={amount}
                currency='fame'
                amount={amount}
                finishes={amount === short && short > 0}
                disabled={busy}
                onClick={() => onDeposit(amount)}
              />
            ))}
          </div>
        )}
      </div>

      {action}

      {goal && treasury.fame !== towards && (
        <p className='text-xs text-zinc-500'>
          {treasury.fame.toLocaleString()} Fame in the bank right now
          {treasury.spent > 0 &&
            `, ${treasury.spent.toLocaleString()} spent back when it could be`}
          .
        </p>
      )}
    </GuildSpendPanel>
  );
};
