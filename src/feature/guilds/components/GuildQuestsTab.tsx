import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { GuildQuestCard } from "feature/guilds/components/GuildQuestCard";
import {
  GUILD_QUEST_CHAPTERS,
  lapMultiplier,
  romanNumeral,
} from "feature/guilds/data/guildQuests";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import { useGuildText } from "feature/guilds/hooks/useGuildText";
import type {
  GuildMember,
  GuildQuestBoard,
} from "feature/guilds/types/guild.types";
import { Interpolate } from "lib/i18n/Interpolate";
import { Check, Lock } from "lucide-react";

/**
 * The guild's quest board, in the order a member's questions come:
 *
 *   1. is there Fame waiting for me;
 *   2. what are we working on right now, and how close is each one;
 *   3. what does the road ahead look like.
 *
 * The guild's level and its bar through the lap are in the page header, so the
 * tab does not say them again. The payout only shows when there is something to
 * take. The quests are the open ones first — the things to actually go and do —
 * with the cleared ones of the same chapter folded to a line each underneath.
 * The ladder of chapters comes last, for whoever wants to see how far it goes.
 */

type ChapterState = "passed" | "worn" | "locked";

/** The Fame waiting for the caller, and the button that takes it. */
const Payout = ({
  fame,
  busy,
  onClaim,
}: {
  fame: number;
  busy: boolean;
  onClaim: () => void;
}) => {
  const { t } = useGuildText();
  const amount = fame.toLocaleString();

  return (
    <section className='flex flex-wrap items-center justify-between gap-4 rounded-lg bg-zinc-800/40 p-5'>
      <div className='flex items-center gap-4'>
        <FameCoin size={32} />
        <div>
          <p className='text-xl font-bold tabular-nums leading-tight text-amber-400'>
            {t("quests.fame", { amount })}
          </p>
          <p className='text-sm text-zinc-400'>{t("quests.waiting")}</p>
        </div>
      </div>
      <Button disabled={busy} onClick={onClaim}>
        {t("quests.claim", { amount })}
      </Button>
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
        <Check className='h-5 w-5' />
      ) : state === "locked" ? (
        <Lock className='h-5 w-5' />
      ) : (
        index + 1
      )}
    </span>
  );
};

/** The ten chapters: where the guild is, what is behind it, what each one pays. */
const Chapters = ({ board }: { board: GuildQuestBoard }) => {
  const { t, chapterName, chapterBlurb } = useGuildText();
  const activeIndex = board.chapter.index;
  const times = lapMultiplier(board.lap);

  return (
    <section className='space-y-4'>
      <div className='space-y-1'>
        <SectionHeader
          size='lg'
          title={t("quests.road_ahead")}
          count={
            board.lap > 1
              ? t("quests.lap", { lap: romanNumeral(board.lap) })
              : undefined
          }
          className='mb-0'
        />
        {/* Only past the first lap is there anything to explain: the numbers
            are no longer the ones a member remembers. */}
        {board.lap > 1 && (
          <p className='max-w-2xl text-sm text-zinc-400'>
            {t("quests.ladder_lap", { lap: board.lap, times })}
          </p>
        )}
      </div>

      <ol className='space-y-2'>
        {GUILD_QUEST_CHAPTERS.map((chapter, index) => {
          const state: ChapterState =
            index < activeIndex
              ? "passed"
              : index === activeIndex
                ? "worn"
                : "locked";

          return (
            <li
              key={chapter.name}
              className={cn(
                "flex items-center gap-4 rounded-lg px-4 py-4 sm:px-5",
                state === "worn" ? "bg-zinc-800/60" : "bg-zinc-900/40",
              )}>
              <ChapterPlate index={index} state={state} />

              <div className='min-w-0 flex-1'>
                <p
                  className={cn(
                    "text-base font-bold",
                    state === "locked" ? "text-zinc-400" : "text-zinc-100",
                  )}>
                  {chapterName(index, chapter.name)}
                </p>
                <p className='mt-0.5 text-sm text-zinc-500'>
                  {chapterBlurb(index, chapter.blurb)}
                </p>
              </div>

              <p
                className={cn(
                  "flex shrink-0 items-center gap-1.5 text-base font-bold tabular-nums",
                  state === "passed" ? "text-zinc-500" : "text-amber-400",
                )}>
                <FameCoin size={16} />
                {t("quests.plus_fame", { amount: chapter.reward * times })}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export const GuildQuestsTab = ({
  board,
  members,
}: {
  board: GuildQuestBoard;
  /** The roster, to put names to each quest's shares. */
  members: GuildMember[];
}) => {
  const { t, chapterName } = useGuildText();
  const { claimQuests } = useGuildMutations();

  const open = board.active.filter((quest) => quest.doneAt === null);
  const cleared = board.active.filter((quest) => quest.doneAt !== null);

  return (
    <div className='space-y-10'>
      {board.claimable.fame > 0 && (
        <Payout
          fame={board.claimable.fame}
          busy={claimQuests.isPending}
          onClaim={() => claimQuests.mutate()}
        />
      )}

      <section className='space-y-4'>
        <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1'>
          <SectionHeader
            size='lg'
            title={chapterName(board.chapter.index, board.chapter.name)}
            count={`${t("quests.chapter_of_cap", {
              index: board.chapter.index + 1,
              total: board.chaptersTotal,
            })}${
              board.lap > 1
                ? ` · ${t("quests.lap", { lap: romanNumeral(board.lap) })}`
                : ""
            }`}
            className='mb-0'
          />

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

        <div className='space-y-3'>
          {[...open, ...cleared].map((quest) => (
            <GuildQuestCard key={quest.id} quest={quest} members={members} />
          ))}
        </div>
      </section>

      <Chapters board={board} />
    </div>
  );
};
