import { ActivityChart } from "components/Charts/ActivityChart";
import { usePracticeLogSessions } from "feature/practiceLog/hooks/usePracticeLogSessions";
import { getSongPracticeDays } from "feature/songs/utils/songPracticeDays";
import { useTranslation } from "hooks/useTranslation";
import { useMemo } from "react";

interface SongPracticeChartProps {
  userAuth: string;
  className?: string;
}

/** The Progress page's activity chart, counting only the time spent on songs. */
export const SongPracticeChart = ({ userAuth, className }: SongPracticeChartProps) => {
  const { t } = useTranslation("songs");
  const { sessions } = usePracticeLogSessions(userAuth);
  const rows = useMemo(() => getSongPracticeDays(sessions ?? []), [sessions]);

  // No song played yet: an empty chart says nothing the hero doesn't.
  if (rows.length === 0) return null;

  return (
    <ActivityChart data={rows} title={t("power.chart_title")} className={className} />
  );
};
