import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { GuildQuestCard } from "feature/guilds/components/GuildQuestCard";
import {
  GUILD_QUEST_CHAPTERS,
  GUILD_QUESTS_PER_CHAPTER,
  lapMultiplier,
  romanNumeral,
} from "feature/guilds/data/guildQuests";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { GuildQuestBoard } from "feature/guilds/types/guild.types";
import { Check, Lock } from "lucide-react";

/**
 * The guild's quest board, in the order a member's questions come:
 *
 *   1. what level are we, and is there Fame waiting for me;
 *   2. what are we working on right now, and how close is each one;
 *   3. what does the road ahead look like.
 *
 * The level card is one big number and one bar, with the payout beside it,
 * because that is the whole state of the guild in one glance. The quests under
 * it are the open ones first — the things to actually go and do — with the
 * cleared ones of the same chapter folded underneath in green. The ladder of
 * chapters comes last, for whoever wants to see how far it goes; past the
 * first lap it says which lap this is and what the numbers are multiplied by.
 */

type ChapterState = "passed" | "worn" | "locked";

const dayOf = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

/**
 * The Fame waiting for the caller, always drawn in the same place with the
 * same shape — a number and, when the number is not zero, the button that
 * takes it. A member learns where to look once.
 */
const Payout = ({
  board,
  busy,
  onClaim,
}: {
  board: GuildQuestBoard;
  busy: boolean;
  onClaim: () => void;
}) => {
  const { fame, quests } = board.claimable;
  const taken = board.done.filter((quest) => quest.claimed).length;

  return (
    <div className='flex flex-col items-start gap-2 sm:items-end sm:text-right'>
      <p className='text-xs text-zinc-500'>Fame waiting for you</p>
      <p
        className={cn(
          "flex items-center gap-2 text-2xl font-bold tabular-nums",
          fame > 0 ? "text-amber-400" : "text-zinc-500",
        )}>
        <FameCoin size={20} />
        {fame.toLocaleString()} Fame
      </p>

      {fame > 0 ? (
        <>
          <Button
            size='sm'
            disabled={busy}
            onClick={onClaim}
            className='bg-amber-500 text-zinc-900 hover:bg-amber-400'>
            Claim {fame.toLocaleString()} Fame
          </Button>
          <p className='text-xs text-zinc-500'>
            {quests === 1
              ? "One quest cleared while you were on the roster."
              : `${quests} quests cleared while you were on the roster.`}
          </p>
        </>
      ) : (
        <p className='max-w-xs text-xs text-zinc-500'>
          {taken > 0
            ? "Every quest you were here for is taken. The next one lands here."
            : "When the guild clears a quest, your share lands here to take."}
        </p>
      )}
    </div>
  );
};

/** The level, the bar through the current lap, and what one more quest is worth. */
const LevelCard = ({
  board,
  busy,
  onClaim,
}: {
  board: GuildQuestBoard;
  busy: boolean;
  onClaim: () => void;
}) => {
  const percent = Math.min(
    100,
    Math.round((board.lapCleared / board.lapSize) * 100),
  );

  return (
    <section className='space-y-6 rounded-lg bg-zinc-900/40 p-6'>
      <div className='flex flex-wrap items-start justify-between gap-x-8 gap-y-6'>
        <div className='flex items-center gap-5'>
          <span
            aria-label={`Guild level ${board.level}`}
            className='flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300'>
            <span className='text-[10px] leading-none opacity-70'>level</span>
            <span className='mt-1 text-4xl font-bold tabular-nums leading-none'>
              {board.level}
            </span>
          </span>

          <div className='space-y-1'>
            <h2 className='text-lg font-bold text-zinc-100'>
              Guild level {board.level}
              {board.lap > 1 && (
                <span className='ml-2 text-sm font-semibold text-cyan-300'>
                  lap {romanNumeral(board.lap)}
                </span>
              )}
            </h2>
            <p className='max-w-md text-sm text-zinc-400'>
              Every quest cleared is one level up, and{" "}
              <span className='font-bold text-amber-400'>
                +{board.chapter.reward} Fame
              </span>{" "}
              for every member on the roster.
            </p>
          </div>
        </div>

        <Payout board={board} busy={busy} onClaim={onClaim} />
      </div>

      <div className='space-y-1.5'>
        <div className='flex items-baseline justify-between text-xs tabular-nums text-zinc-500'>
          <span>
            {board.lapCleared} of {board.lapSize} quests cleared
            {board.lap > 1 ? ` on lap ${board.lap}` : ""}
          </span>
          <span>
            chapter {board.chapter.index + 1} of {board.chaptersTotal}
          </span>
        </div>
        <div
          role='progressbar'
          aria-valuenow={board.lapCleared}
          aria-valuemin={0}
          aria-valuemax={board.lapSize}
          aria-label={`${board.lapCleared} of ${board.lapSize} quests cleared on this lap`}
          className='h-2.5 overflow-hidden rounded-full bg-zinc-800/60'>
          <div
            className='h-full rounded-full bg-cyan-400 transition-[width] duration-500'
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </section>
  );
};

