import { useQueryClient } from "@tanstack/react-query";
import { Button, PRESSABLE_IN_GROUP } from "assets/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { EmptyState } from "components/EmptyState/EmptyState";
import { SearchInput } from "components/SearchInput/SearchInput";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { firebaseUpdateRoadmap } from "feature/aiCoach/services/roadmap.service";
import {
  firebaseStartRoadmap,
  type UserRoadmapStepResourceProgress,
} from "feature/aiCoach/services/userProgress.service";
import type { PhaseCheckResult } from "feature/aiCoach/types/phaseCheck.types";
import type {
  Roadmap,
  RoadmapPhase,
} from "feature/aiCoach/types/roadmap.types";
import { withPhaseChecks } from "feature/aiCoach/utils/phaseCheck";
import { stripProgress } from "feature/aiCoach/utils/stripProgress";
import RoadmapView from "feature/aiCoach/view/RoadmapView/RoadmapView";
import { GenerateRoadmapCard } from "feature/supporterPanel/components/GenerateRoadmapCard";
import { useOwnRoadmapPersist } from "feature/supporterPanel/hooks/useOwnRoadmapPersist";
import { useRoadmapRefine } from "feature/supporterPanel/hooks/useRoadmapRefine";
import {
  USER_ROADMAPS_KEY,
  userRoadmapDetailKey,
  useUserRoadmapDetail,
  useUserRoadmaps,
} from "feature/supporterPanel/hooks/useUserRoadmaps";
import type { SupporterWallet } from "feature/supporterPanel/types/supporterPanel.types";
import type {
  UserRoadmapDetail,
  UserRoadmapSummary,
} from "feature/supporterPanel/types/userRoadmaps.types";
import {
  arrangeOwnRoadmaps,
  arrangeRoadmaps,
  featuredRoadmap,
  isViewersRoadmap,
  type LevelFilter,
  ROADMAP_SORTS,
  type RoadmapSort,
  viewerRun,
} from "feature/supporterPanel/utils/roadmapBoard";
import {
  displayDescription,
  displayTitle,
  levelTextTone,
} from "feature/supporterPanel/utils/roadmapGoal";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { ROADMAP_LEVELS } from "lib/roadmaps/generation/levels";
import {
  ArrowRight,
  ArrowUpDown,
  Dumbbell,
  Lock,
  Map as MapIcon,
  Music,
  Play,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

const formatDate = (iso: string | null, locale?: string) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

/**
 * The stored roadmap with that player's sessions on its steps — the shape
 * RoadmapView reads, and the same merge /ai-coach does for the person whose
 * roadmap it is.
 */
const withProgress = (
  roadmap: Roadmap,
  stepProgress: Record<string, number>,
  resourceProgress: Record<string, UserRoadmapStepResourceProgress>,
  phaseChecks: Record<string, PhaseCheckResult>,
): Roadmap => ({
  ...roadmap,
  phases: withPhaseChecks(
    (roadmap.phases ?? []).map((phase) => ({
      ...phase,
      steps: (phase.steps ?? []).map((step) => ({
        ...step,
        // Not the step's own counter: on a legacy roadmap that is the owner's,
        // and the server has already folded it in when the run is theirs.
        sessionsCompleted: stepProgress[step.id] ?? 0,
        exerciseCompleted:
          resourceProgress[step.id]?.exerciseCompleted ?? false,
        completedLessonIds: resourceProgress[step.id]?.completedLessonIds ?? [],
        songCompleted: resourceProgress[step.id]?.songCompleted ?? false,
      })),
    })),
    phaseChecks,
  ),
});

/** Nothing a supporter does in the map belongs in somebody else's document. */
const doNotPersist = async () => {};

const PlayerAvatar = ({
  summary,
  className,
}: {
  summary: UserRoadmapSummary;
  className?: string;
}) => (
  <span
    className={cn(
      "h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800",
      className,
    )}>
    {summary.avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={summary.avatar} alt='' className='h-full w-full object-cover' />
    ) : (
      <span className='flex h-full w-full items-center justify-center text-zinc-500'>
        <User size={14} />
      </span>
    )}
  </span>
);

