import { cn } from "assets/lib/utils";
import { BoardPieceTile } from "feature/arsenal/components/Collection/BoardPieceTile";
import { StashBoard } from "feature/arsenal/components/Collection/StashBoard";
import { StashItemDialog } from "feature/arsenal/components/Collection/StashItemDialog";
import type { StashPlacement } from "feature/arsenal/components/Collection/StashTile";
import { useUpdateStashLayout } from "feature/arsenal/hooks/useUpdateStashLayout";
import type { ScrapPart } from "feature/arsenal/types/arsenal.types";
import type { BoardPiece } from "feature/arsenal/utils/boardPieces";
import {
  guitarPiece,
  modPieces,
  partPiece,
  partPieces,
  pedalPiece,
} from "feature/arsenal/utils/boardPieces";
import type { StashLayout } from "feature/arsenal/utils/stashLayout";
import {
  columnOf,
  resolveLayout,
  rowOf,
} from "feature/arsenal/utils/stashLayout";
import { GuildFundBar } from "feature/guilds/components/GuildFundBar";
import { PartAmountCard } from "feature/guilds/components/PartAmountCard";
import type {
  ShelfBoard,
  ShelfBoardId,
} from "feature/guilds/components/useShelfDrag";
import { useShelfDrag } from "feature/guilds/components/useShelfDrag";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import {
  useGuildStash,
  useMyGear,
  useStashMutations,
} from "feature/guilds/hooks/useGuildStash";
import type { Guild } from "feature/guilds/types/guild.types";
import type { StashEntry, StashTally } from "feature/guilds/types/stash.types";
import { shelfRowsUsed } from "feature/guilds/utils/guildShelf.utils";
import { GUILD_MAX_STASH_ROWS } from "feature/guilds/utils/guildUpgrades.utils";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";

/**
 * One entry on the shelf as a socket, keyed by the entry rather than the item.
 *
 * The id is what `take` is called with, and a part stack that two members both
 * topped up has no single item id to speak of anyway.
 */
const entryPiece = (entry: StashEntry): BoardPiece => {
  if (entry.kind === "guitar")
    return { ...guitarPiece(entry.item), id: entry.id };
  if (entry.kind === "effect")
    return { ...pedalPiece(entry.item), id: entry.id };
  if (entry.kind === "part") return { ...partPiece(entry.item), id: entry.id };
  return {
    id: entry.id,
    tall: false,
    kind: "mod",
    mod: entry.item,
    name: entry.name,
  };
};

/** A stack of parts stopped on its way across, waiting on an amount. */
type AmountPrompt =
  | { mode: "deposit"; part: ScrapPart }
  | { mode: "take"; entryId: string; part: ScrapPart };

const Ledger = ({ tallies }: { tallies: StashTally[] }) => (
  <div className='space-y-2'>
    {tallies.map((tally) => {
      const balance = tally.deposited - tally.taken;

      return (
        <div
          key={tally.uid}
          className='flex items-center gap-3 rounded-lg bg-zinc-900/40 px-4 py-2.5'>
          <span className='min-w-0 flex-1 truncate text-sm font-semibold text-zinc-200'>
            {tally.displayName}
          </span>

          <span className='shrink-0 text-xs tabular-nums text-zinc-500'>
            <span className='text-emerald-400'>+{tally.deposited}</span>
            {" / "}
            <span className='text-orange-400'>−{tally.taken}</span>
          </span>

          <span
            className={cn(
              "w-10 shrink-0 text-right text-sm font-bold tabular-nums",
              balance > 0
                ? "text-emerald-400"
                : balance < 0
                  ? "text-orange-400"
                  : "text-zinc-500",
            )}>
            {balance > 0 ? `+${balance}` : balance}
          </span>
        </div>
      );
    })}
  </div>
);

