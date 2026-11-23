import { useQueryClient } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { EmptyState } from "components/EmptyState/EmptyState";
import { SearchInput } from "components/SearchInput/SearchInput";
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
import {
  roadFromCounts,
  RoadmapSummaryCard,
} from "feature/aiCoach/view/RoadmapCard/RoadmapSummaryCard";
import RoadmapView from "feature/aiCoach/view/RoadmapView/RoadmapView";
import { AssistantRoadmapDialog } from "feature/supporterPanel/components/AssistantRoadmapDialog";
import { RoadmapBuilder } from "feature/supporterPanel/components/RoadmapBuilder";
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
  isViewersRoadmap,
  type LevelFilter,
  viewerRun,
} from "feature/supporterPanel/utils/roadmapBoard";
import {
  displayDescription,
  displayTitle,
} from "feature/supporterPanel/utils/roadmapGoal";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { ROADMAP_LEVELS } from "lib/roadmaps/generation/levels";
import { IN_APP_ROADMAP_GENERATION } from "lib/roadmaps/generationSwitch";
import { Lock, Map as MapIcon, Play, Sparkles, User } from "lucide-react";
import { useRouter } from "next/router";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

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
        practiceSessions: resourceProgress[step.id]?.practiceSessions ?? 0,
      })),
    })),
    phaseChecks,
  ),
});

/** Nothing a supporter does in the map belongs in somebody else's document. */
const doNotPersist = async () => {};

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
  const router = useRouter();
  // The step the map had open — a refresh, or the way back from the step's
  // exercise or song, lands on it again. Read once: the map owns it after.
  const [initialStepId] = useState(() =>
    typeof router.query.step === "string" ? router.query.step : undefined,
  );
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

  const backButton = (
    <BackLink label={t("panel.brief.back")} onClick={onBack} />
  );

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

  // Refine ran on our own model; with in-app generation closed, a roadmap
  // is changed by the assistant that wrote it.
  const refineToggle =
    IN_APP_ROADMAP_GENERATION && isOwn && roadmap ? (
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
                initialStepId={initialStepId}
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

/** A listing from before the per-phase counts: the finished steps, laid along the road in order. */
const sequentialDone = (sizes: number[], completed: number): number[] => {
  let left = completed;
  return sizes.map((size) => {
    const taken = Math.min(size, left);
    left -= taken;
    return taken;
  });
};

/** `total` steps split as evenly as they go over `phases` phases. */
const evenSizes = (total: number, phases: number): number[] => {
  const count = Math.max(1, phases);
  return Array.from(
    { length: count },
    (_, index) => Math.floor(total / count) + (index < total % count ? 1 : 0),
  );
};

/**
 * One player's roadmap on the same card the curated ones use: whose it is,
 * the name and level, and the road in miniature.
 *
 * The author is only named when that says something: on the viewer's own
 * roadmaps it would be their own name on every card.
 *
 * The numbers are only ever the viewer's own run: their roadmap, or one they
 * follow. On anybody else's roadmap the owner's progress is not shown at all —
 * the road is drawn untouched.
 */
const PlayerRoadmapCard = ({
  summary,
  viewerUid,
  onOpen,
  featured = false,
}: {
  summary: UserRoadmapSummary;
  viewerUid: string | null;
  onOpen: () => void;
  featured?: boolean;
}) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const isOwn = viewerUid != null && viewerUid === summary.userId;
  const run = viewerRun(summary, viewerUid);
  const following = summary.viewerProgress != null;
  const started = !!run && run.sessionsCompleted > 0;
  const done = run?.completedSteps ?? 0;
  const complete = !!run && summary.stepCount > 0 && done >= summary.stepCount;
  const sizes = summary.phaseSteps?.length
    ? summary.phaseSteps
    : evenSizes(summary.stepCount, summary.phaseCount);
  const phaseDone = run?.phaseDone?.length
    ? run.phaseDone
    : sequentialDone(sizes, done);
  const name = summary.displayName ?? t("panel.players.unknown");
  // Everybody on it: the players who started it, and its owner once they have.
  const players = summary.followerCount + (summary.lastPractisedAt ? 1 : 0);

  return (
    <RoadmapSummaryCard
      eyebrow={
        isOwn ? (
          <>
            {t("ai_coach:hub.built_for_you")}
            {summary.visibility === "private" && (
              <Lock
                className='h-3.5 w-3.5'
                aria-label={t("panel.generate.visibility.private.label")}
              />
            )}
          </>
        ) : following ? (
          t("panel.by", { name })
        ) : (
          name
        )
      }
      leading={
        isOwn ? (
          <span className='flex h-full w-full items-center justify-center bg-amber-500/10 text-amber-400'>
            <Sparkles className='h-10 w-10' strokeWidth={1.5} aria-hidden />
          </span>
        ) : summary.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={summary.avatar}
            alt=''
            className='absolute inset-0 h-full w-full object-cover'
          />
        ) : (
          <span className='flex h-full w-full items-center justify-center text-zinc-500'>
            <User className='h-10 w-10' strokeWidth={1.5} aria-hidden />
          </span>
        )
      }
      title={displayTitle(summary)}
      level={summary.level || undefined}
      levelLabel={
        summary.level
          ? t(`ai_coach:levels.${summary.level}`, summary.level)
          : undefined
      }
      road={roadFromCounts(sizes, phaseDone)}
      done={done}
      total={summary.stepCount}
      players={players}
      playersLabel={t("ai_coach:card.players", { count: players })}
      countLabel={t("ai_coach:card.steps_done", {
        done,
        total: summary.stepCount,
      })}
      action={
        !run
          ? t("panel.players.view")
          : complete
            ? t("ai_coach:card.review")
            : started
              ? t("ai_coach:card.continue")
              : t("ai_coach:card.start")
      }
      primary={started && !complete}
      featured={featured}
      onOpen={onOpen}
    />
  );
};