/**
 * The roadmap's shape: one segment per phase, as wide as its steps, filled
 * with the steps the run has finished — emerald once a phase is through.
 * Drawn on every card, started or not: the shape says how the roadmap is
 * built, which an empty progress bar never did.
 */
const PhaseStrip = ({
  sizes,
  done,
  className,
}: {
  sizes: number[];
  done: number[];
  className?: string;
}) => (
  <span aria-hidden className={cn("flex h-1.5 w-full gap-1", className)}>
    {sizes.map((size, index) => {
      const finished = Math.min(done[index] ?? 0, size);
      const complete = size > 0 && finished === size;
      return (
        <span
          key={index}
          className='relative h-full min-w-1.5 overflow-hidden rounded-full bg-zinc-800'
          style={{ flex: `${Math.max(size, 1)} 1 0%` }}>
          {finished > 0 && (
            <span
              className={cn(
                "absolute inset-y-0 left-0 rounded-full",
                complete ? "bg-emerald-400" : "bg-cyan-400",
              )}
              style={{ width: `${(finished / size) * 100}%` }}
            />
          )}
        </span>
      );
    })}
  </span>
);

/**
 * The owner's own roadmap with the paid refining kit switched on.
 *
 * A component of its own so the wallet hook only runs while refining, and so
 * leaving the mode remounts the plain map on whatever the refinements saved.
 * A change to the plan goes into the roadmap document without the owner's
 * progress on it; the progress keeps going where it always went.
 */
const RefinableRoadmapView = ({
  summary,
  roadmap,
  onPersist,
}: {
  summary: UserRoadmapSummary;
  roadmap: Roadmap;
  onPersist: (phases: RoadmapPhase[]) => Promise<void>;
}) => {
  const refine = useRoadmapRefine(summary.id);
  const queryClient = useQueryClient();

  const saveContent = useCallback(
    async (phases: RoadmapPhase[]) => {
      const stored = stripProgress(phases);
      await firebaseUpdateRoadmap(summary.id, { phases: stored });
      queryClient.setQueryData<UserRoadmapDetail>(
        userRoadmapDetailKey(summary.userId, summary.id),
        (prev) =>
          prev
            ? { ...prev, roadmap: { ...prev.roadmap, phases: stored } }
            : prev,
      );
    },
    [queryClient, summary.id, summary.userId],
  );

  return (
    <RoadmapView
      key={`${summary.rowId}-refine`}
      roadmap={roadmap}
      onPersist={onPersist}
      refine={refine}
      onContentChange={saveContent}
    />
  );
};

/**
 * One player's roadmap, drawn by the same map, drawer and finish node as
 * /ai-coach. For the viewer's own generated roadmap, a step actually saves,
 * the same way /ai-coach does it, and refine mode lets them have the coach
 * redo what is off, for tokens.
 *
 * Somebody else's public roadmap is read-only until the viewer presses "Start
 * this roadmap": from then on it is theirs to work through — their own
 * progress, saved under their own uid, the owner's untouched — for free,
 * since the roadmap already exists. Refining stays the owner's.
 */
