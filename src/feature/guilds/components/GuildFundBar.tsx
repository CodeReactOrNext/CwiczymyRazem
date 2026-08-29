import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import type { GuildFund, GuildMember } from "feature/guilds/types/guild.types";
import type { ReactNode } from "react";

/**
 * The pot for something the guild is outgrowing, and the way to put into it.
 *
 * One bar for both tracks — seats and shelf rows — because they are the same
 * bargain: a price that climbs with every step, paid by whoever in the room has
 * tokens spare this month. The bar is the point of the whole mechanic. A button
 * that says "buy" asks one member to carry a purchase alone; a bar that says
 * "seven of twelve" asks the guild, and anybody can be the one who finishes it.
 *
 * Amounts are offered rather than typed, and the largest one is always exactly
 * what is left owing: the server clamps a contribution to the remainder anyway,
 * so an input box could only ever be a way of getting that wrong.
 */

interface GuildFundBarProps {
  fund: GuildFund;
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
      <div className={cn("rounded-lg bg-white/[0.03] px-4 py-3", className)}>
        <p className='text-xs text-zinc-500'>
          <span className='font-semibold text-zinc-300'>{standing}</span> ·{" "}
          {maxed}
        </p>
        <Patrons pledges={fund.pledges} members={members} />
      </div>
    );
  }

  const owed = Math.max(0, fund.cost - fund.pot);
  const amounts = offers(owed, tokensLeft);

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg bg-white/[0.03] px-4 py-4",
        className,
      )}>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <p className='text-xs text-zinc-500'>
          <span className='font-semibold text-zinc-300'>{standing}</span> ·{" "}
          {buys} next
        </p>
        <p className='flex items-center gap-1.5 text-xs tabular-nums text-zinc-500'>
          <SupportToken size={16} />
          <span className='font-semibold text-cyan-300'>{fund.pot}</span>
          of {fund.cost} together
        </p>
      </div>

      <div
        role='progressbar'
        aria-valuenow={fund.pot}
        aria-valuemin={0}
        aria-valuemax={fund.cost}
        aria-label={`${buys} — ${fund.pot} of ${fund.cost} tokens in`}
        className='h-2 overflow-hidden rounded-full bg-zinc-800/70'>
        <div
          className='h-full rounded-full bg-cyan-500/80 transition-[width] duration-500'
          style={{ width: `${Math.round((fund.pot / fund.cost) * 100)}%` }}
        />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {amounts.length === 0 ? (
          <p className='text-xs text-zinc-500'>
            {owed} to go — nothing left in your wallet for it this time.
          </p>
        ) : (
          <>
            {amounts.map((amount) => (
              <Button
                key={amount}
                size='sm'
                variant='ghost'
                disabled={busy}
                onClick={() => onPledge(amount)}
                className='text-cyan-300 hover:text-cyan-200'>
                <span className='flex items-center gap-1.5'>
                  <SupportToken size={18} />
                  {amount === owed && owed > 1
                    ? `${amount} · finish it`
                    : amount}
                </span>
              </Button>
            ))}
            <span className='text-xs text-zinc-500'>{owed} to go</span>
          </>
        )}
      </div>

      <Patrons pledges={fund.pledges} members={members} />
    </div>
  );
};