const CARD_LIST = "flex flex-col gap-4";

const CardSkeletons = ({ count }: { count: number }) => (
  <div className={CARD_LIST} aria-busy='true'>
    {Array.from({ length: count }, (_, index) => (
      <Skeleton key={index} variant='block' className='h-36' />
    ))}
  </div>
);

/**
 * Where the tab sits. The supporter panel draws the open roadmap inside the
 * panel, under its own banner; the Roadmaps page hides its banner and tabs
 * while one is open and lets the roadmap's banner run edge to edge, like a
 * curated one.
 */
export type UserRoadmapsTabVariant = "panel" | "page";

/**
 * Which part of the players' roadmaps the page is showing: the viewer's own
 * (generated or started), the rest of the board, or neither — the tab stays
 * mounted then, so an open roadmap and a running generation survive.
 */
export type UserRoadmapsSection = "own" | "board" | "none";

/**
 * Something that belongs among the viewer's own roadmaps but is not a
 * player's roadmap — a curated one they started. It is sorted in with the
 * rest and can be the one drawn wide up front.
 */
export interface OwnRoadmapEntry {
  key: string;
  /** When it was last practised — the order of the list. */
  lastAt: string;
  /** Sessions on it and steps still to go: a candidate for the wide card. */
  underWay: boolean;
  render: (featured: boolean) => ReactNode;
}

/** An own entry that is a player's roadmap carries its row; a curated one draws itself. */
type OwnEntry = OwnRoadmapEntry & { summary?: UserRoadmapSummary };

/**
 * The roadmaps the AI generated for the players, with how far each one got.
 * Supporters see a name, a goal and the progress — the same things the wall
 * and the feed already show. Uids stay off the rows.
 */
