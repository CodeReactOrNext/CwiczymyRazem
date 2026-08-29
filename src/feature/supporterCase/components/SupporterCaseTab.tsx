import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { RARITY_STYLES } from "feature/arsenal/components/RarityBadge";
import { SlateItemArt } from "feature/supporterCase/components/SlateItemArt";
import {
  useSlateVote,
  useSupporterCase,
} from "feature/supporterCase/hooks/useSupporterCase";
import type {
  SlateCandidate,
  SlateItem,
  SlateRarity,
  SlateSlot as Slot,
} from "feature/supporterCase/types/supporterCase.types";
import { SLATE_RARITIES } from "feature/supporterCase/types/supporterCase.types";
import { eligibleItems } from "feature/supporterCase/utils/slate";
import { SLATE_VOTE_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import {
  CalendarClock,
  ChevronUp,
  Package,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

const tokenWord = (count: number) => (count === 1 ? "token" : "tokens");

const ItemLine = ({ item }: { item: SlateItem }) => (
  <span className='block min-w-0'>
    <span className='block truncate text-sm font-bold text-zinc-100'>
      {item.name}
    </span>
    <span className='block truncate text-xs text-zinc-400'>
      {item.brand}
      {item.effectType && ` · ${item.effectType}`}
    </span>
  </span>
);

/**
 * One seat of the case: what is in it now, and where its vote stands.
 *
 * The six of these are also the ballot's navigation — a seat is picked here
 * and voted on below. Showing all six ballots at once stacked six searchable
 * pools of two dozen items down the page, so the thing the page is actually
 * about — the case, and what is winning each seat — was never on screen at the
 * same time as the vote.
 */
const SeatCard = ({
  slot,
  selected,
  onSelect,
}: {
  slot: Slot;
  selected: boolean;
  onSelect: () => void;
}) => {
  const styles = RARITY_STYLES[slot.rarity];
  const leader = slot.candidates[0];
  const mine = slot.candidates.reduce(
    (total, candidate) => total + candidate.mine,
    0,
  );

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-3 rounded-lg p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        selected ? "bg-zinc-800/50" : "bg-zinc-900/40 hover:bg-zinc-800/40",
      )}
      // The rarity's own colour draws the selected seat, so the ring, the
      // ballot heading below and the plates inside it all read as one colour.
      style={
        selected
          ? { boxShadow: `inset 0 0 0 1px ${styles.baseColor}66` }
          : undefined
      }>
      <span className='flex items-center justify-between gap-2'>
        <span
          className={cn("text-[10px] font-black tracking-widest", styles.text)}>
          {slot.rarity}
        </span>
        {mine > 0 && (
          <span className='shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300'>
            you {mine}
          </span>
        )}
      </span>

      {slot.current ? (
        <SlateItemArt
          item={slot.current}
          color={styles.baseColor}
          size={104}
          width='full'
        />
      ) : (
        <span className='flex h-[104px] w-full items-center justify-center rounded-md bg-zinc-950/40 text-xs text-zinc-500'>
          nothing in this seat
        </span>
      )}

      {slot.current && <ItemLine item={slot.current} />}

      {/* Pinned to the bottom so the six footers line up however long the
          names above them run. */}
      <span className='mt-auto flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-400'>
        {leader ? (
          <>
            <ChevronUp size={12} style={{ color: styles.baseColor }} />
            <span className='truncate'>
              next:{" "}
              <span className='font-bold text-zinc-200'>{leader.name}</span>
            </span>
          </>
        ) : (
          "no votes on this seat yet"
        )}
      </span>
    </button>
  );
};

