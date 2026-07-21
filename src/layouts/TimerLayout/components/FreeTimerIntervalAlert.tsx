import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Progress } from "assets/components/ui/progress";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Bell, BellOff } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { playCompletionSound } from "utils/audioUtils";

import { useIntervalAlert } from "../hooks/useIntervalAlert";

const INTERVAL_OPTIONS_MINUTES = [3, 5, 10, 15, 20];
const MIN_CUSTOM_MINUTES = 1;
const MAX_CUSTOM_MINUTES = 120;

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
// nudge interleaved practice (switch skill/technique on a schedule). Lives
// inside an AccordionItem so the panel stays collapsed by default; the
// countdown keeps running while collapsed, only the UI hides.
const FreeTimerIntervalAlert = ({ elapsedMs, isRunning }: FreeTimerIntervalAlertProps) => {
  const { t } = useTranslation("timer");
  const [enabled, setEnabled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [customInput, setCustomInput] = useState("");

  const handleAlert = useCallback(() => {
    playCompletionSound();
    toast.info(t("interval_alert.toast", { minutes: intervalMinutes }));
  }, [intervalMinutes, t]);

  const intervalMs = intervalMinutes * 60 * 1000;

  const { remainingMs } = useIntervalAlert({
    enabled,
    elapsedMs,
    isRunning,
    intervalMs,
    onAlert: handleAlert,
  });

  const displayRemainingMs = remainingMs ?? intervalMs;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((intervalMs - displayRemainingMs) / intervalMs) * 100)
  );

  const handlePresetClick = (minutes: number) => {
    setIntervalMinutes(minutes);
    setCustomInput("");
  };

  const handleCustomChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    setCustomInput(raw);

    const parsed = Math.round(Number(raw));
    if (raw !== "" && Number.isFinite(parsed) && parsed >= MIN_CUSTOM_MINUTES) {
      setIntervalMinutes(Math.min(MAX_CUSTOM_MINUTES, parsed));
    }
  };

  return (
    <AccordionItem value='interval-alert' className='rounded-lg border-none bg-zinc-900/40'>
      <AccordionTrigger className='px-4 py-3 hover:no-underline'>
        <div className='flex items-center gap-2'>
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
          {enabled && (
            <span translate='no' className='text-xs text-zinc-500'>
              {formatRemaining(displayRemainingMs)}
            </span>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className='flex flex-col gap-4 px-4 pb-4 pt-0'>
        <div className='flex flex-wrap items-center justify-center gap-2'>
          {INTERVAL_OPTIONS_MINUTES.map((minutes) => (
            <button
              key={minutes}
              type='button'
              onClick={() => handlePresetClick(minutes)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                intervalMinutes === minutes
                  ? "bg-cyan-500/10 text-cyan-400"
                  : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}>
              {t("interval_alert.minutes_short", { minutes })}
            </button>
          ))}
          <div className='w-[4.5rem] shrink-0'>
            <Input
              type='number'
              inputMode='numeric'
              min={MIN_CUSTOM_MINUTES}
              max={MAX_CUSTOM_MINUTES}
              value={customInput}
              onChange={handleCustomChange}
              placeholder={t("interval_alert.custom_placeholder")}
              aria-label={t("interval_alert.custom_aria")}
              className={cn(
                "h-7 rounded px-2 py-1 text-center text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                customInput !== ""
                  ? "border-cyan-500/40 text-cyan-400"
                  : "border-transparent bg-zinc-800/50 text-zinc-400"
              )}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <p translate='no' className='text-center text-sm text-zinc-400'>
            {enabled
              ? t("interval_alert.next_in", { time: formatRemaining(displayRemainingMs) })
              : t("interval_alert.description")}
          </p>
          {enabled && <Progress value={progressPercent} className='h-1.5 bg-zinc-800' />}
        </div>

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
      </AccordionContent>
    </AccordionItem>
  );
};

export default FreeTimerIntervalAlert;
