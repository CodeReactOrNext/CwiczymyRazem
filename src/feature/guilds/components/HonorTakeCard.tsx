import { cn } from "assets/lib/utils";
import { DexMarks } from "feature/arsenal/components/DexMarks";
import type { DexStatus } from "feature/arsenal/utils/dex";
import { HonorMark } from "feature/guilds/components/HonorMark";
import type { StashEntry } from "feature/guilds/types/stash.types";
import { TAKE_HONOR_COST } from "feature/guilds/utils/guildHonor.utils";

/**
 * The moment before a piece leaves the shelf: what it costs, what you have.
 *
 * Taking used to be one click, because it was free. It is priced now, and a
 * price a member only finds out about from the error afterwards is a price
 * they were not asked to pay — so the shelf stops and says it first. One
 * button, one number, and the balance it comes out of.
 */
export const HonorTakeCard = ({
  entry,
  dexStatus,
  balance,
  busy = false,
  onConfirm,
}: {
  entry: StashEntry;
  /**
   * Where the model stands with the taker — owned already, or on the Dex.
   * Absent for parts and mods, which are not collected.
   */
  dexStatus?: DexStatus;
  /** The taker's honor right now. */
  balance: number;
  busy?: boolean;
  onConfirm: () => void;
}) => {
  const cost = TAKE_HONOR_COST;
  const short = Math.max(0, cost - balance);
  const canPay = short === 0;

  return (
    <div className='flex flex-col gap-6 rounded-lg bg-zinc-900 p-6'>
      <div className='space-y-1'>
        <p className='text-[11px] font-semibold text-zinc-500'>
          {entry.rarity ? `${entry.rarity} · ` : ""}
          left by {entry.depositedByName || "a member"}
        </p>
        <h3 className='text-xl font-black text-zinc-100'>{entry.name}</h3>
        {/* Said before the price, not after the take: honor spent on a second
            copy of something already in the cabinet is honor the member
            should have chosen to spend. */}
        {dexStatus && <DexMarks status={dexStatus} className='pt-1' />}
      </div>

      <div className='flex items-end justify-between gap-6'>
        <div>
          <p className='text-xs text-zinc-500'>Costs</p>
          <p className='mt-1 flex items-center gap-2 text-3xl font-black tabular-nums text-purple-300'>
            <HonorMark size={32} />
            {cost}
          </p>
        </div>
        <div className='text-right'>
          <p className='text-xs text-zinc-500'>Your honor</p>
          <p
            className={cn(
              "mt-1 text-xl font-bold tabular-nums",
              canPay ? "text-zinc-100" : "text-orange-400",
            )}>
            {balance.toLocaleString()}
          </p>
        </div>
      </div>

      <button
        type='button'
        onClick={onConfirm}
        disabled={busy || !canPay}
        className={cn(
          "rounded-lg px-4 py-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40",
          "bg-purple-500/15 text-purple-200 hover:bg-purple-500/25",
        )}>
        {canPay ? `Take it for ${cost} honor` : `${short} honor short`}
      </button>

      {!canPay && (
        <p className='text-xs leading-relaxed text-zinc-500'>
          Honor is earned by putting into the guild: Fame into the bank, tokens
          into a pot, or gear onto this shelf.
        </p>
      )}
    </div>
  );
};