/** A backed item, its tally, and the button that puts another token on it. */
const CandidateRow = ({
  candidate,
  rarity,
  leading,
  canVote,
  busy,
  onVote,
}: {
  candidate: SlateCandidate;
  rarity: SlateRarity;
  leading: boolean;
  canVote: boolean;
  busy: boolean;
  onVote: () => void;
}) => {
  const styles = RARITY_STYLES[rarity];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-2.5",
        leading ? "bg-white/[0.07]" : "bg-white/[0.03]",
      )}>
      <SlateItemArt
        item={candidate}
        color={styles.baseColor}
        size={58}
        width={92}
      />

      <div className='min-w-0 flex-1'>
        <ItemLine item={candidate} />

        <span className='mt-1 flex flex-wrap items-center gap-2'>
          <span className='flex items-center gap-1 text-xs tabular-nums text-zinc-400'>
            <SupportToken size={18} />
            <span className='font-bold' style={{ color: styles.baseColor }}>
              {candidate.tokens}
            </span>
          </span>

          {candidate.mine > 0 && (
            <span className='rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300'>
              you {candidate.mine}
            </span>
          )}

          {candidate.carried > 0 && (
            <span
              className='rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-bold text-zinc-400'
              title='Tokens left on this item by an earlier slate it did not win'>
              {candidate.carried} held over
            </span>
          )}

          {leading && (
            <span
              className='rounded px-1.5 py-0.5 text-[10px] font-black tracking-wider'
              style={{
                backgroundColor: `${styles.baseColor}1a`,
                color: styles.baseColor,
              }}>
              takes the seat
            </span>
          )}
        </span>
      </div>

      {/* Cyan, labelled and thumb-sized: the one thing on the row that does
          anything, and the same colour every other action in the app uses. */}
      <button
        type='button'
        disabled={!canVote || busy}
        onClick={onVote}
        title={`Spend ${SLATE_VOTE_COST} token on ${candidate.name}`}
        className='flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 text-sm font-bold text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 hover:bg-cyan-500/20 hover:text-cyan-200 sm:px-4'>
        <ChevronUp size={16} />
        Back
      </button>
    </div>
  );
};

/**
 * Everything of this rarity nobody has backed yet, behind one button.
 *
 * Folded away by default: the pool runs to a couple of dozen items per seat,
 * and the ballot itself — what people have actually voted for — is the part
 * worth reading first.
 */
