import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import type { GuildQuest } from "feature/guilds/data/guildQuests";
import {
  formatQuestAmount,
  questById,
  reportFieldUnit,
} from "feature/guilds/data/guildQuests";
import type { GuildQuestProgress } from "feature/guilds/types/guild.types";
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
): string => {
  const measure = quest?.measure;
  switch (measure?.kind) {
    case "reports":
      return `you: ${tenth(each.mine)} / ${formatQuestAmount(
        reportFieldUnit(measure.field),
        each.target,
      )}`;
    case "allCategoriesEach":
      return `you: ${each.mine} / ${each.target} categories`;
    case "streak":
      return `your streak: ${each.mine} / ${each.target} days`;
    default:
      return `you: ${each.mine} / ${each.target}`;
  }
};

/** What is still missing, in the quest's own words: "588 sessions to go". */
const remainingLine = (quest: GuildQuestProgress): string => {
  const left = Math.max(0, quest.target - quest.progress);

  if (quest.each) {
    return left === 1
      ? `1 more member needs ${quest.each.ask}`
      : `${left} more members need ${quest.each.ask}`;
  }
  return `${formatQuestAmount(quest.unit, left)} to go`;
};

/**
 * One quest, said the way a member reads it: what it is, how far the guild has
 * got as a bar and a percentage, what it pays, and what is still missing.
 *
 * The four things are laid out in that order because that is the order the
 * questions come in — "what is this", "how close are we", "what do I get",
 * "what is left to do" — and every one of them has its own line rather than
 * being folded into a tooltip. A cleared quest keeps the same shape in green,
 * so the eye can tell done from open without reading anything.
 */
export const GuildQuestCard = ({ quest }: { quest: GuildQuestProgress }) => {
  const spec = questById(quest.questId);
  const done = quest.doneAt !== null;
  const percent = done ? 100 : percentOf(quest.progress, quest.target);

  return (
    <article
      className={cn(
        "rounded-lg p-5 transition-background",
        done ? "bg-emerald-500/[0.06]" : "bg-zinc-900/40",
      )}>
      <div className='flex items-start gap-4'>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            done
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-zinc-800/60 text-zinc-300",
          )}>
          {done ? <Check size={20} /> : <QuestIcon quest={spec} size={20} />}
        </span>

        <div className='min-w-0 flex-1 space-y-4'>
          <div className='flex flex-wrap items-start justify-between gap-x-6 gap-y-2'>
            <div className='min-w-0'>
              <h3 className='text-base font-bold text-zinc-100'>
                {quest.name}
              </h3>
              <p className='mt-0.5 text-sm text-zinc-400'>{quest.blurb}</p>
            </div>

            <div className='shrink-0 text-right'>
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-bold tabular-nums",
                  done
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400",
                )}>
                <FameCoin size={14} />+{quest.reward} Fame
              </p>
              <p className='mt-1 text-[11px] text-zinc-500'>for every member</p>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-end justify-between gap-4'>
              <p className='text-sm tabular-nums text-zinc-400'>
                <span className='text-xl font-bold text-zinc-100'>
                  {tenth(quest.progress).toLocaleString()}
                </span>{" "}
                / {formatQuestAmount(quest.unit, quest.target)}
              </p>
              <p
                className={cn(
                  "text-xl font-bold tabular-nums",
                  done ? "text-emerald-400" : "text-cyan-300",
                )}>
                {percent}%
              </p>
            </div>

            <div
              role='progressbar'
              aria-valuenow={Math.min(quest.progress, quest.target)}
              aria-valuemin={0}
              aria-valuemax={quest.target}
              aria-label={`${quest.name}: ${percent}%`}
              className='h-2.5 overflow-hidden rounded-full bg-zinc-800/60'>
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  done ? "bg-emerald-400" : "bg-cyan-400",
                )}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs'>
            {quest.each ? (
              <span
                className={cn(
                  "flex items-center gap-1.5 tabular-nums",
                  quest.each.done ? "text-emerald-400" : "text-zinc-400",
                )}>
                {quest.each.done && <Check size={12} />}
                {eachLine(spec, quest.each)}
              </span>
            ) : quest.mine !== null ? (
              <span className='tabular-nums text-zinc-400'>
                you: {formatQuestAmount(quest.unit, quest.mine)}
              </span>
            ) : (
              <span />
            )}

            <span
              className={cn(
                "font-semibold tabular-nums",
                done ? "text-emerald-400" : "text-zinc-300",
              )}>
              {done && quest.doneAt
                ? `Cleared ${dayOf(quest.doneAt)}`
                : remainingLine(quest)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
