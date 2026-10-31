import { buttonVariants, PRESSABLE_KEY } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { Ripple } from "components/Ripple/Ripple";
import { HeroPattern } from "components/UI/HeroBanner";
import type { ModeProgressSummary } from "feature/practice/hooks/usePracticeModeProgress";
import { usePracticeModeProgress } from "feature/practice/hooks/usePracticeModeProgress";
import {
  parseLastSessions,
  readLastSessionsRaw,
} from "feature/practice/utils/lastSession";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import {
  ArrowRight,
  Brain,
  CalendarDays,
  CassetteTape,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Heart,
  History,
  ListChecks,
  ListTree,
  Loader2,
  Music2,
  NotebookPen,
  Plus,
  Repeat,
  Route,
  Search,
  Signpost,
  Skull,
  Swords,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { SiGuitarpro } from "react-icons/si";
import { useAppSelector } from "store/hooks";

interface ModeRowProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  loading: boolean;
  /** The plan the mode needs — set only while the account does not have it. */
  lockLabel?: string;
  /** A note like "New" or "Most used". */
  tag?: string;
  progress?: ModeProgressSummary;
  onActivate: () => void;
}

/**
 * One way to practise as one row of the list. The right edge says where the
 * player stands in it — a plan it needs, a tag, or their own progress — so the
 * row tells you something before you open it.
 *
 * On a phone that edge only keeps the plan lock: tags and progress squeeze the
 * description into three lines, and the lock is the one note that changes what
 * a tap does.
 */
const ModeRow = ({
  Icon,
  title,
  description,
  loading,
  lockLabel,
  tag,
  progress,
  onActivate,
}: ModeRowProps) => {
  const { t } = useTranslation("practice_hub");
  const { createRipple, ripple } = useRipple("bg-white/15");

  return (
    <button
      type='button'
      onClick={(e) => {
        createRipple(e);
        if (!loading) onActivate();
      }}
      className='relative flex min-h-[68px] w-full items-center gap-4 overflow-hidden rounded-lg px-3.5 py-2.5 text-left transition-background hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:click-behavior'>
      {ripple}
      <span className='flex h-6 w-6 shrink-0 items-center justify-center text-zinc-400'>
        {loading ? (
          <Loader2 className='h-5 w-5 animate-spin' />
        ) : (
          <Icon className='h-5 w-5' />
        )}
      </span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className='text-[15px] font-semibold text-zinc-100'>{title}</span>
        <span className='text-[13px] text-zinc-400'>{description}</span>
      </span>
      {lockLabel ? (
        <Chip color='gray' className='shrink-0 rounded px-2 py-0.5 text-[11px]'>
          {lockLabel}
        </Chip>
      ) : tag ? (
        <Chip
          color='gray'
          className='hidden shrink-0 rounded px-2 py-0.5 text-[11px] sm:inline-flex'>
          {tag}
        </Chip>
      ) : progress?.total ? (
        // The bar only measures the one path in progress; libraries get a count.
        <span className='hidden shrink-0 items-center gap-2.5 sm:flex'>
          <span className='h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800'>
            <span
              className='block h-full rounded-full bg-cyan-400 transition-all duration-slow'
              style={{
                width: `max(${Math.round(((progress.done ?? 0) / progress.total) * 100)}%, 3px)`,
              }}
            />
          </span>
          <span className='text-xs font-medium tabular-nums text-zinc-400'>
            {progress.done ?? 0}/{progress.total}
          </span>
        </span>
      ) : progress ? (
        <span className='hidden max-w-[40%] shrink-0 truncate text-right text-xs font-medium text-zinc-400 sm:block'>
          {progress.labelKey
            ? t(progress.labelKey, progress.labelVars)
            : progress.label}
        </span>
      ) : null}
    </button>
  );
};

// Sessions are only saved by this tab's own navigation, so there is nothing to
// listen for — the list is read once the page is on the client.
const noStorageSubscription = () => () => {};
// The server has no storage: no "continue" row until hydration is done.
const getServerLastSessions = () => null;

