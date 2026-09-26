import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { cn } from "assets/lib/utils";
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
  arrangeRoadmaps,
  type LevelFilter,
  ROADMAP_SORTS,
  type RoadmapSort,
} from "feature/supporterPanel/utils/roadmapBoard";
import {
  displayDescription,
  displayTitle,
  levelTone,
} from "feature/supporterPanel/utils/roadmapGoal";
import { selectUserAuth } from "feature/user/store/userSlice";
import { ROADMAP_LEVELS } from "lib/roadmaps/generation/levels";
import {
  ArrowLeft,
  ArrowUpDown,
  Dumbbell,
  Lock,
  Map as MapIcon,
  Music,
  Play,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, {
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

const Pill = ({ tone, children }: { tone: string; children: string }) => (
  <span
    className={cn(
      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold",
      tone,
    )}>
    {children}
  </span>
);

const PlayerAvatar = ({ summary }: { summary: UserRoadmapSummary }) => (
  <span className='h-8 w-8 shrink-0 overflow-hidden rounded-full bg-zinc-800'>
    {summary.avatar ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={summary.avatar} alt='' className='h-full w-full object-cover' />
    ) : (
      <span className='flex h-full w-full items-center justify-center text-zinc-500'>
        <User size={16} />
      </span>
    )}
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
      toast.success("Roadmap started — your progress on it is your own.");
    } catch {
      toast.error("Could not start this roadmap. Try again.");
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

  const backButton = (
    <button
      type='button'
      onClick={onBack}
      className='flex w-fit items-center gap-2 rounded-lg bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800 hover:text-zinc-200'>
      <ArrowLeft className='h-4 w-4' />
      Back
    </button>
  );

  const startButton =
    !isOwn && !isFollowing && viewerUid && roadmap ? (
      <button
        type='button'
        onClick={() => void startRoadmap()}
        disabled={starting}
        className='flex w-fit items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-zinc-950 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:cursor-wait disabled:opacity-70 hover:bg-cyan-400'>
        <Play className='h-4 w-4' />
        {starting ? "Starting…" : "Start this roadmap"}
      </button>
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
        {refining ? "Done refining" : "Refine"}
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
            summary.level,
            `${summary.phaseCount} phases`,
            `${summary.stepCount} steps`,
            summary.visibility === "private" ? "Private" : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
        eyebrow={summary.displayName ?? "Unknown player"}
        backgroundContent={<HeroPattern variant='ai' />}
        className={cn(
          "min-h-[100px] w-full !shadow-none md:min-h-[90px] lg:min-h-[100px]",
          isPage && "!rounded-none",
        )}
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
              <div
                key={index}
                className='h-12 animate-pulse rounded-lg bg-zinc-900/40'
              />
            ))}
          </div>
        ) : !roadmap ? (
          <p className='text-sm text-zinc-400'>
            Nothing is left of this roadmap but the progress counters.
          </p>
        ) : (
          <>
            {!isOwn && !isFollowing && (
              <p className='text-sm text-zinc-500'>
                Somebody else&apos;s roadmap. Press Start this roadmap to work
                through it yourself, free, with your own progress.
              </p>
            )}

            {isFollowing && (
              <p className='text-sm text-zinc-500'>
                You are working through{" "}
                {summary.displayName ?? "another player"}&apos;s roadmap. The
                progress on the map is yours; theirs stays their own.
              </p>
            )}

            {isOwn && refining && (
              <p className='text-sm text-zinc-400'>
                Refine mode. Use the wand next to a step on the map to have the
                coach rewrite it, swap its exercise, search its lessons or its
                song again, or add a step after it — each for a token or two,
                saved to your roadmap straight away. Removing a step is free.
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
 * One roadmap on the board — the player, their goal and how far they got.
 * Most roadmaps on the board were never started, so the progress bar is only
 * drawn once there is progress to draw; an empty bar on every card says
 * nothing and makes the grid look unfinished.
 *
 * The numbers are only ever the viewer's own run: their roadmap, or one they
 * follow. On anybody else's roadmap the owner's progress is not shown at all.
 */
const RoadmapTile = ({
  summary,
  viewerUid,
  onOpen,
}: {
  summary: UserRoadmapSummary;
  viewerUid: string | null;
  onOpen: () => void;
}) => {
  const isOwn = viewerUid != null && viewerUid === summary.userId;
  const run = summary.viewerProgress ?? (isOwn ? summary : null);
  const following = summary.viewerProgress != null;
  const percent =
    run && summary.stepCount
      ? Math.round((run.completedSteps / summary.stepCount) * 100)
      : 0;
  const started = !!run && run.sessionsCompleted > 0;
  const created = formatDate(
    following ? (summary.viewerProgress?.startedAt ?? null) : summary.createdAt,
  );
  const practised = formatDate(run?.lastPractisedAt ?? null);

  return (
    <button
      type='button'
      onClick={onOpen}
      className='group flex h-full w-full flex-col gap-4 rounded-lg bg-zinc-900/40 p-5 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-900/70'>
      <span className='flex w-full items-center gap-3'>
        <PlayerAvatar summary={summary} />
        <span className='min-w-0 flex-1 truncate text-sm text-zinc-400'>
          {following ? "by " : ""}
          {summary.displayName ?? "Unknown player"}
        </span>
        {summary.visibility === "private" && (
          <span className='flex shrink-0 items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-bold text-zinc-400'>
            <Lock size={11} />
            Private
          </span>
        )}
        {summary.level && (
          <Pill tone={levelTone(summary.level)}>{summary.level}</Pill>
        )}
      </span>

      <span className='flex flex-col gap-1.5'>
        <span className='line-clamp-2 text-base font-bold leading-snug text-zinc-100'>
          {displayTitle(summary)}
        </span>
        {displayDescription(summary) && (
          <span className='line-clamp-2 text-sm leading-relaxed text-zinc-400'>
            {displayDescription(summary)}
          </span>
        )}
      </span>

      <span className='mt-auto flex w-full flex-col gap-3'>
        <span className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-500'>
          <span>
            {summary.phaseCount} phases · {summary.stepCount} steps
          </span>
          <span className='flex items-center gap-1.5' title='Exercises'>
            <Dumbbell size={13} />
            {summary.exerciseSteps}
          </span>
          {summary.songSteps > 0 && (
            <span className='flex items-center gap-1.5' title='Songs'>
              <Music size={13} />
              {summary.songSteps}
            </span>
          )}
          <span className='flex items-center gap-1.5' title='Video lessons'>
            <FaYoutube size={13} />
            {summary.lessonSteps}
          </span>
          {summary.followerCount > 0 && (
            <span className='flex items-center gap-1.5'>
              <Users size={13} />
              {summary.followerCount}{" "}
              {summary.followerCount === 1 ? "player" : "players"} following
            </span>
          )}
        </span>

        {started && run ? (
          <span className='flex w-full items-center gap-4'>
            <span className='h-1 flex-1 overflow-hidden rounded-full bg-zinc-800'>
              <span
                className='block h-full rounded-full bg-cyan-400'
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className='shrink-0 text-sm tabular-nums text-zinc-400'>
              {run.completedSteps}/{summary.stepCount} steps ·{" "}
              {run.sessionsCompleted} sessions
            </span>
          </span>
        ) : (
          <span className='text-sm text-zinc-500'>
            {following ? "Following, no sessions yet" : "Not started yet"}
            {created
              ? ` · ${following ? "started" : "created"} ${created}`
              : ""}
          </span>
        )}
        {started && practised && (
          <span className='-mt-1 text-sm text-zinc-500'>
            Last practised {practised}
          </span>
        )}
      </span>
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

const SectionHeading = ({ title, count }: { title: string; count: number }) => (
  <h2 className='flex items-baseline gap-2 text-sm font-bold text-zinc-200'>
    {title}
    <span className='font-normal tabular-nums text-zinc-500'>{count}</span>
  </h2>
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

  const filtered = useMemo(() => {
    const arranged = arrangeRoadmaps(roadmaps, { level, sort });
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
  }, [roadmaps, term, level, sort]);

  // The viewer's own roadmaps first — the ones they generated and the ones
  // they started — because those are what they came back for.
  const isMine = (summary: UserRoadmapSummary) =>
    summary.userId === viewerUid || summary.viewerProgress != null;
  const own = filtered.filter(isMine);
  const others = filtered.filter((summary) => !isMine(summary));

  const playerCount = useMemo(
    () => new Set(roadmaps.map((roadmap) => roadmap.userId)).size,
    [roadmaps],
  );

  const pendingRow =
    !openRow && pendingId
      ? (roadmaps.find((summary) => summary.id === pendingId) ?? null)
      : null;
  const shownRow = openRow ?? pendingRow;

  if (!shownRow && pendingId) {
    return isLoading ? (
      <div className='h-72 animate-pulse rounded-lg bg-zinc-900/40' />
    ) : (
      <div className='flex flex-col items-start gap-4 rounded-lg bg-zinc-900/40 p-6 md:p-8'>
        <p className='text-sm text-zinc-400'>
          That roadmap is not on the board any more.
        </p>
        <button
          type='button'
          onClick={closeRow}
          className='flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-700'>
          <ArrowLeft className='h-4 w-4' />
          Back to Player Roadmaps
        </button>
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
    <div className='space-y-10'>
      <GenerateRoadmapCard onGenerated={openGenerated} wallet={wallet} />

      {isLoading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3'>
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className='h-44 animate-pulse rounded-lg bg-zinc-900/40'
            />
          ))}
        </div>
      ) : !roadmaps.length ? (
        <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
          <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
            <MapIcon size={26} />
          </span>
          <h3 className='mb-2 text-lg font-bold text-zinc-100'>
            No roadmaps yet
          </h3>
          <p className='max-w-sm text-sm text-zinc-400'>
            This is where the roadmaps players generate for themselves show up.
          </p>
        </div>
      ) : (
        <>
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-zinc-400'>
              <span className='font-semibold tabular-nums text-zinc-200'>
                {roadmaps.length}
              </span>{" "}
              roadmaps from{" "}
              <span className='font-semibold tabular-nums text-zinc-200'>
                {playerCount}
              </span>{" "}
              {playerCount === 1 ? "player" : "players"}
            </p>

            <div className='relative w-full sm:max-w-xs'>
              <Search
                size={15}
                className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500'
              />
              <input
                type='text'
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder='Filter by goal or player…'
                className='w-full rounded-lg bg-zinc-900/60 py-2.5 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700'
              />
            </div>
          </div>

          <div className='-mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <div
              role='group'
              aria-label='Level'
              className='flex flex-wrap gap-1 rounded-lg bg-zinc-900/40 p-1'>
              {["all", ...ROADMAP_LEVELS].map((candidate) => (
                <button
                  key={candidate}
                  type='button'
                  onClick={() => setLevel(candidate)}
                  aria-pressed={level === candidate}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-zinc-500",
                    level === candidate
                      ? "bg-zinc-700 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                  )}>
                  {candidate === "all" ? "All levels" : candidate}
                </button>
              ))}
            </div>

            <Select
              value={sort}
              onValueChange={(value) => setSort(value as RoadmapSort)}>
              <SelectTrigger
                aria-label='Sort by'
                className='h-10 w-full gap-2 border-0 bg-zinc-900/60 px-3 text-sm font-semibold text-zinc-200 md:w-48'>
                <span className='flex items-center gap-1.5 text-zinc-500'>
                  <ArrowUpDown size={14} aria-hidden />
                </span>
                <SelectValue>
                  {ROADMAP_SORTS.find((option) => option.id === sort)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ROADMAP_SORTS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {own.length > 0 && (
            <section className='space-y-4'>
              <SectionHeading title='Your roadmaps' count={own.length} />
              <TileGrid
                summaries={own}
                viewerUid={viewerUid}
                onOpen={openFromList}
              />
            </section>
          )}

          {others.length > 0 && (
            <section className='space-y-4'>
              <SectionHeading
                title='From other players'
                count={others.length}
              />
              <TileGrid
                summaries={others}
                viewerUid={viewerUid}
                onOpen={openFromList}
              />
            </section>
          )}

          {!filtered.length && (
            <p className='py-10 text-center text-sm text-zinc-400'>
              Nothing matches this filter.
            </p>
          )}
        </>
      )}
    </div>
  );
};
