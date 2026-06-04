import { Button } from "assets/components/ui/button";
import { Card, CardContent } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { selectIsFetching, selectUserInfo } from "feature/user/store/userSlice";
import { updateEmailNotifications } from "feature/user/store/userSlice.asyncThunk";
import { Check, Flame, Loader2, Mail, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import {
  DEFAULT_EMAIL_NOTIFICATIONS,
  type EmailNotificationPreferences,
} from "types/api.types";

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
];

const Toggle = ({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={cn(
      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50",
      checked ? "bg-cyan-500" : "bg-zinc-700"
    )}
  >
    <span
      className={cn(
        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
        checked ? "translate-x-[22px]" : "translate-x-0.5"
      )}
    />
  </button>
);

const EmailNotificationSettings = () => {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const saved = userInfo?.emailNotifications ?? DEFAULT_EMAIL_NOTIFICATIONS;
  const [prefs, setPrefs] = useState<EmailNotificationPreferences>(saved);

  // Keep local state in sync once user data finishes loading.
  useEffect(() => {
    setPrefs(saved);
  }, [saved.streakReminders, saved.seasonUpdates]);

  const isChanged =
    prefs.streakReminders !== saved.streakReminders ||
    prefs.seasonUpdates !== saved.seasonUpdates;

  const handleSave = () => {
    dispatch(updateEmailNotifications(prefs));
  };

  return (
    <Card className="border-zinc-800/50 bg-zinc-900/20">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-zinc-900/50 text-cyan-500">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Email notifications
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose which emails you want to receive from Riff Quest.
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.key}
                  className="flex items-start justify-between gap-4 rounded-lg border border-zinc-800/50 bg-zinc-950/30 p-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={cn("p-2 rounded shrink-0", opt.iconClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-200">{opt.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {opt.description}
                      </p>
                    </div>
                  </div>
                  <Toggle
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
            Account and security emails (like email changes) are always sent and
            can't be turned off.
          </p>

          <Button
            onClick={handleSave}
            disabled={isFetching || !isChanged}
            className="h-11 font-bold sm:self-start sm:px-8"
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {isFetching ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailNotificationSettings;