const RoadmapDetail = ({
  summary,
  viewerUid,
  refining,
  onToggleRefine,
  onBack,
  variant,
}: {
  summary: UserRoadmapSummary;
  viewerUid: string | null;
  refining: boolean;
  onToggleRefine: () => void;
  onBack: () => void;
  variant: UserRoadmapsTabVariant;
}) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const isPage = variant === "page";
  const isOwn = viewerUid != null && viewerUid === summary.userId;
  const [startedHere, setStartedHere] = useState(false);
  const [starting, setStarting] = useState(false);
  const isFollowing =
    !isOwn &&
    viewerUid != null &&
    (summary.viewerProgress != null || startedHere);
  const runnerUid = isFollowing ? viewerUid : summary.userId;
  const { data, isLoading } = useUserRoadmapDetail(
    summary.id,
    summary.userId,
    isFollowing ? viewerUid : null,
  );
  const ownPersist = useOwnRoadmapPersist(
    summary.userId,
    summary.id,
    runnerUid,
  );
  const canWrite = isOwn || isFollowing;
  const queryClient = useQueryClient();

  const startRoadmap = async () => {
    if (!viewerUid || starting) return;
    setStarting(true);
    try {
      await firebaseStartRoadmap(viewerUid, summary.id);
      setStartedHere(true);
      void queryClient.invalidateQueries({
        queryKey: USER_ROADMAPS_KEY,
        exact: true,
      });
      toast.success(t("panel.players.started"));
    } catch {
      toast.error(t("panel.players.start_failed"));
    } finally {
      setStarting(false);
    }
  };

  const roadmap = useMemo(
    () =>
      data
        ? withProgress(
            data.roadmap,
            data.stepProgress,
            data.resourceProgress ?? {},
            data.phaseChecks,
          )
        : null,
    [data],
  );

  const backButton = <BackLink label={t("panel.brief.back")} onClick={onBack} />;

  const startButton =
    !isOwn && !isFollowing && viewerUid && roadmap ? (
      <Button
        type='button'
        size='lg'
        onClick={() => void startRoadmap()}
        disabled={starting}
        className='w-fit'>
        <Play />
        {starting ? t("panel.players.starting") : t("panel.players.start")}
      </Button>
    ) : null;

  const refineToggle =
    isOwn && roadmap ? (
      <button
        type='button'
        onClick={onToggleRefine}
        aria-pressed={refining}
        className={cn(
          "flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          refining
            ? "bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
            : "bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
        )}>
        <Sparkles className='h-4 w-4' />
        {refining
          ? t("panel.players.done_refining")
          : t("panel.players.refine")}
      </button>
    ) : null;

  return (
    <div className={cn("flex w-full flex-col", !isPage && "gap-6")}>
      <HeroBanner
        title={displayTitle(summary)}
        // The description when there is one; the level and size otherwise —
        // the map's own header says those again right below.
        subtitle={
          displayDescription(summary) ??
          [
            summary.level &&
              t(`ai_coach:levels.${summary.level}`, summary.level),
            t("ai_coach:n_phases", { count: summary.phaseCount }),
            t("ai_coach:n_steps", { count: summary.stepCount }),
            summary.visibility === "private"
              ? t("panel.generate.visibility.private.label")
              : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        eyebrow={summary.displayName ?? t("panel.players.unknown")}
        backgroundContent={<HeroPattern variant='ai' />}
        // Full-bleed on its own page; inside the panel's tab it is a card.
        className={cn(!isPage && "rounded-lg")}
        rightContent={
          <div className='flex flex-wrap items-center gap-2'>
            {startButton}
            {refineToggle}
            {backButton}
          </div>
        }
      />

      <div
        className={cn(
          "flex w-full flex-col gap-6",
          isPage && "mx-auto p-4 sm:p-6 md:gap-8 md:p-10 lg:p-12",
        )}>
        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} variant='block' className='h-12' />
            ))}
          </div>
        ) : !roadmap ? (
          <p className='text-sm text-zinc-400'>{t("panel.players.gone")}</p>
        ) : (
          <>
            {!isOwn && !isFollowing && (
              <p className='text-sm text-zinc-500'>
                {t("panel.players.someone_else")}
              </p>
            )}

            {isFollowing && (
              <p className='text-sm text-zinc-500'>
                {t("panel.players.following_note", {
                  name: summary.displayName ?? t("panel.players.another"),
                })}
              </p>
            )}

            {isOwn && refining && (
              <p className='text-sm text-zinc-400'>
                {t("panel.players.refine_note")}
              </p>
            )}

            {isOwn && refining ? (
              <RefinableRoadmapView
                summary={summary}
                roadmap={roadmap}
                onPersist={ownPersist}
              />
            ) : (
              <RoadmapView
                key={`${summary.rowId}-${runnerUid}`}
                roadmap={roadmap}
                onPersist={canWrite ? ownPersist : doNotPersist}
                readOnly={!canWrite}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * One roadmap on the board, laid out like the curated cards on /ai-coach: the
 * name, the level and size, the goal, the shape of the phases, and the step a
 * session would start on — the one thing a card can say about what to do next.
 *
 * The author line is only there when it says something: on the viewer's own
 * roadmaps it would be their own name on every card of the section.
 *
 * The numbers are only ever the viewer's own run: their roadmap, or one they
 * follow. On anybody else's roadmap the owner's progress is not shown at all —
 * the card offers the first step instead.
 */
const RoadmapTile = ({
  summary,
  viewerUid,
  onOpen,
  featured = false,
}: {
  summary: UserRoadmapSummary;
  viewerUid: string | null;
  onOpen: () => void;
  /**
   * The roadmap under way, drawn wide at the head of "Your roadmaps": the
   * name and goal on one side, the phases and the next step on the other.
   */
  featured?: boolean;
}) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const intl = useIntlLocale();
  const isOwn = viewerUid != null && viewerUid === summary.userId;
  const run = viewerRun(summary, viewerUid);
  const following = summary.viewerProgress != null;
  const started = !!run && run.sessionsCompleted > 0;
  const complete =
    !!run && summary.stepCount > 0 && run.completedSteps >= summary.stepCount;
  const title = displayTitle(summary);
  const description = displayDescription(summary);
  const created = formatDate(
    following ? (summary.viewerProgress?.startedAt ?? null) : summary.createdAt,
    intl,
  );
  const practised = formatDate(run?.lastPractisedAt ?? null, intl);
  // A listing from before the per-phase counts: even segments, nothing filled.
  const phaseSizes = summary.phaseSteps?.length
    ? summary.phaseSteps
    : Array.from({ length: summary.phaseCount }, () => 1);
  const nextStep = run ? run.nextStep : summary.firstStep;

  const nextLabel = complete
    ? t("ai_coach:card.all_done")
    : started
      ? t("ai_coach:card.up_next")
      : run
        ? t("ai_coach:card.first_step")
        : t("panel.players.first_step");
  const action = !run
    ? t("panel.players.view")
    : complete
      ? t("ai_coach:card.review")
      : started
        ? t("ai_coach:card.continue")
        : t("ai_coach:card.start");

  const author = !isOwn && (
    <span className='flex w-full items-center gap-2.5'>
      <PlayerAvatar summary={summary} className='h-6 w-6' />
      <span className='min-w-0 flex-1 truncate text-sm text-zinc-400'>
        {following
          ? t("panel.by", {
              name: summary.displayName ?? t("panel.players.unknown"),
            })
          : (summary.displayName ?? t("panel.players.unknown"))}
      </span>
    </span>
  );

  const heading = (
    <span className='flex flex-col gap-2.5'>
      <span
        className={cn(
          "line-clamp-2 break-words font-bold leading-tight tracking-tight text-zinc-100",
          featured ? "text-2xl md:text-3xl" : "text-xl",
        )}>
        {title}
      </span>
      <span className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400'>
        {summary.level && (
          <span
            className={cn(
              "inline-flex items-center gap-2 font-medium",
              levelTextTone(summary.level),
            )}>
            <span aria-hidden className='h-1.5 w-1.5 rounded-full bg-current' />
            {t(`ai_coach:levels.${summary.level}`, summary.level)}
          </span>
        )}
        <span className='tabular-nums'>
          {t("ai_coach:phases_steps", {
            phases: summary.phaseCount,
            steps: summary.stepCount,
          })}
        </span>
        <span className='flex items-center gap-3 tabular-nums text-zinc-500'>
          <span
            className='flex items-center gap-1.5'
            title={t("panel.players.exercises")}>
            <Dumbbell className='h-3.5 w-3.5' aria-hidden />
            <span className='sr-only'>{t("panel.players.exercises")}</span>
            {summary.exerciseSteps}
          </span>
          {summary.songSteps > 0 && (
            <span
              className='flex items-center gap-1.5'
              title={t("panel.players.songs")}>
              <Music className='h-3.5 w-3.5' aria-hidden />
              <span className='sr-only'>{t("panel.players.songs")}</span>
              {summary.songSteps}
            </span>
          )}
          <span
            className='flex items-center gap-1.5'
            title={t("panel.players.lessons")}>
            <FaYoutube className='h-3.5 w-3.5' aria-hidden />
            <span className='sr-only'>{t("panel.players.lessons")}</span>
            {summary.lessonSteps}
          </span>
        </span>
        {summary.visibility === "private" && (
          <span className='flex items-center gap-1.5'>
            <Lock className='h-3.5 w-3.5' aria-hidden />
            {t("panel.generate.visibility.private.label")}
          </span>
        )}
        {summary.followerCount > 0 && (
          <span className='flex items-center gap-1.5'>
            <Users className='h-3.5 w-3.5' aria-hidden />
            {t("panel.players.following_count", {
              count: summary.followerCount,
            })}
          </span>
        )}
      </span>
    </span>
  );

  const descriptionText = description && (
    <span
      className={cn(
        "text-sm leading-relaxed text-zinc-400",
        featured ? "line-clamp-3" : "line-clamp-2",
      )}>
      {description}
    </span>
  );

  const progress = (
    <span className='flex flex-col gap-2.5'>
      <PhaseStrip
        sizes={phaseSizes}
        done={run?.phaseDone ?? []}
        className={featured ? "h-2" : undefined}
      />
      <span className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-zinc-500'>
        {started && run ? (
          <>
            <span className='tabular-nums text-zinc-300'>
              {t("ai_coach:steps_of", {
                done: run.completedSteps,
                total: summary.stepCount,
              })}{" "}
              ·{" "}
              {t("ai_coach:refine.sessions", {
                count: run.sessionsCompleted,
              })}
            </span>
            {practised && (
              <span>
                {t("panel.players.last_practised", { date: practised })}
              </span>
            )}
          </>
        ) : (
          <span>
            {following
              ? t("panel.players.following_none")
              : t("panel.players.not_started")}
            {created
              ? ` · ${following ? t("panel.players.started_on", { date: created }) : t("panel.players.created_on", { date: created })}`
              : ""}
          </span>
        )}
      </span>
    </span>
  );

  const footer = (
    <span className='mt-auto flex w-full flex-wrap items-end justify-between gap-4'>
      <span className='flex min-w-0 flex-1 basis-40 flex-col gap-1'>
        {nextStep !== undefined && (
          <>
            <span
              className={cn(
                "text-sm",
                complete ? "text-emerald-300" : "text-zinc-500",
              )}>
              {nextLabel}
            </span>
            <span
              className={cn(
                "line-clamp-2 font-medium leading-relaxed text-zinc-200",
                featured ? "text-base" : "text-sm",
              )}>
              {nextStep ?? t("ai_coach:card.revisit")}
            </span>
          </>
        )}
      </span>
      {/* The whole card is the button; this only says what pressing it does. */}
      <span
        aria-hidden
        className={cn(
          PRESSABLE_IN_GROUP,
          "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
          run
            ? "border-b-black/25 bg-primary text-primary-foreground group-hover:bg-primary/90"
            : "border-b-black/30 bg-zinc-800 text-zinc-200 group-hover:bg-zinc-700",
        )}>
        {action}
        <ArrowRight size={16} />
      </span>
    </span>
  );

  // Wide, it sits a shade lighter than the grid under it — set apart by its
  // ground, not by a frame.
  return featured ? (
    <button
      type='button'
      onClick={onOpen}
      className='group grid w-full gap-8 rounded-lg bg-zinc-800/40 p-6 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/60 md:p-8 lg:grid-cols-2 lg:gap-12'>
      <span className='flex min-w-0 flex-col gap-5'>
        {author}
        {heading}
        {descriptionText}
      </span>
      <span className='flex min-w-0 flex-col gap-8 lg:justify-center'>
        {progress}
        {footer}
      </span>
    </button>
  ) : (
    <button
      type='button'
      onClick={onOpen}
      className='group flex h-full w-full flex-col gap-5 rounded-lg bg-zinc-800/40 p-5 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800/60 sm:p-6'>
      {author}
      {heading}
      {descriptionText}
      {progress}
      {footer}
    </button>
  );
};

const TileGrid = ({
  summaries,
  viewerUid,
  onOpen,
}: {
  summaries: UserRoadmapSummary[];
  viewerUid: string | null;
  onOpen: (summary: UserRoadmapSummary) => void;
}) => (
  <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
    {summaries.map((summary) => (
      <RoadmapTile
        key={summary.rowId}
        summary={summary}
        viewerUid={viewerUid}
        onOpen={() => onOpen(summary)}
      />
    ))}
  </div>
);

/**
 * Where the tab sits. The supporter panel draws the open roadmap inside the
 * panel, under its own banner; /ai-coach hides its banner and tabs while one
 * is open and lets the roadmap's banner run edge to edge, like a curated one.
 */
export type UserRoadmapsTabVariant = "panel" | "page";

/**
 * The roadmaps the AI generated for the players, with how far each one got.
 * Supporters see a name, a goal and the progress — the same things the wall
 * and the feed already show. Uids stay off the rows.
 */
export const UserRoadmapsTab = ({
  enabled,
  wallet,
  variant = "panel",
  onDetailChange,
  initialRoadmapId = null,
}: {
  enabled: boolean;
  /** The signed-in supporter's wallet, for the price on the generator card. */
  wallet?: SupporterWallet;
  variant?: UserRoadmapsTabVariant;
  /** Told when a roadmap opens or closes, so the page can hide its own chrome. */
  onDetailChange?: (open: boolean) => void;
  /** A roadmap to open once the list is in — the link in a "roadmap ready" notification. */
  initialRoadmapId?: string | null;
}) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const { data, isLoading } = useUserRoadmaps(enabled);
  const [openRow, setOpenRowState] = useState<UserRoadmapSummary | null>(null);
  // Waits for the list rather than for an effect: the row is looked up on
  // every render until it is there, then cleared on the way back.
  const [pendingId, setPendingId] = useState<string | null>(initialRoadmapId);
  // Refine mode is on straight after a generation, and off for a row opened
  // from the list — reading first, refining on request.
  const [refining, setRefining] = useState(false);
  const [term, setTerm] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [sort, setSort] = useState<RoadmapSort>("recent");
  const queryClient = useQueryClient();

  const userAuth = useAppSelector(selectUserAuth);
  const viewerUid = typeof userAuth === "string" ? userAuth : null;

  const roadmaps = useMemo(() => data ?? [], [data]);

  const setOpenRow = (next: UserRoadmapSummary | null) => {
    setOpenRowState(next);
    setPendingId(null);
    onDetailChange?.(next !== null);
  };

  /**
   * The list is re-fetched right after saving, so the new roadmap's own row
   * exists to open — falling back to just closing the generator card if the
   * refetch and the write ever race.
   */
  const openGenerated = async (roadmapId: string) => {
    await queryClient.invalidateQueries({ queryKey: USER_ROADMAPS_KEY });
    const fresh =
      queryClient.getQueryData<UserRoadmapSummary[]>(USER_ROADMAPS_KEY);
    const generated = fresh?.find((summary) => summary.id === roadmapId);
    if (generated) {
      setRefining(true);
      setOpenRow(generated);
    }
  };

  /**
   * Back to the list. After refining, the row's counts — steps, exercises,
   * songs — may be stale, so the listing alone is refetched; the detail is
   * kept, its cache was updated with every change.
   */
  const closeRow = () => {
    if (refining) {
      void queryClient.invalidateQueries({
        queryKey: USER_ROADMAPS_KEY,
        exact: true,
      });
    }
    setRefining(false);
    setOpenRow(null);
  };

  const openFromList = (summary: UserRoadmapSummary) => {
    setRefining(false);
    setOpenRow(summary);
  };

  // The viewer's own roadmaps — the ones they generated and the ones they
  // started — stand apart from the board, above it: they are what the viewer
  // came back for, so the board's filters never hide them. The one under way
  // goes up front, wide.
  const own = useMemo(
    () =>
      arrangeOwnRoadmaps(
        roadmaps.filter((summary) => isViewersRoadmap(summary, viewerUid)),
        viewerUid,
      ),
    [roadmaps, viewerUid],
  );
  const featured = featuredRoadmap(own, viewerUid);
  const ownRest = featured
    ? own.filter((summary) => summary !== featured)
    : own;

  const board = useMemo(
    () => roadmaps.filter((summary) => !isViewersRoadmap(summary, viewerUid)),
    [roadmaps, viewerUid],
  );
  const others = useMemo(() => {
    const arranged = arrangeRoadmaps(board, { level, sort });
    const needle = term.trim().toLowerCase();
    if (!needle) return arranged;
    return arranged.filter((roadmap) =>
      [
        roadmap.goal,
        roadmap.title,
        roadmap.displayName,
        roadmap.userId,
        roadmap.id,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    );
  }, [board, term, level, sort]);

  const pendingRow =
    !openRow && pendingId
      ? (roadmaps.find((summary) => summary.id === pendingId) ?? null)
      : null;
  const shownRow = openRow ?? pendingRow;

  if (!shownRow && pendingId) {
    return isLoading ? (
      <Skeleton variant='block' className='h-72' />
    ) : (
      <div className='flex flex-col items-start gap-4 rounded-lg bg-zinc-800/40 p-6 md:p-8'>
        <p className='text-sm text-zinc-400'>
          {t("panel.players.not_on_board")}
        </p>
        <BackLink label={t("panel.players.back_to_list")} onClick={closeRow} />
      </div>
    );
  }

  if (shownRow) {
    return (
      <RoadmapDetail
        summary={shownRow}
        viewerUid={viewerUid}
        refining={refining}
        onToggleRefine={() => setRefining((value) => !value)}
        onBack={closeRow}
        variant={variant}
      />
    );
  }

  return (
    <div className='space-y-12'>
      <GenerateRoadmapCard onGenerated={openGenerated} wallet={wallet} />

      {isLoading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} variant='block' className='h-44' />
          ))}
        </div>
      ) : !roadmaps.length ? (
        <EmptyState
          icon={<MapIcon />}
          title={t("panel.players.empty_title")}
          description={t("panel.players.empty_body")}
        />
      ) : (
        <>
          {own.length > 0 && (
            <section className='space-y-5'>
              <SectionHeader
                title={t("panel.players.yours")}
                count={own.length}
                size='lg'
                className='mb-0'
              />
              {featured && (
                <RoadmapTile
                  featured
                  summary={featured}
                  viewerUid={viewerUid}
                  onOpen={() => openFromList(featured)}
                />
              )}
              {ownRest.length > 0 && (
                <TileGrid
                  summaries={ownRest}
                  viewerUid={viewerUid}
                  onOpen={openFromList}
                />
              )}
            </section>
          )}

          {board.length > 0 && (
            <section className='space-y-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <SectionHeader
                  title={t("panel.players.others")}
                  count={others.length}
                  size='lg'
                  className='mb-0'
                />

                <SearchInput
                  containerClassName='sm:max-w-xs'
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder={t("panel.players.filter")}
                  aria-label={t("panel.players.filter")}
                />
              </div>

              <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                <SegmentedControl
                  label={t("panel.generate.level")}
                  options={["all", ...ROADMAP_LEVELS].map((candidate) => ({
                    value: candidate,
                    label:
                      candidate === "all"
                        ? t("panel.players.all_levels")
                        : t(`ai_coach:levels.${candidate}`, candidate),
                  }))}
                  selected={[level]}
                  onSelect={setLevel}
                />

                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as RoadmapSort)}>
                  <SelectTrigger
                    aria-label={t("panel.players.sort_by")}
                    className='h-10 w-full gap-2 px-3 text-sm font-semibold text-zinc-200 md:w-48'>
                    <span className='flex items-center gap-1.5 text-zinc-500'>
                      <ArrowUpDown size={14} aria-hidden />
                    </span>
                    <SelectValue>
                      {t(
                        `panel.players.sorts.${sort}`,
                        ROADMAP_SORTS.find((option) => option.id === sort)
                          ?.label ?? sort,
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ROADMAP_SORTS.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {t(`panel.players.sorts.${option.id}`, option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {others.length > 0 ? (
                <TileGrid
                  summaries={others}
                  viewerUid={viewerUid}
                  onOpen={openFromList}
                />
              ) : (
                <EmptyState
                  mood='lookAround'
                  size='compact'
                  title={t("panel.players.no_match")}
                />
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};
