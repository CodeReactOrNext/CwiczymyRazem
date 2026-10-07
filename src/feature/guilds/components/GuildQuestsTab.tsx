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
import { useGuildText } from "feature/guilds/hooks/useGuildText";
import type { GuildQuestBoard } from "feature/guilds/types/guild.types";
import { Interpolate } from "lib/i18n/Interpolate";
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
  const { t } = useGuildText();
  const { fame, quests } = board.claimable;
  const taken = board.done.filter((quest) => quest.claimed).length;

  return (
    <div className='flex flex-col items-start gap-2 sm:items-end sm:text-right'>
      <p className='text-xs text-zinc-500'>{t("quests.waiting")}</p>
      <p
        className={cn(
          "flex items-center gap-2 text-2xl font-bold tabular-nums",
          fame > 0 ? "text-amber-400" : "text-zinc-500",
        )}>
        <FameCoin size={20} />
        {t("quests.fame", { amount: fame.toLocaleString() })}
      </p>

      {fame > 0 ? (
        <>
          <Button
            size='sm'
            disabled={busy}
            onClick={onClaim}
            className='bg-amber-500 text-zinc-900 hover:bg-amber-400'>
            {t("quests.claim", { amount: fame.toLocaleString() })}
          </Button>
          <p className='text-xs text-zinc-500'>
            {t("quests.cleared_while_here", { count: quests })}
          </p>
        </>
      ) : (
        taken > 0 && (
          <p className='max-w-xs text-xs text-zinc-500'>
            {t("quests.all_taken")}
          </p>
        )
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
  const { t } = useGuildText();
  const percent = Math.min(
    100,
    Math.round((board.lapCleared / board.lapSize) * 100),
  );

  return (
    <section className='space-y-6 rounded-lg bg-zinc-900/40 p-6'>
      <div className='flex flex-wrap items-start justify-between gap-x-8 gap-y-6'>
        <div className='flex items-center gap-5'>
          <span
            aria-label={t("quests.guild_level", { level: board.level })}
            className='flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300'>
            <span className='text-[10px] leading-none opacity-70'>
              {t("quests.level")}
            </span>
            <span className='mt-1 text-4xl font-bold tabular-nums leading-none'>
              {board.level}
            </span>
          </span>

          <div className='space-y-1'>
            <h2 className='text-lg font-bold text-zinc-100'>
              {t("quests.guild_level", { level: board.level })}
              {board.lap > 1 && (
                <span className='ml-2 text-sm font-semibold text-cyan-300'>
                  {t("quests.lap", { lap: romanNumeral(board.lap) })}
                </span>
              )}
            </h2>
            <p className='max-w-md text-sm text-zinc-400'>
              <Interpolate
                text={t("quests.level_up")}
                values={{
                  reward: (
                    <span className='font-bold text-amber-400'>
                      {t("quests.plus_fame", { amount: board.chapter.reward })}
                    </span>
                  ),
                }}
              />
            </p>
          </div>
        </div>

        <Payout board={board} busy={busy} onClaim={onClaim} />
      </div>

      <div className='space-y-1.5'>
        <div className='flex items-baseline justify-between text-xs tabular-nums text-zinc-500'>
          <span>
            {board.lap > 1
              ? t("quests.lap_cleared_on", {
                  done: board.lapCleared,
                  total: board.lapSize,
                  lap: board.lap,
                })
              : t("quests.lap_cleared", {
                  done: board.lapCleared,
                  total: board.lapSize,
                })}
          </span>
          <span>
            {t("quests.chapter_of", {
              index: board.chapter.index + 1,
              total: board.chaptersTotal,
            })}
          </span>
        </div>
        <div
          role='progressbar'
          aria-valuenow={board.lapCleared}
          aria-valuemin={0}
          aria-valuemax={board.lapSize}
          aria-label={t("quests.lap_cleared", {
            done: board.lapCleared,
            total: board.lapSize,
          })}
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
}) => {
  const { t } = useGuildText();
  return (
    <span
      aria-label={t("quests.chapter", { index: index + 1 })}
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
};

const Chapters = ({ board }: { board: GuildQuestBoard }) => {
  const { t, chapterName, chapterBlurb } = useGuildText();
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
          {t("quests.road_ahead")}
          {board.lap > 1 && (
            <span className='ml-2 text-sm font-semibold text-cyan-300'>
              {t("quests.lap", { lap: romanNumeral(board.lap) })}
            </span>
          )}
        </h2>
        <p className='max-w-2xl text-sm text-zinc-400'>
          {t("quests.ladder")}{" "}
          {board.lap > 1
            ? t("quests.ladder_lap", { lap: board.lap, times })
            : t("quests.ladder_first")}
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
                    {chapterName(index, chapter.name)}
                    {state === "worn" && (
                      <span className='ml-2 text-xs font-semibold text-cyan-300'>
                        {t("quests.you_are_here")}
                      </span>
                    )}
                  </p>
                  <p className='text-xs tabular-nums text-zinc-500'>
                    {state === "locked"
                      ? t("quests.n_quests", {
                          count: GUILD_QUESTS_PER_CHAPTER,
                        })
                      : t("quests.n_cleared", {
                          done: doneIn(index),
                          total: GUILD_QUESTS_PER_CHAPTER,
                        })}
                  </p>
                </div>
                <p className='mt-0.5 text-xs leading-relaxed text-zinc-500'>
                  {chapterBlurb(index, chapter.blurb)}
                </p>
                <p className='mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500'>
                  <FameCoin size={12} />
                  <span className='font-semibold text-amber-400'>
                    {t("quests.plus_fame", { amount: chapter.reward * times })}
                  </span>
                  {t("quests.per_member")}
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
  const { t, chapterName, chapterBlurb } = useGuildText();
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
              {t("quests.chapter_of_cap", {
                index: board.chapter.index + 1,
                total: board.chaptersTotal,
              })}{" "}
              · {chapterName(board.chapter.index, board.chapter.name)}
              {board.lap > 1
                ? ` · ${t("quests.lap", { lap: romanNumeral(board.lap) })}`
                : ""}
            </p>
            <h2 className='text-lg font-bold text-zinc-100'>
              {open.length === 0
                ? t("quests.chapter_cleared")
                : t("quests.to_clear", { count: open.length })}
            </h2>
            <p className='max-w-2xl text-sm text-zinc-400'>
              {chapterBlurb(board.chapter.index, board.chapter.blurb)}{" "}
              {t("quests.clear_all_five")}
            </p>
          </div>

          <p className='text-sm tabular-nums text-zinc-400'>
            <Interpolate
              text={t("quests.cleared_of")}
              values={{
                done: (
                  <span className='font-bold text-zinc-100'>
                    {cleared.length}
                  </span>
                ),
                total: board.active.length,
              }}
            />
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
              {t("quests.cleared_in_chapter")}
            </p>
            {cleared.map((quest) => (
              <GuildQuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        )}

        <p className='text-xs leading-relaxed text-zinc-500'>
          {since ? t("quests.counted_since", { since }) : t("quests.counted")}
        </p>
      </section>

      <Chapters board={board} />
    </div>
  );
};
