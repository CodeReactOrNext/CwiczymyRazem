import { Card } from "assets/components/ui/card";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { DAILY_GOAL_OPTIONS, getDailyGoalMinutes } from "constants/dailyGoal";
import { firebaseUpdateDailyGoalMinutes } from "feature/settings/services/settings.service";
import {
  selectCurrentUserStats,
  setDailyGoalMinutes,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

/**
 * Settings → Profile. How many minutes a day count as "done" on Home's
 * "This week" chart. Applies at once and goes back if the write fails.
 */
export const DailyGoalSettings = () => {
  const { t } = useTranslation("settings");
  const dispatch = useAppDispatch();
  const current = useAppSelector((state) =>
    getDailyGoalMinutes(selectCurrentUserStats(state)),
  );

  const choose = async (minutes: number) => {
    if (minutes === current) return;
    dispatch(setDailyGoalMinutes(minutes));
    try {
      await firebaseUpdateDailyGoalMinutes(minutes);
    } catch {
      dispatch(setDailyGoalMinutes(current));
      toast.error(t("daily_goal.error"));
    }
  };

  return (
    <Card>
      <SectionHeader title={t("daily_goal.title")} description={t("daily_goal.subtitle")} />
      <div>
        <SegmentedControl
          label={t("daily_goal.title")}
          selected={[String(current)]}
          onSelect={(minutes) => choose(Number(minutes))}
          options={DAILY_GOAL_OPTIONS.map((minutes) => ({
            value: String(minutes),
            label: t("daily_goal.minutes", { minutes }),
          }))}
        />
      </div>
    </Card>
  );
};
