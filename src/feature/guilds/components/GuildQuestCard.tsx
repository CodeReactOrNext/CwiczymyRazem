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

/**
 * A colour per member, picked by their seat on the roster — so a player keeps
 * the same colour on every quest and the eye can follow one person down the
 * board. Ordered so that neighbours in the list are never two shades of one
 * hue; a roster longer than the list starts it again.
 */
const SHARE_SHADES = [
  "bg-cyan-400",
  "bg-orange-400",
  "bg-violet-400",
  "bg-amber-300",
  "bg-emerald-400",
  "bg-pink-400",
  "bg-blue-400",
  "bg-lime-400",
];
/**
 * What nobody on the roster accounts for: members who have left. Light, so it
 * still reads as filled next to the dark, hatched part that is left to do.
 */
const REST_SHADE = "bg-zinc-300";

/** The part of the bar still to do: dark, with fine diagonal lines. */
const EMPTY_TRACK_STYLE = {
  backgroundImage:
    "repeating-linear-gradient(135deg, rgb(var(--c-zinc-600) / 0.55) 0 2px, transparent 2px 7px)",
};

const shadeOf = (seat: number): string =>
  SHARE_SHADES[seat % SHARE_SHADES.length];

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
  const percent = done ? 100 : percentOf(quest.progress, quest.target);

  // An open quest shows who is carrying it: a guild total as one segment per
  // member, a per-member ask as the roster against the bar. A cleared one keeps
  // its plain green bar — it is done, and who did how much no longer matters.
  const sharesSplit =
    !done && !quest.each ? splitQuestShares(quest, members) : null;
  const split = sharesSplit && sharesSplit.shares.length > 0 ? sharesSplit : null;
  const eachTarget = quest.each?.target ?? null;
  const standings =
    !done && eachTarget !== null && quest.shares
      ? questStandings(quest, eachTarget, members)
      : null;

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
              <h3 className='text-base font-bold text-zinc-100'>{name}</h3>
              <p className='mt-0.5 text-sm text-zinc-400'>
                {questBlurb(quest)}
              </p>
            </div>

            <div className='shrink-0 text-right'>
              <p
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2 py-1 text-sm font-bold tabular-nums",
                  done
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-amber-500/10 text-amber-400",
                )}>
                <FameCoin size={14} />
                {t("quests.plus_fame", { amount: quest.reward })}
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-end justify-between gap-4'>
              <p className='text-sm tabular-nums text-zinc-400'>
                <span className='text-xl font-bold text-zinc-100'>
                  {tenth(quest.progress).toLocaleString()}
                </span>{" "}
                / {formatQuestAmount(quest.unit, quest.target, t)}
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
              aria-label={`${name}: ${percent}%`}
              // With a colour per member on it, a plain grey track reads as one
              // more member. Hatching it says "nothing here yet" at a glance.
              style={split ? EMPTY_TRACK_STYLE : undefined}
              className={cn(
                "flex h-2.5 overflow-hidden rounded-full",
                split ? "bg-zinc-950/60" : "bg-zinc-800/60",
              )}>
              {split ? (
                <>
                  {split.shares.map((share, index) => (
                    <div
                      key={share.uid}
                      title={`${share.name}: ${amountOf(share.value)}`}
                      className={cn(
                        "h-full transition-[width] duration-slow",
                        shadeOf(share.seat),
                        index > 0 && "border-l-2 border-zinc-950/70",
                      )}
                      style={{ width: `${share.width}%` }}
                    />
                  ))}
                  {split.restWidth > MIN_REST_WIDTH && (
                    <div
                      title={t("card.former_members")}
                      className={cn(
                        "h-full border-l-2 border-zinc-950/70",
                        REST_SHADE,
                      )}
                      style={{ width: `${split.restWidth}%` }}
                    />
                  )}
                </>
              ) : (
                <div
                  className={cn(
                    "bar-shine h-full rounded-full transition-[width] duration-slow",
                    done ? "bg-emerald-400" : "bg-cyan-400",
                  )}
                  style={{ width: `${percent}%` }}
                />
              )}
            </div>

            {split && (
              <ul className='flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-xs'>
                {split.shares.map((share) => (
                  <li key={share.uid} className='flex items-center gap-1.5'>
                    <span
                      aria-hidden
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        shadeOf(share.seat),
                      )}
                    />
                    <span className='font-medium text-zinc-200'>
                      {share.name}
                    </span>
                    <span className='tabular-nums text-zinc-400'>
                      {amountOf(share.value)}
                    </span>
                  </li>
                ))}
                {split.restWidth > MIN_REST_WIDTH && (
                  <li className='flex items-center gap-1.5 text-zinc-400'>
                    <span
                      aria-hidden
                      className={cn("h-2 w-2 shrink-0 rounded-full", REST_SHADE)}
                    />
                    {t("card.former_members")}
                  </li>
                )}              </ul>
            )}

            {standings && eachTarget !== null && (
              <ul className='flex flex-wrap gap-x-5 gap-y-1.5 pt-1 text-xs'>
                {standings.map((standing) => (
                  <li key={standing.uid} className='flex items-center gap-1.5'>
                    {standing.done ? (
                      <Check
                        aria-hidden
                        size={12}
                        className='shrink-0 text-emerald-400'
                      />
                    ) : (
                      <span
                        aria-hidden
                        className='mx-0.5 h-2 w-2 shrink-0 rounded-full bg-zinc-600'
                      />
                    )}
                    <span
                      className={cn(
                        "font-medium",
                        standing.done ? "text-zinc-200" : "text-zinc-400",
                      )}>
                      {standing.name}
                    </span>
                    <span className='tabular-nums text-zinc-400'>
                      {amountOf(standing.value)} / {amountOf(eachTarget)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs'>
            {quest.each ? (
              <span
                className={cn(
                  "flex items-center gap-1.5 tabular-nums",
                  quest.each.done ? "text-emerald-400" : "text-zinc-400",
                )}>
                {quest.each.done && <Check size={12} />}
                {eachLine(spec, quest.each, t)}
              </span>
            ) : quest.mine !== null ? (
              <span className='tabular-nums text-zinc-400'>
                {t("card.you", {
                  amount: formatQuestAmount(quest.unit, quest.mine, t),
                })}
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
                ? t("card.cleared_on", { date: dayOf(quest.doneAt) })
                : remainingLine(
                    quest,
                    quest.each ? questAsk(quest, quest.each.ask) : "",
                    t,
                  )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