export const UserRoadmapsTab = ({
  enabled,
  wallet,
  variant = "panel",
  section,
  extraOwn,
  extraOwnLoading = false,
  ownEmpty,
  builderOpen = false,
  onBuilderOpenChange,
  onDetailChange,
  initialRoadmapId = null,
}: {
  enabled: boolean;
  /** The signed-in supporter's wallet, for the prices in the builder. */
  wallet?: SupporterWallet;
  variant?: UserRoadmapsTabVariant;
  section: UserRoadmapsSection;
  /** Curated roadmaps the viewer started, listed with their own. */
  extraOwn?: OwnRoadmapEntry[];
  extraOwnLoading?: boolean;
  /** What "own" shows when there is nothing in it. */
  ownEmpty?: ReactNode;
  builderOpen?: boolean;
  onBuilderOpenChange?: (open: boolean) => void;
  /** Told when a roadmap opens or closes, so the page can hide its own chrome. */
  onDetailChange?: (open: boolean) => void;
  /** A roadmap to open once the list is in — the link in a "roadmap ready" notification. */
  initialRoadmapId?: string | null;
}) => {
  const { t } = useTranslation(["supporter", "ai_coach"]);
  const { data, isLoading: isListLoading } = useUserRoadmaps(enabled);
  // Without the badge the list is never asked for, so it is never "loading".
  const isLoading = enabled && isListLoading;
  const [openRow, setOpenRowState] = useState<UserRoadmapSummary | null>(null);
  // Waits for the list rather than for an effect: the row is looked up on
  // every render until it is there, then cleared on the way back.
  const [pendingId, setPendingId] = useState<string | null>(initialRoadmapId);
  // Refine mode is on straight after a generation, and off for a row opened
  // from the list — reading first, refining on request.
  const [refining, setRefining] = useState(false);
  const [term, setTerm] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
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
   * exists to open — falling back to just closing the builder if the refetch
   * and the write ever race.
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
  // started — together with the curated ones they are on, in the order they
  // would pick them up: under way first, last practised first. The first one
  // under way goes up front, wide.
  const own = useMemo(() => {
    const entries: OwnEntry[] = roadmaps
      .filter((summary) => isViewersRoadmap(summary, viewerUid))
      .map((summary) => {
        const run = viewerRun(summary, viewerUid);
        return {
          key: summary.rowId,
          summary,
          lastAt:
            run?.lastPractisedAt ??
            summary.viewerProgress?.startedAt ??
            summary.createdAt,
          underWay:
            !!run &&
            run.sessionsCompleted > 0 &&
            run.completedSteps < summary.stepCount,
          render: () => null,
        };
      });
    const all: OwnEntry[] = [...entries, ...(extraOwn ?? [])];
    return all.sort((a, b) =>
      a.underWay !== b.underWay
        ? a.underWay
          ? -1
          : 1
        : a.lastAt < b.lastAt
          ? 1
          : a.lastAt > b.lastAt
            ? -1
            : 0,
    );
  }, [roadmaps, viewerUid, extraOwn]);

  const board = useMemo(
    () => roadmaps.filter((summary) => !isViewersRoadmap(summary, viewerUid)),
    [roadmaps, viewerUid],
  );
  const others = useMemo(() => {
    const arranged = arrangeRoadmaps(board, { level, sort: "recent" });
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
  }, [board, term, level]);

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

  const renderOwn = (entry: OwnEntry, featured: boolean): ReactNode => {
    const { summary } = entry;
    return summary ? (
      <PlayerRoadmapCard
        featured={featured}
        summary={summary}
        viewerUid={viewerUid}
        onOpen={() => openFromList(summary)}
      />
    ) : (
      entry.render(featured)
    );
  };
  const featured = own[0]?.underWay ? own[0] : null;
  const ownRest = featured ? own.slice(1) : own;

  return (
    <div className='space-y-6'>
      {enabled &&
        onBuilderOpenChange &&
        (IN_APP_ROADMAP_GENERATION ? (
          <RoadmapBuilder
            open={builderOpen}
            onOpenChange={onBuilderOpenChange}
            onGenerated={openGenerated}
            wallet={wallet}
          />
        ) : (
          <AssistantRoadmapDialog
            open={builderOpen}
            onOpenChange={onBuilderOpenChange}
          />
        ))}

      {section === "own" &&
        (isLoading || extraOwnLoading ? (
          <CardSkeletons count={4} />
        ) : own.length === 0 ? (
          ownEmpty
        ) : (
          <div className='space-y-4'>
            {featured && renderOwn(featured, true)}
            {ownRest.length > 0 && (
              <div className={CARD_LIST}>
                {ownRest.map((entry) => (
                  <div key={entry.key} className='min-w-0'>
                    {renderOwn(entry, false)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

      {section === "board" &&
        (isLoading ? (
          <CardSkeletons count={6} />
        ) : board.length === 0 ? (
          <EmptyState
            icon={<MapIcon />}
            title={t("panel.players.empty_title")}
            description={t("panel.players.empty_body")}
          />
        ) : (
          <div className='space-y-6'>
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

              <SearchInput
                containerClassName='md:max-w-xs'
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t("panel.players.filter")}
                aria-label={t("panel.players.filter")}
              />
            </div>

            {others.length > 0 ? (
              <div className={CARD_LIST}>
                {others.map((summary) => (
                  <PlayerRoadmapCard
                    key={summary.rowId}
                    summary={summary}
                    viewerUid={viewerUid}
                    onOpen={() => openFromList(summary)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                mood='lookAround'
                size='compact'
                title={t("panel.players.no_match")}
              />
            )}
          </div>
        ))}
    </div>
  );
};
