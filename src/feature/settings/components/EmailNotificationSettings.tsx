import { Button } from "assets/components/ui/button";
import { Card } from "assets/components/ui/card";
import { Switch } from "assets/components/ui/switch";
import { cn } from "assets/lib/utils";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { selectIsFetching, selectUserInfo } from "feature/user/store/userSlice";
import { updateEmailNotifications } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import {
  effectiveEmailPreferences,
  EMAIL_CATEGORIES,
} from "lib/email/consent";
import { Check, Flame, Sparkles, Trophy } from "lucide-react";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { EmailNotificationPreferences } from "types/api.types";

type ToggleKey = keyof EmailNotificationPreferences;

const OPTIONS: {
  key: ToggleKey;
  title: string;
  description: string;
  icon: typeof Flame;
  iconClass: string;
}[] = [
  {
    key: "streakReminders",
    title: "Streak reminders",
    description:
      "Get a nudge when you haven't practiced for a day or two, so you don't break your streak.",
    icon: Flame,
    iconClass: "bg-orange-500/10 text-orange-500",
  },
  {
    key: "seasonUpdates",
    title: "Season updates",
    description:
      "Emails about new seasons starting, seasons ending soon and your final results.",
    icon: Trophy,
    iconClass: "bg-cyan-500/10 text-cyan-500",
  },
  {
    key: "productUpdates",
    title: "What's new at Riff Quest",
    description: "Once in a while, a short roundup of what's new in the app.",
    icon: Sparkles,
    iconClass: "bg-zinc-800/60 text-zinc-400",
  },
];

const EmailNotificationSettings = () => {
  const { t } = useTranslation("settings");
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  // Off until the player agreed to email (on sign-up, in the prompt or here).
  const saved = effectiveEmailPreferences(userInfo);
  const [prefs, setPrefs] = useState<EmailNotificationPreferences>(saved);

  // Keep local state in sync once user data finishes loading (or the prompt is
  // answered while this tab is open).
  const savedKey = EMAIL_CATEGORIES.map((key) => saved[key]).join();
  const [lastSavedKey, setLastSavedKey] = useState(savedKey);
  if (savedKey !== lastSavedKey) {
    setLastSavedKey(savedKey);
    setPrefs(saved);
  }

  const isChanged =
    prefs.streakReminders !== saved.streakReminders ||
    prefs.seasonUpdates !== saved.seasonUpdates ||
    prefs.productUpdates !== saved.productUpdates;

  const handleSave = () => {
    dispatch(updateEmailNotifications(prefs));
  };

  return (
    <Card>
      <SectionHeader title={t("email_notifications.title")} description={t("email_notifications.description")} />
      <div>
        <div className="flex flex-col gap-6">
          {/* Options */}
          <div className="space-y-6">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.key}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={cn("p-2 rounded shrink-0", opt.iconClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-200">{t(`email_notifications.options.${opt.key}.title`, opt.title)}</p>
                      <p className="text-sm text-muted-foreground">
                        {t(`email_notifications.options.${opt.key}.description`, opt.description)}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={prefs[opt.key]}
                    disabled={isFetching}
                    onChange={() =>
                      setPrefs((prev) => ({
                        ...prev,
                        [opt.key]: !prev[opt.key],
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            {t("email_notifications.always_sent")}
          </p>

          <Button
            onClick={handleSave}
            size="lg"
            disabled={!isChanged}
            loading={isFetching}
            className="sm:self-start"
          >
            {!isFetching && <Check />}
            {isFetching ? t("email_notifications.saving") : t("email_notifications.save")}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmailNotificationSettings;
