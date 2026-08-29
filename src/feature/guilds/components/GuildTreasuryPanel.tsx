import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
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
 * Deliberately not the fund bar. That bar is a pot with one destination and it
 * buys itself the moment it fills; this is a balance the guild is sitting on,
 * so the bar here is a *goal* — what the next thing costs — rather than a
 * purchase in progress, and crossing it changes nothing until somebody decides
 * to spend.
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
  /** What the guild is saving towards, if there is anything left to buy. */
  goal: { label: string; cost: number } | null;
  busy: boolean;
  onDeposit: (fame: number) => void;
  /** The control that spends the balance, for whoever is allowed to. */
  action?: ReactNode;
  className?: string;
}) => {
  const short = goal ? Math.max(0, goal.cost - treasury.fame) : 0;
  const amounts = offers(fame, short);
  const percent = goal
    ? Math.min(100, Math.round((treasury.fame / goal.cost) * 100))
    : 100;

  return (
    <section
      className={cn("space-y-4 rounded-lg bg-zinc-900/40 p-6", className)}>
      <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2'>
        <div>
          <h2 className='text-sm font-bold text-zinc-200'>
            The guild&apos;s Fame
          </h2>
          <p className='mt-1 flex items-baseline gap-2'>
            <span className='text-2xl font-bold tabular-nums text-amber-400'>
              {treasury.fame.toLocaleString()}
            </span>
            {treasury.spent > 0 && (
              <span className='text-xs text-zinc-500'>
                {treasury.spent.toLocaleString()} spent so far
              </span>
            )}
          </p>
        </div>

        <p className='text-right text-xs text-zinc-500'>
          {goal ? (
            <>
              <span className='font-semibold text-zinc-300'>{goal.label}</span>{" "}
              costs{" "}
              <span className='tabular-nums'>{goal.cost.toLocaleString()}</span>
              {short > 0 && (
                <>
                  {" · "}
                  <span className='tabular-nums text-zinc-400'>
                    {short.toLocaleString()} to go
                  </span>
                </>
              )}
            </>
          ) : (
            "Nothing left to save for"
          )}
        </p>
      </div>

      {goal && (
        <div
          role='progressbar'
          aria-valuenow={Math.min(treasury.fame, goal.cost)}
          aria-valuemin={0}
          aria-valuemax={goal.cost}
          aria-label={`${goal.label} — ${treasury.fame} of ${goal.cost} Fame saved`}
          className='h-2 overflow-hidden rounded-full bg-zinc-800/70'>
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500",
              short === 0 ? "bg-emerald-400" : "bg-amber-400/80",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      <div className='flex flex-wrap items-center gap-2'>
        {amounts.length === 0 ? (
          <p className='text-xs text-zinc-500'>
            Nothing in your own Fame to put in this time.
          </p>
        ) : (
          <>
            <span className='text-xs text-zinc-500'>Put in</span>
            {amounts.map((amount) => (
              <Button
                key={amount}
                size='sm'
                variant='ghost'
                disabled={busy}
                onClick={() => onDeposit(amount)}
                className='text-amber-300 hover:text-amber-200'>
                <span className='flex items-center gap-1.5'>
                  <img
                    src='/images/coin.png'
                    alt=''
                    className='h-4 w-4 object-contain'
                  />
                  {amount.toLocaleString()}
                  {amount === short && short > 0 && " · finish it"}
                </span>
              </Button>
            ))}
            <span className='text-xs text-zinc-600'>
              of your {fame.toLocaleString()}
            </span>
          </>
        )}
      </div>

      {action}

      <Depositors treasury={treasury} members={members} />
    </section>
  );
};
