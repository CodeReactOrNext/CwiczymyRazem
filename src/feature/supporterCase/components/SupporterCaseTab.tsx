import { Chip } from "assets/components/ui/chip";
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
import { VotePill } from "feature/supporterPanel/components/VotePill";
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
 * One seat of the case: what is in it now, and what is about to take it.
 *
 * The six of these are also the ballot's navigation — a seat is picked here
 * and voted on below. Everything on the card is a picture or a name: the art
 * of what is in the seat, an arrow to whatever is winning, and the reader's
 * own tokens as the token glyph rather than a sentence about them.
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
      {/* Fixed height: the token count only shows on some seats, and a row
          that grows with it left the six artworks sitting at two heights. */}
      <span className='flex h-5 items-center justify-between gap-2'>
        <span
          className={cn("text-[10px] font-black tracking-widest", styles.text)}>
          {slot.rarity}
        </span>
        {mine > 0 && (
          <span
            title={`${mine} of your tokens are on this seat`}
            className='flex shrink-0 items-center gap-1 text-[11px] font-bold tabular-nums text-cyan-300'>
            <SupportToken size={13} />
            {mine}
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
        <span className='flex h-[104px] w-full items-center justify-center rounded-lg bg-zinc-950/40 text-xs text-zinc-500'>
          empty
        </span>
      )}

      {slot.current && <ItemLine item={slot.current} />}

      {/* Pinned to the bottom so the six footers line up however long the
          names above them run. */}
      <span className='mt-auto flex min-w-0 items-center gap-1.5 text-[11px]'>
        {leader ? (
          <>
            <ChevronUp
              size={13}
              className='shrink-0'
              style={{ color: styles.baseColor }}
            />
            <span
              title={`${leader.name} is winning this seat`}
              className='truncate font-bold text-zinc-200'>
              {leader.name}
            </span>
          </>
        ) : (
          <span className='text-zinc-500'>no votes yet</span>
        )}
      </span>
    </button>
  );
};

/**
 * A backed item and everything riding on it.
 *
 * The rank is the whole explanation: whatever sits at 1 when the slate turns
 * over is what the case draws. The count, the reader's own share of it and the
 * button that adds to it are one control — the same `VotePill` the roadmap and
 * the gear board spend tokens through.
 */
const CandidateRow = ({
  candidate,
  rank,
  rarity,
  tokensLeft,
  busy,
  onVote,
}: {
  candidate: SlateCandidate;
  rank: number;
  rarity: SlateRarity;
  tokensLeft: number;
  busy: boolean;
  onVote: () => void;
}) => {
  const styles = RARITY_STYLES[rarity];
  const leading = rank === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg p-2.5",
        leading ? "bg-white/[0.07]" : "bg-white/[0.03]",
      )}>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black tabular-nums",
          !leading && "text-zinc-500",
        )}
        style={
          leading
            ? { backgroundColor: styles.baseColor, color: "#09090b" }
            : undefined
        }>
        {rank}
      </span>

      <SlateItemArt
        item={candidate}
        color={styles.baseColor}
        size={58}
        width={92}
      />

      <div className='min-w-0 flex-1'>
        <ItemLine item={candidate} />
      </div>

      <VotePill
        total={candidate.tokens}
        mine={candidate.mine}
        tokensLeft={tokensLeft}
        busy={busy}
        what='item'
        name={candidate.name}
        accent={styles.baseColor}
        onBack={onVote}
      />
    </div>
  );
};

/**
 * Everything of this rarity nobody has backed yet.
 *
 * Folded away once the ballot has something on it — the pool runs to a couple
 * of dozen items per seat, and what people have actually voted for is the part
 * worth reading first. On an empty seat the pool *is* the ballot, so it opens
 * straight away rather than hiding behind a button and an empty-state line.
 */
const ItemPicker = ({
  slot,
  busy,
  canVote,
  onVote,
}: {
  slot: Slot;
  busy: boolean;
  canVote: boolean;
  onVote: (key: string) => void;
}) => {
  const empty = slot.candidates.length === 0;
  const [isOpen, setIsOpen] = useState(empty);
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
      {!empty && (
        <button
          type='button'
          onClick={() => setIsOpen((open) => !open)}
          className='flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-white/[0.06] text-sm font-bold text-zinc-200 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-white/[0.12] hover:text-zinc-100'>
          {isOpen ? <X size={14} /> : <Plus size={14} />}
          {isOpen ? "Close" : `${rest.length} more ${slot.rarity} items`}
        </button>
      )}

      {(isOpen || empty) && (
        <>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${slot.rarity} items…`}
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
                  disabled={busy || !canVote}
                  onClick={() => onVote(item.key)}
                  title={
                    canVote
                      ? `Back ${item.name}`
                      : "Nothing left in your wallet to spend"
                  }
                  // Dimmed rather than deaf: an empty wallet still gets to
                  // read the pool, and the tooltip says why the tile will
                  // not move — which `pointer-events-none` would swallow.
                  className='group flex items-center gap-2.5 rounded-lg bg-white/[0.03] p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/[0.08] disabled:hover:bg-white/[0.03]'>
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
  tokensLeft,
  canVote,
  busy,
  onVote,
}: {
  slot: Slot;
  tokensLeft: number;
  canVote: boolean;
  busy: boolean;
  onVote: (key: string) => void;
}) => {
  const styles = RARITY_STYLES[slot.rarity];

  return (
    <section className='space-y-5 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
        <h2 className={cn("text-sm font-black tracking-wide", styles.text)}>
          {slot.rarity} seat
        </h2>
        <p className='text-xs text-zinc-400'>
          {slot.current
            ? `back what replaces ${slot.current.name}`
            : "back what fills it"}
        </p>
      </div>

      {slot.candidates.length > 0 && (
        <div className='space-y-2'>
          {slot.candidates.map((candidate, index) => (
            <CandidateRow
              key={candidate.key}
              candidate={candidate}
              rank={index + 1}
              rarity={slot.rarity}
              tokensLeft={canVote ? tokensLeft : 0}
              busy={busy}
              onVote={() => onVote(candidate.key)}
            />
          ))}
        </div>
      )}

      <ItemPicker slot={slot} busy={busy} canVote={canVote} onVote={onVote} />
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
              className='h-[240px] animate-pulse rounded-lg bg-zinc-900/40'
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
              Six items, one per rarity. Pick a seat and back what you want in
              it next.
            </p>
          </div>

          <Chip color='gray' className='shrink-0'>
            <CalendarClock size={13} className='text-zinc-400' />
            {state.daysLeft === 1
              ? "changes tomorrow"
              : `changes in ${state.daysLeft} days`}
          </Chip>
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
        <SeatBallot
          key={open.rarity}
          slot={open}
          tokensLeft={tokensLeft}
          canVote={canVote}
          busy={vote.isPending}
          onVote={(key) => vote.mutate({ rarity: open.rarity, key })}
        />
      )}
    </div>
  );
};