const ItemPicker = ({
  slot,
  busy,
  onVote,
}: {
  slot: Slot;
  busy: boolean;
  onVote: (key: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const styles = RARITY_STYLES[slot.rarity];
  const backed = new Set(slot.candidates.map((candidate) => candidate.key));
  const rest = eligibleItems(slot.rarity).filter(
    (item) => !backed.has(item.key),
  );

  if (rest.length === 0) return null;

  // Name, brand and pedal type all read as "what is it", so the search covers
  // the three rather than making anyone guess which one it matches on.
  const needle = search.trim().toLowerCase();
  const matches = needle
    ? rest.filter((item) =>
        [item.name, item.brand, item.effectType ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : rest;

  return (
    <div className='space-y-3'>
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        className='flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white/[0.06] text-sm font-bold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/[0.12] hover:text-zinc-100'>
        {isOpen ? <X size={14} /> : <Plus size={14} />}
        {isOpen
          ? "Close the list"
          : `Back one of the other ${rest.length} ${slot.rarity} items`}
      </button>

      {isOpen && (
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${rest.length} ${slot.rarity} items…`}
            startIcon={<Search size={14} className='ml-1.5 text-zinc-400' />}
            className='h-9 border-none bg-white/5 text-sm'
          />

          {matches.length === 0 ? (
            <p className='py-4 text-center text-sm text-zinc-400'>
              Nothing matches “{search}”
            </p>
          ) : (
            // Scrolls inside itself so the seats above stay on screen while
            // somebody digs through the pool.
            <div className='grid max-h-[26rem] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3'>
              {matches.map((item) => (
                <button
                  key={item.key}
                  type='button'
                  disabled={busy}
                  onClick={() => onVote(item.key)}
                  title={`Spend ${SLATE_VOTE_COST} token on ${item.name}`}
                  className='group flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 hover:bg-white/[0.08]'>
                  <SlateItemArt
                    item={item}
                    color={styles.baseColor}
                    size={58}
                    width={92}
                  />
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-sm font-bold text-zinc-200'>
                      {item.name}
                    </span>
                    <span className='block truncate text-xs text-zinc-400'>
                      {item.effectType ?? item.brand}
                    </span>
                  </span>
                  {/* Not a nested button — the tile itself is the control; this
                      is what tells you the tile does something. */}
                  <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded bg-cyan-500/10 text-cyan-300 transition-colors group-hover:bg-cyan-500/20'>
                    <Plus size={15} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/** The open ballot for whichever seat is picked above. */
const SeatBallot = ({
  slot,
  wallet,
  canVote,
  busy,
  onVote,
}: {
  slot: Slot;
  wallet: SupporterWallet | undefined;
  canVote: boolean;
  busy: boolean;
  onVote: (key: string) => void;
}) => {
  const styles = RARITY_STYLES[slot.rarity];

  return (
    <section className='space-y-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h3 className={cn("text-sm font-black tracking-wide", styles.text)}>
          {slot.rarity} seat
        </h3>
        <p className='text-xs text-zinc-400'>
          {slot.current
            ? `${slot.current.name} holds it until the next slate`
            : "nothing holds it yet"}
        </p>
      </div>

      {slot.candidates.length === 0 ? (
        <p className='rounded-lg bg-white/[0.03] px-4 py-6 text-center text-sm text-zinc-400'>
          Nothing backed yet — the first token decides this seat.
        </p>
      ) : (
        <div className='space-y-2'>
          {slot.candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.key}
              candidate={candidate}
              rarity={slot.rarity}
              leading={index === 0}
              canVote={canVote}
              busy={busy}
              onVote={() => onVote(candidate.key)}
            />
          ))}
        </div>
      )}

      {canVote ? (
        <ItemPicker slot={slot} busy={busy} onVote={onVote} />
      ) : (
        // Only once the wallet is in: an empty one is worth saying, but a
        // wallet that has not loaded yet is nothing worth saying.
        wallet && (
          <p className='rounded-lg bg-white/[0.03] px-4 py-3 text-xs text-zinc-400'>
            No tokens left — another donation puts more in the wallet.
          </p>
        )
      )}
    </section>
  );
};

export const SupporterCaseTab = ({
  wallet,
  enabled,
}: {
  wallet: SupporterWallet | undefined;
  enabled: boolean;
}) => {
  const { data: state, isLoading } = useSupporterCase(enabled);
  const vote = useSlateVote();
  const [seat, setSeat] = useState<SlateRarity | null>(null);

  if (isLoading || !state) {
    return (
      <div className='space-y-8'>
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          {Array.from({ length: SLATE_RARITIES.length }, (_, index) => (
            <div
              key={index}
              className='h-[132px] animate-pulse rounded-lg bg-zinc-900/40'
            />
          ))}
        </div>
        <div className='h-64 animate-pulse rounded-lg bg-zinc-900/40' />
      </div>
    );
  }

  const tokensLeft = wallet?.left ?? 0;
  const canVote = state.isSupporter && tokensLeft >= SLATE_VOTE_COST;
  const open =
    state.slots.find((slot) => slot.rarity === seat) ?? state.slots[0];

  return (
    <div className='space-y-8'>
      <div className='space-y-4'>
        <div className='flex flex-wrap items-start justify-between gap-x-4 gap-y-2'>
          <div className='space-y-1'>
            <h2 className='flex items-center gap-2 text-sm font-bold text-zinc-200'>
              <Package size={15} className='text-amber-400' />
              In the case right now
            </h2>
            <p className='max-w-xl text-sm text-zinc-400'>
              One seat per rarity, and the seats never move — what the vote
              picks is which item sits in each, never how good the case is.
            </p>
          </div>

          <div className='flex shrink-0 items-center gap-2'>
            <span className='rounded bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-400'>
              {state.fameCost} Fame
            </span>
            <span className='inline-flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-xs text-zinc-300'>
              <CalendarClock size={13} className='text-zinc-400' />
              {state.daysLeft === 1
                ? "new slate tomorrow"
                : `new slate in ${state.daysLeft} days`}
            </span>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
          {state.slots.map((slot) => (
            <SeatCard
              key={slot.rarity}
              slot={slot}
              selected={slot.rarity === open?.rarity}
              onSelect={() => setSeat(slot.rarity)}
            />
          ))}
        </div>
      </div>

      {open && (
        <div className='space-y-4'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-sm font-bold text-zinc-200'>
              Vote the next slate in
            </h2>
            <p className='text-sm text-zinc-400'>
              <SupportToken size={18} className='inline-block align-middle' />{" "}
              {SLATE_VOTE_COST} a push, on the seat picked above.
              {state.myTokens > 0 &&
                ` ${state.myTokens} ${tokenWord(state.myTokens)} of yours ${
                  state.myTokens === 1 ? "is" : "are"
                } already on this ballot.`}
            </p>
            <p className='text-sm text-zinc-500'>
              When the slate turns over, only the winning item’s tokens are
              spent — everything backing the rest stays on the board for the
              next one. A vote that comes second is never a vote thrown away.
            </p>
          </div>

          <SeatBallot
            key={open.rarity}
            slot={open}
            wallet={wallet}
            canVote={canVote}
            busy={vote.isPending}
            onVote={(key) => vote.mutate({ rarity: open.rarity, key })}
          />
        </div>
      )}
    </div>
  );
};