const createLinkClass = cn(
  buttonVariants({ variant: "secondary", size: "sm" }),
  "shadow-none"
);

const MY_STUFF = [
  { id: "favorites", Icon: Heart, href: "/favorites" },
  { id: "rotation", Icon: Repeat, href: "/rotation" },
  { id: "calendar", Icon: CalendarDays, href: "/calendar" },
  { id: "my_plans", Icon: ClipboardCheck, href: "/plans" },
  { id: "my_exercises", Icon: Music2, href: "/my-exercises" },
  { id: "player_roadmaps", Icon: Signpost, href: "/my-roadmaps" },
];

export const PracticeModeSelector = () => {
  const { t } = useTranslation("practice_hub");
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium =
    userInfo?.role === "pro" ||
    userInfo?.role === "master" ||
    userInfo?.role === "admin";
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";
  const userAuth = useAppSelector(selectUserAuth);
  const modeProgress = usePracticeModeProgress(userAuth);

  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  const lastSessionsRaw = useSyncExternalStore(
    noStorageSubscription,
    readLastSessionsRaw,
    getServerLastSessions
  );
  const lastSessions = useMemo(
    () => parseLastSessions(lastSessionsRaw),
    [lastSessionsRaw]
  );

  const nav = (href: string, id: string, locked?: boolean) => {
    if (locked) {
      setShowUpgradeModal(true);
      return;
    }
    setLoadingMode(id);
    router.push(href);
  };

  const modeRow = (
    id: string,
    Icon: React.ElementType,
    href: string,
    options?: {
      tag?: string;
      lockLabel?: string;
      progress?: ModeProgressSummary;
    }
  ) => (
    <ModeRow
      key={id}
      Icon={Icon}
      title={t(`modes.${id}.title`)}
      description={t(`modes.${id}.description`)}
      loading={loadingMode === id}
      lockLabel={options?.lockLabel}
      tag={options?.tag}
      progress={options?.progress}
      onActivate={() => nav(href, id, !!options?.lockLabel)}
    />
  );

  const logButton = (id: string, Icon: React.ElementType, href: string) => (
    <button
      type='button'
      onClick={() => nav(href, id)}
      className={cn(PRESSABLE_KEY, "relative flex min-h-[52px] w-full items-center gap-3 overflow-hidden rounded-lg bg-zinc-800/50 px-3.5 text-left transition-background hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring")}>
      <Ripple className='bg-white/15' />
      {loadingMode === id ? (
        <Loader2 className='h-[18px] w-[18px] shrink-0 animate-spin text-zinc-400' />
      ) : (
        <Icon className='h-[18px] w-[18px] shrink-0 text-zinc-400' />
      )}
      <span className='flex min-w-0 flex-col'>
        <span className='text-sm font-semibold text-zinc-100'>
          {t(`modes.${id}.title`)}
        </span>
        <span className='text-xs text-zinc-400'>
          {t(`modes.${id}.description`)}
        </span>
      </span>
    </button>
  );

  return (
    <>
      <div className='relative w-full'>
        <HeroPattern
          className='opacity-[0.04]'
          maskImage='linear-gradient(to bottom, black 0%, black 20%, transparent 80%)'
        />
        <div className='container relative z-10 mx-auto max-w-6xl space-y-8 px-4 py-12 font-sans sm:px-6'>
          <h1 className='font-display text-3xl font-extrabold tracking-tight text-zinc-100'>
            {t("title")}
          </h1>

          {lastSessions.length > 0 && (
            <section className='space-y-3'>
              <h2 className='flex items-center gap-2 text-base font-semibold text-zinc-200'>
                <History className='h-4 w-4 text-zinc-400' />
                {t("continue")}
              </h2>
              <div className='-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0'>
                {lastSessions.map((session) => (
                  <button
                    key={session.at}
                    type='button'
                    onClick={() => nav(session.href, `resume-${session.at}`)}
                    className={cn(PRESSABLE_KEY, "group relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full bg-zinc-800/60 py-2 pl-3.5 pr-3 text-left font-medium transition-background hover:bg-zinc-700/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring")}>
                    <Ripple className='bg-white/15' />
                    {loadingMode === `resume-${session.at}` && (
                      <Loader2 className='h-3.5 w-3.5 shrink-0 animate-spin text-zinc-200' />
                    )}
                    <span className='max-w-[200px] truncate text-sm font-medium text-zinc-200 group-hover:text-white'>
                      {session.title}
                    </span>
                    <ArrowRight className='h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-white' />
                  </button>
                ))}
              </div>
            </section>
          )}

          <div className='flex flex-col items-start gap-8 lg:flex-row'>
            <section className='w-full min-w-0 flex-1 space-y-3'>
              <h2 className='text-base font-semibold text-zinc-200'>
                {t("sections.all")}
              </h2>
              {/* Ordered by how often players open each one from this page —
                  except Boss Fights and Duels, which sit high on purpose: they
                  are new, and a spot at the bottom is how nobody finds them. */}
              <div className='space-y-0.5 rounded-lg bg-zinc-900/60 p-2'>
                {modeRow("routine", ListChecks, "/timer/plans", {
                  tag: t("tags.most_used"),
                })}
                {modeRow("songs", CassetteTape, "/songs?view=board")}
                {modeRow("learning_path", Route, "/journey", {
                  progress: modeProgress.learningPath,
                })}
                {modeRow("exercises", Search, "/profile/skills?tab=browse")}
                {modeRow("skills", Brain, "/profile/skills", {
                  progress: modeProgress.skills,
                })}
                {modeRow("duels", Swords, "/duels", { tag: t("tags.new") })}
                {modeRow("bosses", Skull, "/bosses", { tag: t("tags.new") })}
                {modeRow("auto", WandSparkles, "/timer/auto", {
                  lockLabel: isMaster ? undefined : t("lock.master"),
                })}
                {modeRow("scales", ListTree, "/scale-tree", {
                  progress: modeProgress.scaleMap,
                })}
                {modeRow("roadmaps", ClipboardList, "/ai-coach", {
                  progress: modeProgress.roadmaps,
                })}
                {modeRow("gp", SiGuitarpro, "/gp-tabs", {
                  lockLabel: isPremium ? undefined : t("lock.premium"),
                })}
              </div>
            </section>

            <aside className='w-full shrink-0 space-y-8 lg:w-80'>
              <section className='space-y-3'>
                <h2 className='text-base font-semibold text-zinc-200'>
                  {t("sections.log_time")}
                </h2>
                <div className='space-y-2 rounded-lg bg-zinc-900/60 p-3'>
                  {logButton("free_timer", Clock, "/timer/practice")}
                  {logButton("manual_log", NotebookPen, "/report")}
                </div>
              </section>

              <section className='space-y-3'>
                <h2 className='text-base font-semibold text-zinc-200'>
                  {t("sections.my_stuff")}
                </h2>
                <div className='rounded-lg bg-zinc-900/60 p-2'>
                  <nav aria-label={t("sections.my_stuff")} className='space-y-0.5'>
                    {MY_STUFF.map(({ id, Icon, href }) => (
                      <Link
                        key={id}
                        href={href}
                        className='flex min-h-11 items-center gap-3 rounded-lg px-2.5 text-sm font-medium text-zinc-200 transition-background hover:bg-zinc-800/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                        <Icon className='h-4 w-4 shrink-0 text-zinc-400' />
                        {t(`modes.${id}.title`)}
                      </Link>
                    ))}
                  </nav>
                  <div className='flex flex-wrap gap-2 px-0.5 pb-0.5 pt-3'>
                    <Link href='/plans/create' className={createLinkClass}>
                      <Plus />
                      {t("sections.create_plan")}
                    </Link>
                    <Link href='/tab-editor' className={createLinkClass}>
                      <Plus />
                      {t("sections.create_exercise")}
                    </Link>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
};
