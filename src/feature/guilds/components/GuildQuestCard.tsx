import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import type { GuildQuest } from "feature/guilds/data/guildQuests";
import {
  formatQuestAmount,
  questById,
  reportFieldUnit,
} from "feature/guilds/data/guildQuests";
import { useGuildText } from "feature/guilds/hooks/useGuildText";
import type {
  GuildMember,
  GuildQuestProgress,
} from "feature/guilds/types/guild.types";
import {
  questStandings,
  splitQuestShares,
} from "feature/guilds/utils/questShares";
import type { Translate } from "lib/i18n/translate";
import type { LucideIcon, LucideProps } from "lucide-react";
import {
  Activity,
  Award,
  BookOpen,
  Check,
  CheckSquare,
  Clock,
  Coins,
  Ear,
  Flame,
  GraduationCap,
  Guitar,
  LayoutGrid,
  ListMusic,
  Sparkles,
  Target,
  Trophy,
  Video,
} from "lucide-react";

/**
 * The faces a quest can wear, keyed by what it measures — so a guitar always
 * means technique and an ear always means ear training, the same as everywhere
 * else in the app that talks about practice.
 */
const ICONS = {
  sessions: Activity,
  time: Clock,
  technique: Guitar,
  theory: BookOpen,
  hearing: Ear,
  creativity: Sparkles,
  points: Award,
  allCategoriesEach: LayoutGrid,
  treasury: Coins,
  streak: Flame,
  songsLearned: ListMusic,
  recordings: Video,
  exams: GraduationCap,
  dailyQuests: CheckSquare,
  submissions: Trophy,
  unknown: Target,
} satisfies Record<string, LucideIcon>;

type IconKey = keyof typeof ICONS;

const iconKeyFor = (quest: GuildQuest | undefined): IconKey => {
  const measure = quest?.measure;
  if (!measure) return "unknown";

  switch (measure.kind) {
    case "reports":
      return measure.field;
    case "logs":
      return measure.type === "journey_exam_passed" ? "exams" : "dailyQuests";
    default:
      return measure.kind;
  }
};

/** Looked up off a static map rather than made, so the tag is a stable component. */
const QuestIcon = ({
  quest,
  ...props
}: LucideProps & { quest: GuildQuest | undefined }) => {
  const key = iconKeyFor(quest);
  const Icon = ICONS[key];
  return <Icon aria-hidden {...props} />;
};

const tenth = (value: number): number =>
  Math.round((Number.isFinite(value) ? value : 0) * 10) / 10;

const amountOf = (value: number): string => tenth(value).toLocaleString();

/** A sliver thinner than this is rounding, not somebody's work. */
const MIN_REST_WIDTH = 0.5;

const percentOf = (progress: number, target: number): number =>
  target > 0 ? Math.min(100, Math.floor((progress / target) * 100)) : 0;

const dayOf = (iso: string): string =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

/**
 * Where the caller stands on a quest that counts members:
 * "you: 3 / 5 sessions", "your streak: 12 / 30 days".
 */
const eachLine = (
  quest: GuildQuest | undefined,
  each: NonNullable<GuildQuestProgress["each"]>,
  t: Translate,
): string => {
  const measure = quest?.measure;
  switch (measure?.kind) {
    case "reports":
      return t("card.you_of", {
        mine: tenth(each.mine),
        target: formatQuestAmount(
          reportFieldUnit(measure.field),
          each.target,
          t,
        ),
      });
    case "allCategoriesEach":
      return t("card.you_categories", { mine: each.mine, count: each.target });
    case "streak":
      return t("card.your_streak", { mine: each.mine, count: each.target });
    default:
      return t("card.you_of", { mine: each.mine, target: each.target });
  }
};

/** What is still missing, in the quest's own words: "588 sessions to go". */
const remainingLine = (
  quest: GuildQuestProgress,
  ask: string,
  t: Translate,
): string => {
  const left = Math.max(0, quest.target - quest.progress);

  if (quest.each) return t("card.members_need", { count: left, ask });
  return t("card.to_go", { amount: formatQuestAmount(quest.unit, left, t) });
};

/** What a quest pays each member. Grey once it has been cleared. */
const Reward = ({ amount, done }: { amount: number; done: boolean }) => {
  const { t } = useGuildText();
  return (
    <p
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-base font-bold tabular-nums",
        done ? "text-zinc-500" : "text-amber-400",
      )}>
      <FameCoin size={16} />
      {t("quests.plus_fame", { amount })}
    </p>
  );
};

