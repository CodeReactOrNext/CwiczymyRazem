import { useQuery } from "@tanstack/react-query";
import { useArsenalData } from "feature/arsenal/hooks/useArsenalData";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { useMemo } from "react";
import { getLocalDateKey } from "utils/converter";

import { getGettingStartedProgress } from "../utils/gettingStartedProgress";
import { useGettingStartedQuest } from "./useGettingStartedQuest";

/**
 * The Getting Started checklist's state, read from the player's own data.
 * Shared by the checklist card and the dashboard hero, which stays hidden
 * until the checklist is done — both must agree on when that is.
 *
 * `progress` is null until every source has loaded.
 */
export const useGettingStartedProgress = (
  userAuth: string | null | undefined,
  sessionCount: number,
  reportList: { date: string | number | Date }[] | undefined,
) => {
  const questState = useGettingStartedQuest(userAuth);
  const { data: arsenalData, isLoading: isArsenalLoading } = useArsenalData();
  const { data: userSongsData, isLoading: isUserSongsLoading } = useQuery({
    queryKey: ["user-songs", userAuth],
    queryFn: () => getUserSongs(userAuth as string),
    enabled: !!userAuth,
    staleTime: 10 * 60 * 1000,
  });

  // The second-day step only needs the distinct days in the activity log.
  const practiceDays = useMemo(
    () =>
      new Set(
        (reportList ?? []).map((report) =>
          getLocalDateKey(new Date(report.date)),
        ),
      ),
    [reportList],
  );

  const isLoading =
    questState.isLoading ||
    isArsenalLoading ||
    isUserSongsLoading ||
    !questState.quest;

  const songCount =
    (userSongsData?.wantToLearn.length ?? 0) +
    (userSongsData?.learning.length ?? 0) +
    (userSongsData?.learned.length ?? 0);

  const progress = isLoading
    ? null
    : getGettingStartedProgress({
        quest: questState.quest,
        sessionCount,
        guitarCount: arsenalData?.inventory?.length ?? 0,
        songCount,
        practiceDayCount: practiceDays.size,
      });

  return { ...questState, isLoading, progress, practiceDays };
};