/**
 * The guild's shelf and your own cabinet, drawn as the same board.
 *
 * The shelf used to be a list of what somebody had left and a second list of
 * what you could give; both are stashes, so both are the Arsenal's cabinet —
 * the same sockets, the same hover cards, the same two-row guitars. What a
 * player does with them is the one thing that differs: carry a piece across the
 * gap and it changes hands, carry it around your own board and you are just
 * arranging your gear, which is saved to the same arrangement the Arsenal
 * shows.
 */
export const GuildStashTab = ({
  enabled,
  guild,
  tokensLeft,
}: {
  enabled: boolean;
  guild: Guild;
  tokensLeft: number;
}) => {
  const { data: stash, isLoading } = useGuildStash(enabled);
  const { data: gear } = useMyGear(enabled);
  const { deposit, take } = useStashMutations();
  const { fund } = useGuildMutations();
  const { mutate: saveLayout } = useUpdateStashLayout();
  const isMobile = useResponsiveStore((state) => state.isMobile);

  const shelfGrid = useRef<HTMLDivElement>(null);
  const gearGrid = useRef<HTMLDivElement>(null);
  /** The arrangement being edited, before it comes back from the server. */
  const [draft, setDraft] = useState<StashLayout | null>(null);
  const [amount, setAmount] = useState<AmountPrompt | null>(null);

  const busy = deposit.isPending || take.isPending || fund.isPending;

  const entries = useMemo(() => stash?.entries ?? [], [stash]);
  const shelfPieces = useMemo(() => entries.map(entryPiece), [entries]);
  // Nobody owns the shelf, so nobody has arranged it: the sockets flow from the
  // top-left in the order things were left, and the spare rows underneath are
  // what a deposit is dropped onto.
  const shelf = useMemo(() => resolveLayout(shelfPieces, {}), [shelfPieces]);
  // The shelf is drawn at the size the guild has paid for rather than the size
  // its contents happen to need: the empty rows *are* the purchase, and the
  // wall at the bottom is what the pot below the board is for. A guild that
  // filled its shelf before the rows were priced keeps whatever it already has.
  const rowsUsed = useMemo(() => shelfRowsUsed(shelfPieces), [shelfPieces]);
  const shelfRows = Math.max(guild.stashRowLimit, rowsUsed);
  const rowsFree = Math.max(0, guild.stashRowLimit - rowsUsed);

  const gearPieces = useMemo(
    () => [
      ...partPieces(gear?.parts ?? []),
      ...modPieces(gear?.salvagedMods ?? []),
      ...(gear?.inventory ?? []).map(guitarPiece),
      ...(gear?.effectInventory ?? []).map(pedalPiece),
    ],
    [gear],
  );
  const mine = useMemo(
    () => resolveLayout(gearPieces, draft ?? gear?.stashLayout ?? {}),
    [gearPieces, draft, gear?.stashLayout],
  );

  const equippedItemId = gear?.equippedItemId ?? null;
  const guitarSlots = useMemo<(string | null)[]>(
    () => gear?.rig?.guitarSlots ?? [],
    [gear?.rig?.guitarSlots],
  );
  const pedalboardItemIds = useMemo(
    () => new Set(gear?.rig?.pedalboardItems?.map((p) => p.itemId) ?? []),
    [gear?.rig?.pedalboardItems],
  );
  const rigSlotOf = (itemId: string) => {
    const index = guitarSlots.indexOf(itemId);
    return index >= 0 ? index : null;
  };

  const depositPiece = (piece: BoardPiece, qty?: number) => {
    if (piece.kind === "part") {
      deposit.mutate({
        kind: "part",
        partId: piece.part.partId,
        tier: piece.part.tier,
        qty: qty ?? piece.part.qty,
      });
    } else if (piece.kind === "mod") {
      deposit.mutate({ kind: "mod", modId: piece.mod.id });
    } else {
      deposit.mutate({ kind: piece.kind, inventoryItemId: piece.id });
    }
  };

  /** A piece let go over the other cabinet, or simply clicked. */
  const transfer = (from: ShelfBoardId, pieceId: string) => {
    if (from === "gear") {
      const piece = gearPieces.find((p) => p.id === pieceId);
      if (!piece) return;
      // A stack of more than one asks how much of it is being given away; one
      // piece has nothing to ask about.
      if (piece.kind === "part" && piece.part.qty > 1) {
        setAmount({ mode: "deposit", part: piece.part });
        return;
      }
      depositPiece(piece);
      return;
    }

    const entry = entries.find((e) => e.id === pieceId);
    if (!entry) return;
    if (entry.kind === "part" && entry.item.qty > 1) {
      setAmount({ mode: "take", entryId: entry.id, part: entry.item });
      return;
    }
    take.mutate({ entryId: pieceId });
  };

  const applyMove = (next: StashLayout) => {
    setDraft(next);
    saveLayout(next);
  };

  // Rebuilt every render on purpose: the drag reads the boards as they are now,
  // and a memo here would only be a way of handing it a stale one.
  const boards: ShelfBoard[] = [
    {
      id: "shelf",
      gridRef: shelfGrid,
      rows: shelfRows,
      pieces: shelfPieces,
      layout: shelf.layout,
    },
    {
      id: "gear",
      gridRef: gearGrid,
      rows: mine.rows,
      pieces: gearPieces,
      layout: mine.layout,
      onMove: applyMove,
    },
  ];

  const { ghost, drop, receiving, dragHandlers, consumeClick } = useShelfDrag({
    boards,
    onTransfer: transfer,
    // A draggable socket has to swallow touch gestures to work at all, which
    // would cost the player the ability to scroll the page on a phone. On touch
    // a tap moves the piece instead, which is what this screen did before.
    enabled: !isMobile,
  });

  const renderPiece = (
    board: ShelfBoardId,
    piece: BoardPiece,
    carried = false,
  ) => {
    const layout = board === "shelf" ? shelf.layout : mine.layout;
    const placement: StashPlacement = carried
      ? { column: 0, row: 0 }
      : {
          column: columnOf(layout[piece.id]),
          row: rowOf(layout[piece.id]),
          dragging: ghost?.board === board && ghost.id === piece.id,
          disabled: busy,
          dragHandlers: dragHandlers(board, piece),
        };

    return (
      <BoardPieceTile
        key={piece.id}
        {...placement}
        piece={piece}
        isEquipped={board === "gear" && equippedItemId === piece.id}
        rigSlot={board === "gear" ? rigSlotOf(piece.id) : null}
        isOnPedalboard={board === "gear" && pedalboardItemIds.has(piece.id)}
        onClick={() => {
          if (consumeClick()) return;
          transfer(board, piece.id);
        }}
      />
    );
  };

  if (isLoading || !stash) {
    return (
      <div className='space-y-3'>
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className='h-20 animate-pulse rounded-lg bg-zinc-900/40'
          />
        ))}
      </div>
    );
  }

  const carried = ghost
    ? (ghost.board === "shelf" ? shelfPieces : gearPieces).find(
        (p) => p.id === ghost.id,
      )
    : undefined;

  return (
    <div className='space-y-10'>
      <section className='space-y-4'>
        <h2 className='flex items-center gap-2 text-sm font-bold text-zinc-200'>
          <ArrowDownToLine size={15} className='text-cyan-400' />
          On the shelf
          <span className='font-medium text-zinc-500'>
            {shelfPieces.length}
          </span>
          <span className='ml-auto text-xs font-medium tabular-nums text-zinc-500'>
            {rowsUsed} of {guild.stashRowLimit} rows
          </span>
        </h2>

        <StashBoard
          rows={shelfRows}
          gridRef={shelfGrid}
          drop={drop?.board === "shelf" ? drop : null}
          receiving={receiving === "shelf"}
          label='Guild stash'>
          {shelfPieces.map((piece) => renderPiece("shelf", piece))}
        </StashBoard>

        <p className='text-xs text-zinc-500'>
          {shelfPieces.length === 0
            ? "Nothing here yet. Drag something down from your gear and somebody will use it."
            : rowsFree === 0
              ? "The shelf is full — take something off it, or put a few tokens towards another row."
              : "Drag a socket into your own cabinet to take it, or click it. Who left what is in the ledger below."}
        </p>

        <GuildFundBar
          fund={guild.funds.stashRows}
          standing={
            rowsFree === 0
              ? "The shelf is full"
              : `${rowsFree} ${rowsFree === 1 ? "row" : "rows"} free`
          }
          buys='another row'
          maxed={`a shelf tops out at ${GUILD_MAX_STASH_ROWS} rows`}
          members={guild.members}
          tokensLeft={tokensLeft}
          busy={busy}
          onPledge={(tokens) => fund.mutate({ track: "stashRows", tokens })}
        />
      </section>

      <section className='space-y-4'>
        <h2 className='flex items-center gap-2 text-sm font-bold text-zinc-200'>
          <ArrowUpFromLine size={15} className='text-emerald-400' />
          Your gear
        </h2>

        {gearPieces.length === 0 ? (
          <p className='text-sm text-zinc-500'>
            You have no spare gear to give.
          </p>
        ) : (
          <>
            <StashBoard
              rows={mine.rows}
              gridRef={gearGrid}
              drop={drop?.board === "gear" ? drop : null}
              receiving={receiving === "gear"}
              label='Your stash'>
              {gearPieces.map((piece) => renderPiece("gear", piece))}
            </StashBoard>

            <p className='text-xs text-zinc-500'>
              Guitars, pedals, salvaged parts and rescued mods all go on the
              shelf — drag one up, or click it. Dragging inside this board just
              rearranges it, and that is the arrangement your Arsenal shows.
              Equipping is cleared for you; a pedal has to come off the board
              first.
            </p>
          </>
        )}
      </section>

      <section className='space-y-4'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-sm font-bold text-zinc-200'>
            Who gives, who takes
          </h2>
          <p className='text-sm text-zinc-400'>
            Every deposit and every withdrawal, counted per member.
          </p>
        </div>
        <Ledger tallies={stash.tallies} />
      </section>

      {stash.log.length > 0 && (
        <section className='space-y-4'>
          <h2 className='text-sm font-bold text-zinc-200'>Recent moves</h2>
          <div className='space-y-2 rounded-lg bg-zinc-900/40 px-4 py-3.5'>
            {stash.log.map((entry) => (
              <p key={entry.id} className='text-xs text-zinc-500'>
                <span className='font-semibold text-zinc-300'>
                  {entry.displayName}
                </span>{" "}
                {entry.action === "deposit" ? "left" : "took"}{" "}
                <span className='text-zinc-400'>{entry.itemName}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      {/* The carried piece, drawn at the size of the socket it came from. */}
      {ghost &&
        carried &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            className='pointer-events-none fixed z-[60] opacity-90'
            style={{
              left: ghost.x,
              top: ghost.y,
              width: ghost.width,
              height: ghost.height,
              filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.75))",
            }}>
            {renderPiece(ghost.board, carried, true)}
          </div>,
          document.body,
        )}

      <StashItemDialog
        isOpen={amount != null}
        onClose={() => setAmount(null)}
        title='How many'>
        {amount && (
          <PartAmountCard
            part={amount.part}
            mode={amount.mode}
            busy={busy}
            onConfirm={(qty) => {
              setAmount(null);
              if (amount.mode === "deposit") {
                depositPiece(partPiece(amount.part), qty);
              } else {
                take.mutate({ entryId: amount.entryId, qty });
              }
            }}
          />
        )}
      </StashItemDialog>
    </div>
  );
};