const ChapterPlate = ({
  index,
  state,
}: {
  index: number;
  state: ChapterState;
}) => (
  <span
    aria-label={`Chapter ${index + 1}`}
    className={cn(
      "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold tabular-nums",
      state === "passed" && "bg-emerald-500/10 text-emerald-400",
      state === "worn" && "bg-cyan-500/10 text-cyan-300",
      state === "locked" && "bg-zinc-800/40 text-zinc-500",
    )}>
    {state === "passed" ? (
      <Check size={18} />
    ) : state === "locked" ? (
      <Lock size={15} />
    ) : (
      index + 1
    )}
  </span>
);

const Chapters = ({ board }: { board: GuildQuestBoard }) => {
  const activeIndex = board.chapter.index;
  const times = lapMultiplier(board.lap);
  const doneIn = (index: number) =>
    board.done.filter(
      (quest) => quest.lap === board.lap && quest.chapter === index,
    ).length;

  return (
    <section className='space-y-4'>
      <div className='space-y-1'>
        <h2 className='text-base font-bold text-zinc-100'>
          The road ahead
          {board.lap > 1 && (
            <span className='ml-2 text-sm font-semibold text-cyan-300'>
              lap {romanNumeral(board.lap)}
            </span>
          )}
        </h2>
        <p className='max-w-2xl text-sm text-zinc-400'>
          Ten chapters of five quests, opened one at a time. Later chapters ask
          more and pay more.{" "}
          {board.lap > 1
            ? `After the tenth the ladder comes round again — this is lap ${board.lap}, with every target and every reward ×${times}.`
            : "After the tenth the ladder comes round again with every number doubled, then tripled — it never runs out."}
        </p>
      </div>

      <div className='space-y-2'>
        {GUILD_QUEST_CHAPTERS.map((chapter, index) => {
          const state: ChapterState =
            index < activeIndex
              ? "passed"
              : index === activeIndex
                ? "worn"
                : "locked";

          return (
            <div
              key={chapter.name}
              className={cn(
                "flex items-center gap-4 rounded-lg p-4 transition-background",
                state === "worn" ? "bg-cyan-500/[0.08]" : "bg-zinc-900/40",
                state === "locked" && "opacity-70",
              )}>
              <ChapterPlate index={index} state={state} />

              <div className='min-w-0 flex-1'>
                <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
                  <p className='text-sm font-bold text-zinc-100'>
                    {chapter.name}
                    {state === "worn" && (
                      <span className='ml-2 text-xs font-semibold text-cyan-300'>
                        you are here
                      </span>
                    )}
                  </p>
                  <p className='text-xs tabular-nums text-zinc-500'>
                    {state === "locked"
                      ? `${GUILD_QUESTS_PER_CHAPTER} quests`
                      : `${doneIn(index)} of ${GUILD_QUESTS_PER_CHAPTER} cleared`}
                  </p>
                </div>
                <p className='mt-0.5 text-xs leading-relaxed text-zinc-500'>
                  {chapter.blurb}
                </p>
                <p className='mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500'>
                  <FameCoin size={12} />
                  <span className='font-semibold text-amber-400'>
                    +{chapter.reward * times} Fame
                  </span>
                  a member, for each quest
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const GuildQuestsTab = ({ board }: { board: GuildQuestBoard }) => {
  const { claimQuests } = useGuildMutations();
  const busy = claimQuests.isPending;

  const open = board.active.filter((quest) => quest.doneAt === null);
  const cleared = board.active.filter((quest) => quest.doneAt !== null);
  const since = dayOf(board.since);

  return (
    <div className='space-y-10'>
      <LevelCard
        board={board}
        busy={busy}
        onClaim={() => claimQuests.mutate()}
      />

      <section className='space-y-4'>
        <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-3'>
          <div className='space-y-1'>
            <p className='text-xs font-semibold text-cyan-300'>
              Chapter {board.chapter.index + 1} of {board.chaptersTotal} ·{" "}
              {board.chapter.name}
              {board.lap > 1 ? ` · lap ${romanNumeral(board.lap)}` : ""}
            </p>
            <h2 className='text-lg font-bold text-zinc-100'>
              {open.length === 0
                ? "Chapter cleared"
                : open.length === 1
                  ? "One quest to clear"
                  : `${open.length} quests to clear`}
            </h2>
            <p className='max-w-2xl text-sm text-zinc-400'>
              {board.chapter.blurb} Clear all five and the next chapter opens.
            </p>
          </div>

          <p className='text-sm tabular-nums text-zinc-400'>
            <span className='font-bold text-zinc-100'>{cleared.length}</span> of{" "}
            {board.active.length} cleared
          </p>
        </div>

        {open.length > 0 && (
          <div className='space-y-3'>
            {open.map((quest) => (
              <GuildQuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        )}

        {cleared.length > 0 && (
          <div className='space-y-3 pt-2'>
            <p className='text-xs font-semibold text-emerald-400'>
              Cleared in this chapter
            </p>
            {cleared.map((quest) => (
              <GuildQuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        )}

        <p className='text-xs leading-relaxed text-zinc-500'>
          Counted over everyone on the roster
          {since ? ` since ${since}` : ""}. A quest that counts members is
          cleared when enough of them get there; the rest add up across the
          guild.
        </p>
      </section>

      <Chapters board={board} />
    </div>
  );
};
