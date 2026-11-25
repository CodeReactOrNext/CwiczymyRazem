import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Pause, Play, RotateCcw, SkipBack } from "lucide-react";
import { convertMsToHMS } from "utils/converter/timeConverter";

import { useTimerContext } from "../contexts/TimerContext";
import { sumSessionTime, useSessionTimeStore } from "../hooks/sessionTimeStore";
import { SessionTooltip } from "./SessionTooltip";

interface SessionTransportProps {
  isPlaying: boolean;
  onToggle: () => void;
  onRestart: () => void;
  /** Left out on the first exercise. */
  onBack?: () => void;
  /** Start is offered somewhere else (the gate), or the exercise has none of its own. */
  hidePlay?: boolean;
  /** Nothing but the clock: the start gate stands over the exercise. */
  clockOnly?: boolean;
}

/** Only what this session tracked — Redux `user.timer` also carries time the
 *  player has not reported yet, which is not part of "Session". */
const SessionTime = () => {
  const { t } = useTranslation("session");
  const totalMs = useSessionTimeStore((state) => sumSessionTime(state.time));
  return (
    <>
      {t("timer_section.session")} <span className='tabular-nums'>{convertMsToHMS(totalMs)}</span>
    </>
  );
};

const CLOCK = "font-teko text-4xl font-semibold leading-none tabular-nums";

/**
 * The middle of the session bar: one key with the exercise's clock on it, and
 * the two ways back either side of it. Once the clock is down it steps aside —
 * the bar's white key is Next or Finish then — and offers the exercise again.
 */
export const SessionTransport = ({
  isPlaying,
  onToggle,
  onRestart,
  onBack,
  hidePlay = false,
  clockOnly = false,
}: SessionTransportProps) => {
  const { t } = useTranslation(["session", "common"]);
  const { time, formattedTimeLeft, isFinished } = useTimerContext();
  const hasStarted = time > 0;
  const label = isPlaying ? t("controls.pause") : hasStarted ? t("controls.resume") : t("start");
  const showsKey = !hidePlay && !clockOnly && !isFinished;
  const showsAgain = !hidePlay && !clockOnly && isFinished;

  return (
    <div className='flex items-center gap-3'>
      {onBack ? (
        <Button variant='subtle' size='icon-touch' onClick={onBack} aria-label={t("common:back")} title={t("common:back")}>
          <SkipBack />
        </Button>
      ) : (
        <span aria-hidden className='w-11' />
      )}

      {showsAgain ? (
        <Button variant='subtle' size='xl' className='h-14' onClick={onRestart}>
          <RotateCcw />
          {t("controls.again")}
        </Button>
      ) : (
        <SessionTooltip side='top' label={<SessionTime />}>
          {showsKey ? (
            <Button size='xl' className='h-16 min-w-60 gap-4 px-7 [&_svg]:size-7' onClick={onToggle} aria-label={label}>
              {isPlaying ? <Pause className='fill-current' /> : <Play className='fill-current' />}
              <span className={cn(CLOCK, "min-w-16 pt-1")}>{formattedTimeLeft}</span>
              <span className='min-w-16 text-left font-bold'>{label}</span>
            </Button>
          ) : (
            <span className={cn(CLOCK, "min-w-24 pt-1 text-center text-zinc-100")}>{formattedTimeLeft}</span>
          )}
        </SessionTooltip>
      )}

      {hasStarted && !clockOnly && !showsAgain ? (
        <Button
          variant='subtle'
          size='icon-touch'
          onClick={onRestart}
          aria-label={t("controls.restart")}
          title={t("controls.restart")}>
          <RotateCcw />
        </Button>
      ) : (
        <span aria-hidden className='w-11' />
      )}
    </div>
  );
};
