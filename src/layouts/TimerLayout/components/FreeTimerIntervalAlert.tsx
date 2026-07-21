import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Bell, BellOff } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { playCompletionSound } from "utils/audioUtils";

import { useIntervalAlert } from "../hooks/useIntervalAlert";

const INTERVAL_OPTIONS_MINUTES = [3, 5, 10, 15, 20];

interface FreeTimerIntervalAlertProps {
  elapsedMs: number;
  isRunning: boolean;
}

const formatRemaining = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

// Reminder that beeps + toasts every N minutes of active practice time, to
// nudge interleaved practice (switch skill/technique on a schedule).
const FreeTimerIntervalAlert = ({ elapsedMs, isRunning }: FreeTimerIntervalAlertProps) => {
  const { t } = useTranslation("timer");
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5);

  const handleAlert = useCallback(() => {
    playCompletionSound();
    toast.info(t("interval_alert.toast", { minutes: intervalMinutes }));
  }, [intervalMinutes, t]);

  const { remainingMs } = useIntervalAlert({
    enabled,
    elapsedMs,
    isRunning,
    intervalMs: intervalMinutes * 60 * 1000,
    onAlert: handleAlert,
  });

  const displayRemainingMs = remainingMs ?? intervalMinutes * 60 * 1000;

  return (
    <div className='flex h-full flex-col gap-3'>
      <div className='flex items-center gap-2 px-1'>
        {enabled ? (
          <Bell className='h-4 w-4 text-cyan-400' />
        ) : (
          <BellOff className='h-4 w-4 text-zinc-400' />
        )}
        <span className='text-sm font-medium text-zinc-300'>
          {t("interval_alert.title")}
        </span>
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            enabled ? "bg-cyan-400" : "bg-zinc-700"
          )}
        />
      </div>

      <div className='flex flex-1 flex-col justify-between gap-4 rounded-lg bg-zinc-900/40 p-4'>
        <div className='flex flex-wrap justify-center gap-2'>
          {INTERVAL_OPTIONS_MINUTES.map((minutes) => (
            <button
              key={minutes}
              type='button'
              onClick={() => setIntervalMinutes(minutes)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                intervalMinutes === minutes
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}>
              {t("interval_alert.minutes_short", { minutes })}
            </button>
          ))}
        </div>

        <p translate="no" className='text-center text-sm text-zinc-400'>
          {enabled
            ? t("interval_alert.next_in", { time: formatRemaining(displayRemainingMs) })
            : t("interval_alert.description")}
        </p>

        <Button
          onClick={() => setEnabled((prev) => !prev)}
          className={cn(
            "h-11 w-full rounded-lg text-sm font-medium transition-colors",
            enabled
              ? "bg-cyan-500 text-black hover:bg-cyan-400"
              : "bg-zinc-800 text-white hover:bg-zinc-700"
          )}
          aria-label={enabled ? t("interval_alert.disable") : t("interval_alert.enable")}>
          {enabled ? (
            <>
              <BellOff className='mr-2 h-4 w-4' />
              {t("interval_alert.disable")}
            </>
          ) : (
            <>
              <Bell className='mr-2 h-4 w-4' />
              {t("interval_alert.enable")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FreeTimerIntervalAlert;
