import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Switch } from "assets/components/ui/switch";
import { firebaseUpdateStreakRestDays } from "feature/settings/services/settings.service";
import {
  selectCurrentUserStats,
  setStreakRestDays,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { hasRestDays } from "utils/gameLogic";

/**
 * Settings → Profile. The streak's rest day (one missed day a week does not
 * break it) is on for everyone; this is the one place to switch it off. The
 * switch flips at once and goes back if the write fails.
 */
export const StreakSettings = () => {
  const { t } = useTranslation("settings");
  const dispatch = useAppDispatch();
  const enabled = useAppSelector((state) =>
    hasRestDays(selectCurrentUserStats(state)),
  );

  const toggle = async () => {
    const next = !enabled;
    dispatch(setStreakRestDays(next));
    try {
      await firebaseUpdateStreakRestDays(next);
    } catch {
      dispatch(setStreakRestDays(enabled));
      toast.error(t("streak.error"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("streak.title")}</CardTitle>
        <CardDescription>{t("streak.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between gap-6 rounded-lg bg-zinc-900/40 px-4 py-3'>
          <div className='min-w-0'>
            <p className='text-sm font-semibold text-zinc-200'>
              {t("streak.label")}
            </p>
            <p className='mt-1 text-sm text-zinc-400'>
              {t("streak.description")}
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={toggle}
            aria-label={t("streak.label")}
          />
        </div>
      </CardContent>
    </Card>
  );
};
