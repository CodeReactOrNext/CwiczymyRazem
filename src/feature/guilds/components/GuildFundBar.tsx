import {
  GuildSpendPanel,
  PledgeButton,
} from "feature/guilds/components/GuildSpendPanel";
import type { GuildFund, GuildMember } from "feature/guilds/types/guild.types";
import type { ReactNode } from "react";

/**
 * The pot for something the guild is outgrowing, and the way to put into it.
 *
 * One panel for both tracks — seats and shelf rows — because they are the same
 * bargain: a price that climbs with every step, paid by whoever in the room has
 * tokens spare this month. The bar is the point of the whole mechanic. A button
 * that says "buy" asks one member to carry a purchase alone; a bar that says
 * "seven of twelve" asks the guild, and anybody can be the one who finishes it.
 *
 * Amounts are offered rather than typed, and the largest one is always exactly
 * what is left owing: the server clamps a contribution to the remainder anyway,
 * so an input box could only ever be a way of getting that wrong.
 *
 * Drawn as a `GuildSpendPanel`, the same box every other place a guild pays
 * into wears, so an upgrade is recognised as an upgrade wherever it sits.
 */

interface GuildFundBarProps {
  fund: GuildFund;
  /** What the track is, as the panel's title: "More seats", "Another shelf row". */
  title: ReactNode;
  /** Where the guild stands now, e.g. "Room for 2 more". */
  standing: ReactNode;
  /** What the next step adds, e.g. "3 more seats". */
  buys: string;
  /** Said in place of the bar once the track has nowhere left to go. */
  maxed: string;
  /** The roster, to put names to the pledges. */
  members: GuildMember[];
  tokensLeft: number;
  busy: boolean;
  onPledge: (tokens: number) => void;
  className?: string;
}

/** 1, 5, and whatever finishes it — minus anything the wallet cannot cover. */
const offers = (owed: number, tokensLeft: number): number[] =>
  [...new Set([1, 5, owed])]
    .filter((amount) => amount > 0 && amount <= owed && amount <= tokensLeft)
    .sort((a, b) => a - b);

const Patrons = ({
  pledges,
  members,
}: {
  pledges: Record<string, number>;
  members: GuildMember[];
}) => {
  const paid = Object.entries(pledges)
    .filter(([, tokens]) => tokens > 0)
    .sort((a, b) => b[1] - a[1]);

  if (paid.length === 0) return null;

  const named = (uid: string) =>
    members.find((member) => member.uid === uid)?.displayName ??
    "a member who left";

  return (
    <p className='text-xs text-zinc-500'>
      Paid for by{" "}
      {paid.slice(0, 6).map(([uid, tokens], index) => (
        <span key={uid}>
          {index > 0 && ", "}
          <span className='font-semibold text-zinc-400'>{named(uid)}</span>{" "}
          {tokens}
        </span>
      ))}
      {paid.length > 6 && ` and ${paid.length - 6} more`}
    </p>
  );
};

export const GuildFundBar = ({
  fund,
  title,
  standing,
  buys,
  maxed,
  members,
  tokensLeft,
  busy,
  onPledge,
  className,
}: GuildFundBarProps) => {
  if (fund.cost === null) {
    return (
      <GuildSpendPanel
        currency='tokens'
        title={title}
        blurb={
          <>
            {standing} · {maxed}.
          </>
        }
        have={fund.pot}
        need={null}
        className={className}>
        <Patrons pledges={fund.pledges} members={members} />
      </GuildSpendPanel>
    );
  }

  const owed = Math.max(0, fund.cost - fund.pot);
  const amounts = offers(owed, tokensLeft);

  return (
    <GuildSpendPanel
      currency='tokens'
      title={title}
      blurb={`Next step: ${buys}.`}
      have={fund.pot}
      need={fund.cost}
      className={className}>
      {/* One row: who has already put in on the left, the ways to put in on
          the right — `ml-auto` rather than `justify-between` so the buttons
          still land on the right with nothing on the left at all. */}
      <div className='flex flex-wrap items-center gap-3'>
        <Patrons pledges={fund.pledges} members={members} />

        {amounts.length === 0 ? (
          <p className='ml-auto text-xs text-zinc-500'>
            Nothing left in your wallet this time.
          </p>
        ) : (
          <div
            title={`You have ${tokensLeft.toLocaleString()} tokens`}
            className='ml-auto flex flex-wrap items-center justify-end gap-2'>
            {amounts.map((amount) => (
              <PledgeButton
                key={amount}
                currency='tokens'
                amount={amount}
                finishes={amount === owed && owed > 1}
                disabled={busy}
                onClick={() => onPledge(amount)}
              />
            ))}
          </div>
        )}
      </div>
    </GuildSpendPanel>
  );
};
