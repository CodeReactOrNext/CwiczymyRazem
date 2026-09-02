import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "assets/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { Globe2 } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import type { ResetEntry } from "utils/gameLogic/resetSchedule";
import {
  formatServerTime,
  formatTimeLeft,
  getResetSchedule,
} from "utils/gameLogic/resetSchedule";

/**
 * Half a minute. Nothing here is stated finer than whole minutes, and a digit
 * ticking in the corner of the eye is a distraction on a screen someone is
 * practising in front of.
 */
const TICK_MS = 30_000;

const subscribeToTick = (onChange: () => void) => {
  const id = setInterval(onChange, TICK_MS);
  return () => clearInterval(id);
};

/** Coarse and stable between ticks, so React re-renders once a tick, not once a render. */
const getTickSnapshot = () => Math.floor(Date.now() / TICK_MS);

/** Hoisted so it keeps one identity — the server has no clock to offer here. */
const getServerTickSnapshot = () => null;

/**
 * Null on the server and through hydration, a live clock afterwards.
 *
 * The wall clock is genuinely an external store: the server renders its own
 * instant, and a clock hydrated from two different readings flickers on every
 * page load. Withholding it until after hydration costs one frame of placeholder
 * and removes the entire class of mismatch.
 */
const useClientNow = (): Date | null => {
  const tick = useSyncExternalStore(
    subscribeToTick,
    getTickSnapshot,
    getServerTickSnapshot,
  );

  return useMemo(() => (tick === null ? null : new Date()), [tick]);
};

/** Which clock a row runs on. The streak is the only one that is not the server's. */
const ScopeTag = ({ scope }: { scope: ResetEntry["scope"] }) => (
  <span
    className={cn(
      "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold",
      scope === "server"
        ? "bg-cyan-500/10 text-cyan-400/90"
        : "bg-amber-500/10 text-amber-400/90",
    )}>
    {scope === "server" ? "server" : "your time"}
  </span>
);

/** One rollover, as the modal lists it. */
const ResetRow = ({ entry, now }: { entry: ResetEntry; now: Date }) => (
  <div>
    <div className='flex items-baseline justify-between gap-3'>
      <span className='text-sm font-semibold text-zinc-200'>{entry.label}</span>
      <span className='shrink-0 text-sm font-bold tabular-nums text-cyan-300'>
        {formatTimeLeft(entry.nextResetAt - now.getTime())}
      </span>
    </div>
    <div className='mt-2 flex items-start gap-2.5'>
      <ScopeTag scope={entry.scope} />
      <p className='text-xs leading-relaxed text-zinc-500'>{entry.detail}</p>
    </div>
  </div>
);

/** Same footprint as the live clock, so the sidebar does not shift on hydration. */
const ResetClockPlaceholder = () => (
  <div className='flex items-center gap-2 px-3 py-2'>
    <Globe2 size={13} className='shrink-0 text-zinc-700' />
    <div className='h-3 w-20 rounded bg-white/[0.05]' />
  </div>
);

/**
 * The server clock, and behind it everything that turns over on it.
 *
 * Players could not tell when the game's day began, and guessed at it from
 * whenever they happened to notice the trader restocking — "around 10am my
 * time", which is midnight UTC seen from Australia. Everything shared runs on
 * that one clock precisely so a deadline can be stated once for everybody.
 *
 * Deliberately small in the sidebar: it is reference, not a feature, and it sits
 * on every page. The time alone answers the question most players arrive with;
 * hovering says what is coming next, and the modal is where the full list lives
 * rather than pushing the nav around whenever someone is curious.
 *
 * The list is also the only place the exception is stated. The practice streak
 * follows the player's own midnight, so an evening routine in the Americas is
 * not split across two days — and a bare UTC clock, with nothing next to it,
 * would quietly imply the streak dies at 4pm.
 */
export const ResetClock = () => {
  const now = useClientNow();

  if (!now) return <ResetClockPlaceholder />;

  const schedule = getResetSchedule(now);
  const next = schedule[0];

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type='button'
                aria-label='Server time and what resets next'
                className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors duration-200 hover:bg-white/5'>
                <Globe2 size={13} className='shrink-0 text-zinc-600' />
                <span className='text-xs font-semibold tabular-nums text-zinc-400'>
                  {formatServerTime(now)}
                </span>
                <span className='text-[10px] font-medium text-zinc-600'>
                  server time
                </span>
              </button>
            </DialogTrigger>
          </TooltipTrigger>

          <TooltipContent side='right' className='max-w-[240px]'>
            <p className='font-semibold'>
              {next.label} in {formatTimeLeft(next.nextResetAt - now.getTime())}
            </p>
            <p className='mt-1 text-zinc-400'>
              The game day starts at 00:00 UTC for everyone. Click for the full
              list.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Server time · {formatServerTime(now)} UTC</DialogTitle>
          <DialogDescription>
            Everything players share runs on one clock, so a deadline means the
            same thing wherever you are. Your practice streak is the exception —
            it follows your own midnight.
          </DialogDescription>
        </DialogHeader>

        <div className='mt-2 space-y-6'>
          {schedule.map((entry) => (
            <ResetRow key={entry.id} entry={entry} now={now} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
