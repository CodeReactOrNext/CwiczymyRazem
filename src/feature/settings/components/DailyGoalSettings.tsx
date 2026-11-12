import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
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
      <CardHeader>
        <CardTitle>{t("daily_goal.title")}</CardTitle>
        <CardDescription>{t("daily_goal.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-4 gap-2 sm:max-w-md'>
          {DAILY_GOAL_OPTIONS.map((minutes) => {
            const active = minutes === current;
            return (
              <button
                key={minutes}
                type='button'
                aria-pressed={active}
                onClick={() => choose(minutes)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400/50",
                  active
                    ? "bg-cyan-500/10 text-cyan-300"
                    : "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-900/70",
                )}>
                {t("daily_goal.minutes", { minutes })}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