/**
 * One quest, said the way a member reads it: what it is, what it pays, one bar
 * for how far the guild has got, and one line under it — where we are on the
 * left, what is still missing on the right.
 *
 * The bar is one colour. Who put in how much is on its tooltip rather than
 * drawn as a segment and a legend entry per member, which made every card a
 * chart to be decoded. A quest that counts members still lists them under the
 * bar, because there the names are the answer to "who is it waiting on".
 *
 * A cleared quest folds down to a single line: a tick, its name and the day.
 */
export const GuildQuestCard = ({
  quest,
  members,
}: {
  quest: GuildQuestProgress;
  /** The roster, to put names to the quest's shares. */
  members: GuildMember[];
}) => {
  const { t, questName, questBlurb, questAsk } = useGuildText();
  const spec = questById(quest.questId);
  const name = questName(quest.questId, quest.name, quest.lap);
  const done = quest.doneAt !== null;

  if (done) {
    return (
      <article className='flex items-center gap-4 rounded-lg bg-zinc-800/40 px-5 py-4'>
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400'>
          <Check className='h-5 w-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-base font-bold text-zinc-300'>{name}</h3>
          {quest.doneAt && (
            <p className='mt-0.5 text-sm text-zinc-500'>
              {t("card.cleared_on", { date: dayOf(quest.doneAt) })}
            </p>
          )}
        </div>
        <Reward amount={quest.reward} done />
      </article>
    );
  }

  const percent = percentOf(quest.progress, quest.target);
  const split = quest.each ? null : splitQuestShares(quest, members);
  const carriedBy =
    split && split.shares.length > 0
      ? [
          ...split.shares.map(
            (share) => `${share.name}: ${amountOf(share.value)}`,
          ),
          ...(split.restWidth > MIN_REST_WIDTH
            ? [t("card.former_members")]
            : []),
        ].join(" · ")
      : undefined;
  const eachTarget = quest.each?.target ?? null;
  const standings =
    eachTarget !== null && quest.shares
      ? questStandings(quest, eachTarget, members)
      : null;
  const mine = quest.each
    ? eachLine(spec, quest.each, t)
    : quest.mine !== null
      ? t("card.you", { amount: formatQuestAmount(quest.unit, quest.mine, t) })
      : null;

  return (
    <article className='rounded-lg bg-zinc-800/40 p-5'>
      <div className='flex items-start gap-4'>
        <span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-300'>
          <QuestIcon quest={spec} size={20} />
        </span>

        <div className='min-w-0 flex-1 space-y-3'>
          <div className='flex items-start justify-between gap-4'>
            <div className='min-w-0'>
              <h3 className='text-base font-bold text-zinc-100'>{name}</h3>
              <p className='mt-0.5 text-sm text-zinc-400'>
                {questBlurb(quest)}
              </p>
            </div>
            <Reward amount={quest.reward} done={false} />
          </div>

          <div
            role='progressbar'
            aria-valuenow={Math.min(quest.progress, quest.target)}
            aria-valuemin={0}
            aria-valuemax={quest.target}
            aria-label={`${name}: ${percent}%`}
            title={carriedBy}
            className='h-3 overflow-hidden rounded-full bg-zinc-800'>
            <div
              className='bar-shine h-full rounded-full bg-cyan-400 transition-[width] duration-slow'
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-sm tabular-nums text-zinc-400'>
            <p>
              <span className='font-bold text-zinc-100'>
                {amountOf(quest.progress)}
              </span>{" "}
              / {formatQuestAmount(quest.unit, quest.target, t)}
              {mine && (
                <span
                  className={
                    quest.each?.done ? "text-emerald-400" : "text-zinc-500"
                  }>
                  {" · "}
                  {mine}
                </span>
              )}
            </p>
            <p>
              {remainingLine(
                quest,
                quest.each ? questAsk(quest, quest.each.ask) : "",
                t,
              )}
            </p>
          </div>

          {standings && eachTarget !== null && (
            <ul className='flex flex-wrap gap-x-5 gap-y-1.5 text-sm'>
              {standings.map((standing) => (
                <li key={standing.uid} className='flex items-center gap-1.5'>
                  {standing.done ? (
                    <Check
                      aria-hidden
                      className='h-3.5 w-3.5 shrink-0 text-emerald-400'
                    />
                  ) : (
                    <span
                      aria-hidden
                      className='mx-0.5 h-2 w-2 shrink-0 rounded-full bg-zinc-600'
                    />
                  )}
                  <span
                    className={
                      standing.done ? "text-zinc-200" : "text-zinc-400"
                    }>
                    {standing.name}
                  </span>
                  <span className='tabular-nums text-zinc-500'>
                    {amountOf(standing.value)} / {amountOf(eachTarget)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
};
