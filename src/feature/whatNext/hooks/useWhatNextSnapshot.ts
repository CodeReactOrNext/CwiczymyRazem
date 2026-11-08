import { useQuery } from "@tanstack/react-query";
import { useAchievementContext } from "feature/achievements/hooks/useAchievementContext";
import { buildAchievementPanelState } from "feature/achievements/utils/achievementPanelState";
import { firebaseGetPracticeLevels } from "feature/aiSummary/services/practiceLevels.service";
import {
  computeProgressData,
  isoWeekKey,
} from "feature/aiSummary/utils/milestoneLogic";
import { bossRecordsQueryKey } from "feature/bosses/hooks/useBossProgress";
import { getBossRecords } from "feature/bosses/services/bossProgress.service";
import {
  useCurrentChallenge,
  useMyChallengeSubmissions,
} from "feature/challenges/hooks/useChallenges";
import {
  challengeWindow,
  daysLeftInChallenge,
} from "feature/challenges/utils/challengeMonth";
import { getClearedSongIds } from "feature/challenges/utils/challengeProgress";
import { useDailyExercise } from "feature/dailyExercise/hooks/useDailyExercise";
import { practiceLevelsQueryKey } from "feature/dashboard/hooks/useMilestoneProgress";
import { milestoneStatuses } from "feature/dashboard/utils/milestoneSummary";
import { useDuelOverview } from "feature/duels/hooks/useDuels";
import { useExerciseGoals } from "feature/exerciseGoals/hooks/useExerciseGoals";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { useLocalizeExercise } from "feature/exercisePlan/hooks/useLocalizedExercises";
import { getAllBpmProgress } from "feature/exercisePlan/services/bpmProgressService";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { hasExerciseProgress } from "feature/exercisePlan/utils/hasExerciseProgress";
import { useGuilds } from "feature/guilds/hooks/useGuilds";
import { journeyModules } from "feature/journey/data/journeyModules";
import { firebaseGetJourneyProgress } from "feature/journey/services/journey.service";
import {
  buildModuleWithStatus,
  getNextJourneyStep,
} from "feature/journey/utils/journeyStatus";
import { useUserRank } from "feature/leadboard/hooks/useUserRank";
import { getCurrentSeasonId } from "feature/leadboard/services/getCurrentSeason";
import { getLeaderboardNeighbors } from "feature/leadboard/services/getLeaderboardNeighbors";
import { isFeatureUnlocked } from "feature/levelGate/data/featureUnlocks";
import { firebaseGetUserRaprotsLogs } from "feature/logs/services/getUserRaprotsLogs.service";
import type { FirebaseUserExceriseLog } from "feature/logs/types/logs.type";
import { useCalendar } from "feature/practiceCalendar/hooks/useCalendar";
import { usePlannerSources } from "feature/practiceCalendar/hooks/usePlannerSources";
import { toDateKey } from "feature/practiceCalendar/utils/calendarDates";
import { isItemDone } from "feature/practiceCalendar/utils/calendarItems";
import { rotationQueryKey } from "feature/rotation/hooks/useRotation";
import { getRotation } from "feature/rotation/services/rotation.service";
import { getFreshness } from "feature/rotation/utils/rotation.utils";
import { SCALE_TREE_NODES } from "feature/scaleTree/data/scaleTreeNodes";
import { getClaimableScaleBoxes } from "feature/scaleTree/data/scaleTreeRewards";
import {
  collectBpms,
  computeNodeStatuses,
  isExerciseCleared,
} from "feature/scaleTree/services/scaleTree.service";
import { buildSkillRoadmap } from "feature/skills/roadmap/skillRoadmap.data";
import {
  computeRoadmapProgress,
  findCurrentPlacement,
} from "feature/skills/roadmap/skillRoadmapStates";
import { useUserSongs } from "feature/songs/hooks/useUserSongs";
import { getAllUserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { getQuestDayKey, isQuestDrawnFor } from "feature/user/store/questDay";
import {
  selectCurrentUserStats,
  selectDailyQuest,
  selectUserAuth,
} from "feature/user/store/userSlice";
import type {
  PracticeCategory,
  SongRef,
  WhatNextSnapshot,
} from "feature/whatNext/types/whatNext.types";
import { useRewardLedger } from "hooks/useRewardLedger";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import { getReconciledStreak, hasRestDays } from "utils/gameLogic";
import {
  getLocalDayEnd,
  getServerMonthEnd,
} from "utils/gameLogic/resetSchedule";

/**
 * What the claim strip pays for a finished quest. Kept in step with
 * `DAILY_QUEST_FAME_REWARD` / `DAILY_QUEST_POINTS_REWARD`, which live in a module
 * the store owns — see the test that pins them together.
 */
export const DAILY_QUEST_REWARD = { fame: 40, points: 10 };

const STALE_TIME = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const CATEGORIES: PracticeCategory[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];

/**
 * Where What Next is drawn. The Home card reads the sources that can lead the
 * road; the page adds the ones that only fill its lower lanes (scale tree,
 * season, guild, badges, bosses), which cost extra reads.
 */
export type WhatNextScope = "widget" | "page";

const logDate = (log: FirebaseUserExceriseLog) =>
  new Date(log.reportDate.seconds * 1000);

/** A stable pick per day, so the suggestion does not change on every visit. */
const pickForDay = <T>(items: T[], now: number): T | undefined =>
  items.length ? items[Math.floor(now / DAY_MS) % items.length] : undefined;

const isEasyFreeExercise = (exercise: Exercise) =>
  !exercise.premium &&
  (exercise.difficulty === "beginner" || exercise.difficulty === "easy");

const useNow = () => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

export const useWhatNextSnapshot = (
  scope: WhatNextScope,
): { snapshot: WhatNextSnapshot | null; isLoading: boolean } => {
  const uid = useAppSelector(selectUserAuth);
  const stats = useAppSelector(selectCurrentUserStats);
  const storedQuest = useAppSelector(selectDailyQuest);
  const localizeExercise = useLocalizeExercise();
  const now = useNow();
  const full = scope === "page";
  const lvl = stats?.lvl ?? 1;

  // ── Practice history: streak, balance, last plan, weekly goals ────────────
  const logsQuery = useQuery({
    queryKey: ["what-next", "logs", uid],
    queryFn: () => firebaseGetUserRaprotsLogs(uid!, "all"),
    enabled: !!uid,
    staleTime: 60_000,
    // Opened right after a session (the report, Home): the session just saved
    // has to count, or the streak would still read as at risk.
    refetchOnMount: "always",
  });
  const logs = logsQuery.data;

  const milestonesUnlocked = isFeatureUnlocked("summary", lvl);
  const levelsQuery = useQuery({
    queryKey: practiceLevelsQueryKey(uid ?? ""),
    queryFn: () => firebaseGetPracticeLevels(uid!),
    enabled: !!uid && milestonesUnlocked,
    staleTime: STALE_TIME,
  });

  // ── Sources shared with the rest of the app ───────────────────────────────
  const { data: ledger } = useRewardLedger();
  const daily = useDailyExercise(uid);
  const { goals, isLoading: goalsLoading } = useExerciseGoals(uid);
  const planner = usePlannerSources(uid);
  const calendar = useCalendar(uid);
  const { songs: songLists } = useUserSongs(uid);
  const songProgressQuery = useQuery({
    queryKey: ["user-song-progress", uid],
    queryFn: () => getAllUserSongProgress(uid!),
    enabled: !!uid,
    staleTime: STALE_TIME,
  });
  const rotationQuery = useQuery({
    queryKey: rotationQueryKey(uid),
    queryFn: () => getRotation(uid!),
    enabled: !!uid,
  });
  const journeyQuery = useQuery({
    // Its own key: Journey's page creates the document on first read, and a
    // glance from here should not.
    queryKey: ["what-next", "journey", uid],
    queryFn: () => firebaseGetJourneyProgress(uid!),
    enabled: !!uid,
    staleTime: STALE_TIME,
  });
  const bpmQuery = useQuery({
    queryKey: ["what-next", "bpm-progress", uid],
    queryFn: () => getAllBpmProgress(uid!),
    enabled: !!uid,
    staleTime: STALE_TIME,
  });
  const challengeQuery = useCurrentChallenge();
  // Only the player's own recordings: the whole board grows with the roster.
  const submissionsQuery = useMyChallengeSubmissions(
    challengeQuery.data?.id,
    uid,
  );
  const duelsQuery = useDuelOverview(uid);

  // ── Page only ─────────────────────────────────────────────────────────────
  // The scale tree reads the same `exerciseBpmProgress` documents as the skill
  // tree above, so it is cut from that read instead of downloading them again.
  const scaleProgress = useMemo(
    () =>
      full && bpmQuery.data
        ? new Map(
            [...bpmQuery.data].map(([id, data]) => [
              id,
              data.completedBpms ?? [],
            ]),
          )
        : undefined,
    [full, bpmQuery.data],
  );
  const guildsUnlocked = isFeatureUnlocked("guilds", lvl);
  const guildsQuery = useGuilds(full && !!uid && guildsUnlocked);
  const bossQuery = useQuery({
    // The bosses' own key: a run saved in the lair lands here too.
    queryKey: bossRecordsQueryKey(uid),
    queryFn: () => getBossRecords(uid!),
    enabled: !!uid && full,
    staleTime: STALE_TIME,
  });
  // Badges only fill the page; on Home and after a session they would cost
  // an Arsenal request and the songs read for nothing.
  const achievementContext = useAchievementContext({ enabled: full });
  const [seasonId] = useState(getCurrentSeasonId);
  // Without a season id the rank hook reads nothing, which is what the Home card wants.
  const seasonal = useUserRank("seasonal", full ? seasonId : undefined);
  const neighborsQuery = useQuery({
    queryKey: [
      "leaderboardNeighbors",
      "seasonal",
      seasonId,
      uid,
      seasonal.score,
      seasonal.userRank,
    ],
    queryFn: () =>
      getLeaderboardNeighbors({
        view: "seasonal",
        userId: uid!,
        score: seasonal.score!,
        rank: seasonal.userRank!,
        seasonId,
      }),
    enabled: full && !!uid && seasonal.score !== null && !!seasonal.userRank,
    staleTime: STALE_TIME,
  });

  // ── Derived pieces, each `undefined` until its data is in ─────────────────
  const skillTree = useMemo(() => {
    if (!bpmQuery.data) return undefined;
    const tiers = buildSkillRoadmap(exercisesAgregat);
    const progress = computeRoadmapProgress(
      tiers,
      (exercise) => hasExerciseProgress(bpmQuery.data.get(exercise.id)),
      () => false,
    );
    const placement = findCurrentPlacement(tiers, progress.states);
    if (!placement) return null;
    const tierProgress = progress.byTier.get(placement.tier.id);
    return {
      exerciseId: placement.exercise.id,
      title: localizeExercise(placement.exercise).title,
      branch: placement.branch.label,
      done: tierProgress?.completed ?? 0,
      total: tierProgress?.total ?? 0,
    };
  }, [bpmQuery.data, localizeExercise]);

  const songs = useMemo(() => {
    if (!songLists || !songProgressQuery.data) return undefined;
    const progressById = new Map(
      songProgressQuery.data.map((p) => [p.songId, p]),
    );
    const toRef = (song: Song): SongRef => {
      const progress = progressById.get(song.id);
      return {
        id: song.id,
        title: song.title,
        artist: song.artist,
        ...(song.coverUrl && { coverUrl: song.coverUrl }),
        lastPracticedAt: progress?.lastPracticedAt?.getTime() ?? null,
        hasGpFile: !!progress?.gpFileId,
      };
    };
    return {
      learning: songLists.learning.map(toRef),
      wantToLearn: songLists.wantToLearn.map(toRef),
      learnedCount: songLists.learned.length,
    };
  }, [songLists, songProgressQuery.data]);

  const snapshot = useMemo<WhatNextSnapshot | null>(() => {
    if (!uid || !stats) return null;

    const today = toDateKey(new Date(now));
    const weekAgo = now - 7 * DAY_MS;

    const streak = logs
      ? (() => {
          const reconciled = getReconciledStreak({
            actualDayWithoutBreak: stats.actualDayWithoutBreak ?? 0,
            lastReportDate: stats.lastReportDate ?? "",
            reportDates: logs.map(logDate),
            restDays: hasRestDays(stats),
          });
          return {
            dayWithoutBreak: reconciled.dayWithoutBreak,
            didPracticeToday: reconciled.didPracticeToday,
            dayEndsAt: getLocalDayEnd(new Date(now)),
          };
        })()
      : undefined;

    const weekLogs = logs?.filter((log) => logDate(log).getTime() >= weekAgo);
    const weekMinutes = weekLogs
      ? {
          technique:
            weekLogs.reduce(
              (sum, l) => sum + (l.timeSumary?.techniqueTime ?? 0),
              0,
            ) / 60_000,
          theory:
            weekLogs.reduce(
              (sum, l) => sum + (l.timeSumary?.theoryTime ?? 0),
              0,
            ) / 60_000,
          hearing:
            weekLogs.reduce(
              (sum, l) => sum + (l.timeSumary?.hearingTime ?? 0),
              0,
            ) / 60_000,
          creativity:
            weekLogs.reduce(
              (sum, l) => sum + (l.timeSumary?.creativityTime ?? 0),
              0,
            ) / 60_000,
        }
      : undefined;

    const lastPlanLog = logs
      ?.filter((log) => !!log.planId)
      .sort((a, b) => logDate(b).getTime() - logDate(a).getTime())[0];

    const questToday = getQuestDayKey(stats.timeZone);
    const dailyQuest = isQuestDrawnFor(storedQuest, questToday)
      ? storedQuest
      : null;

    const categoryPicks = Object.fromEntries(
      CATEGORIES.flatMap((category) => {
        const pick = pickForDay(
          exercisesAgregat.filter(
            (e) => e.category === category && isEasyFreeExercise(e),
          ),
          now,
        );
        return pick
          ? [
              [
                category,
                { exerciseId: pick.id, title: localizeExercise(pick).title },
              ],
            ]
          : [];
      }),
    );
    const quick = exercisesAgregat.find(
      (e) => e.category === "technique" && isEasyFreeExercise(e),
    );

    const rotationDoc = rotationQuery.data;
    const rotationLevels = rotationDoc?.items.map(
      (item) => getFreshness(item, rotationDoc.lastPracticed, now).level,
    );

    const challenge = challengeQuery.data;
    const cleared =
      challenge && submissionsQuery.data
        ? getClearedSongIds(submissionsQuery.data, uid)
        : undefined;

    const scaleStatuses = scaleProgress
      ? computeNodeStatuses(scaleProgress)
      : undefined;
    const scaleNode = scaleStatuses
      ? SCALE_TREE_NODES.find(
          (node) => scaleStatuses[node.id] === "in_progress",
        )
      : undefined;

    const guildState = guildsQuery.data;
    const neighbors = neighborsQuery.data;
    const achievementState =
      full && achievementContext
        ? buildAchievementPanelState(
            stats.achievements ?? [],
            achievementContext,
          )
        : undefined;

    const journeyModulesWithStatus = journeyQuery.isSuccess
      ? journeyModules.map((module) =>
          buildModuleWithStatus(module, journeyQuery.data ?? null),
        )
      : undefined;

    const levels = levelsQuery.data;

    return {
      now,
      lvl,
      points: stats.points ?? 0,
      sessionCount: stats.sessionCount ?? 0,
      availableSkillPoints: Object.values(stats.availablePoints ?? {}).reduce(
        (sum: number, value) => sum + (typeof value === "number" ? value : 0),
        0,
      ),
      streak,
      dailyQuest,
      dailyQuestReward: DAILY_QUEST_REWARD,
      ...(ledger && {
        rewards: {
          caseTokens: ledger.caseTokens,
          achievementsClaimable: ledger.achievements.claimable.length,
          achievementsPending: ledger.achievements.pending,
        },
      }),
      ...(logs &&
        levels && {
          milestones: {
            weekKey: isoWeekKey(new Date(now)),
            statuses: milestoneStatuses({
              progress: computeProgressData(logs, new Date(now)),
              levels,
              weekKey: isoWeekKey(new Date(now)),
              playerLvl: lvl,
            }),
          },
        }),
      ...(daily.exercise &&
        daily.leaderboard.data && {
          dailyExercise: {
            exerciseId: daily.exercise.id,
            title: localizeExercise(daily.exercise).title,
            myRank: daily.leaderboard.data.me?.rank ?? null,
            players: daily.leaderboard.data.players,
            endsAt: now + daily.msLeft,
          },
        }),
      goals: goalsLoading ? undefined : goals,
      ...(!calendar.isLoading &&
        rotationDoc && {
          calendar: {
            today,
            todayItems: (calendar.days[today] ?? []).map((item) => ({
              item,
              done: isItemDone(item, today, rotationDoc.lastPracticed),
            })),
            hasUpcoming: Object.entries(calendar.days).some(
              ([date, items]) => date > today && items.length > 0,
            ),
          },
        }),
      journey: journeyModulesWithStatus
        ? getNextJourneyStep(journeyModulesWithStatus)
        : undefined,
      roadmapSteps: planner.isLoading ? undefined : planner.roadmapSteps,
      skillTree,
      songs,
      ...(rotationLevels && {
        rotation: {
          rusty: rotationLevels.filter((level) => level === "rusty").length,
          cooling: rotationLevels.filter((level) => level === "cooling").length,
          total: rotationLevels.length,
        },
      }),
      lastPlan: logs
        ? lastPlanLog
          ? {
              planId: lastPlanLog.planId!,
              title: lastPlanLog.exceriseTitle,
              lastPlayedAt: logDate(lastPlanLog).getTime(),
            }
          : null
        : undefined,
      ...(challenge &&
        cleared && {
          challenge: {
            id: challenge.id,
            total: challenge.songs.length,
            cleared: challenge.songs.filter((s) => cleared.has(s.songId))
              .length,
            daysLeft: daysLeftInChallenge(challenge.id, new Date(now)),
            endsAt: challengeWindow(challenge.id).endsAt.getTime(),
          },
        }),
      duels: duelsQuery.data?.active,
      weekMinutes,
      categoryPicks,
      ...(quick && {
        quickPick: {
          exerciseId: quick.id,
          title: localizeExercise(quick).title,
        },
      }),

      // Page only.
      ...(full && {
        scaleBoxes:
          scaleProgress && ledger
            ? getClaimableScaleBoxes(scaleProgress, ledger.scales.claimed)
            : undefined,
        scaleInProgress: scaleNode
          ? {
              nodeId: scaleNode.id,
              title: scaleNode.label,
              done: scaleNode.requiredExercises.filter((req) =>
                isExerciseCleared(req, collectBpms(req, scaleProgress!)),
              ).length,
              total: scaleNode.requiredExercises.length,
            }
          : scaleProgress
            ? null
            : undefined,
        guild: !guildsUnlocked
          ? null
          : guildState
            ? {
                isMember: !!guildState.myGuildId,
                claimableFame: guildState.quests?.claimable.fame ?? 0,
                claimableQuests: guildState.quests?.claimable.quests ?? 0,
                openShares: (guildState.quests?.active ?? [])
                  .filter((quest) => quest.each && !quest.each.done)
                  .map((quest) => ({
                    id: quest.id,
                    name: quest.name,
                    mine: quest.each!.mine,
                    target: quest.each!.target,
                  })),
                applications: guildState.isFounder
                  ? guildState.applications.length
                  : 0,
              }
            : undefined,
        season: neighbors
          ? neighbors.nextRival
            ? {
                place: seasonal.userRank!,
                rivalName: neighbors.nextRival.displayName,
                gap: neighbors.nextRival.gap,
                endsAt: getServerMonthEnd(new Date(now)),
              }
            : null
          : undefined,
        achievements: achievementState?.entries
          .filter(
            (entry) =>
              entry.state === "ready" ||
              (entry.state === "progress" && entry.progress),
          )
          .map((entry) => ({
            id: entry.data.id,
            name: entry.data.name,
            current: entry.progress?.current ?? 0,
            max: entry.progress?.max ?? 1,
            ready: entry.state === "ready",
          })),
        bosses: bossQuery.data,
      }),
    };
  }, [
    uid,
    stats,
    now,
    logs,
    storedQuest,
    localizeExercise,
    rotationQuery.data,
    challengeQuery.data,
    submissionsQuery.data,
    scaleProgress,
    guildsQuery.data,
    neighborsQuery.data,
    achievementContext,
    full,
    journeyQuery.isSuccess,
    journeyQuery.data,
    levelsQuery.data,
    lvl,
    ledger,
    daily.exercise,
    daily.leaderboard.data,
    daily.msLeft,
    goalsLoading,
    goals,
    calendar.isLoading,
    calendar.days,
    planner.isLoading,
    planner.roadmapSteps,
    skillTree,
    songs,
    duelsQuery.data,
    seasonal.userRank,
    guildsUnlocked,
    bossQuery.data,
  ]);

  return { snapshot, isLoading: !snapshot || logsQuery.isLoading };
};
