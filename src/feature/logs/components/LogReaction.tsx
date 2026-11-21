import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { PRESSABLE } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import styles from "feature/logs/components/LogReaction.module.css";
import { markMotivateHintDone } from "feature/logs/hooks/useMotivateHint";
import { toggleLogReaction } from "feature/logs/services/toggleLogReaction.service";
import { Check } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { toast } from "sonner";

interface LogReactionProps {
  /** Log the reaction is anchored to — the stable, oldest member of the group. */
  logId: string;
  /** Everyone who reacted anywhere in the group. */
  reactions?: string[];
  currentUserId: string;
  disabled?: boolean;
  /** Fame the recipient would get for this row — a preview; the server prices the reaction itself. */
  fameAmount: number;
  /** Fame the row has already earned from earlier reactions. */
  awardedFame: number;
  /** Player the row belongs to — named in the button's label for screen readers. */
  recipientName?: string;
  /** Nudge this button as the one to try. The feed marks a single row, until the user gets it. */
  showHint?: boolean;
}

/** How long the whole celebration runs — the last spilled coin fades out just before this. */
const CELEBRATION_MS = 1300;

/** When the tossed coin lands back in the button (72% of its 640 ms toss). */
const LANDING_MS = 440;

/**
 * The "+1 for you" receipt waits until the spilled coins have mostly fallen, so it never lands on
 * top of them, then stays up long enough to be read.
 */
const RECEIPT_AFTER_MS = 900;
const RECEIPT_MS = 1000;

/**
 * Coins the landing knocks loose, flying out of the tossed coin: sideways drift, peak height,
 * where they drop to (px), spin (deg), size and stagger (ms after the landing).
 */
const SPILL = [
  { dx: -30, peak: -24, fall: 12, spin: -220, size: 0.8, delay: 0 },
  { dx: -14, peak: -34, fall: 16, spin: 160, size: 1, delay: 30 },
  { dx: 4, peak: -38, fall: 10, spin: -140, size: 0.9, delay: 10 },
  { dx: 20, peak: -30, fall: 18, spin: 240, size: 1, delay: 45 },
  { dx: 34, peak: -20, fall: 12, spin: -180, size: 0.75, delay: 20 },
];

const spillStyle = ({
  dx,
  peak,
  fall,
  spin,
  size,
  delay,
}: (typeof SPILL)[number]) =>
  ({
    "--dx": `${dx}px`,
    "--peak": `${peak}px`,
    "--fall": `${fall}px`,
    "--spin": `${spin}deg`,
    "--size": size,
    "--delay": `${LANDING_MS + delay}ms`,
  }) as CSSProperties;

const Coin = ({ className }: { className?: string }) => (
  <img
    src='/images/tokens/coin.png'
    alt=''
    className={cn("object-contain", className)}
  />
);

/** What stands in the coin's slot once the Fame is paid out. */
const PaidCheck = ({ className }: { className?: string }) => (
  <span
    // Solid already — a bannered row's underlay has nothing to add here.
    data-opaque
    className={cn(
      "flex h-5 w-5 items-center justify-center rounded-full bg-zinc-950 text-amber-400 sm:h-[22px] sm:w-[22px]",
      className,
    )}>
    <Check size={13} strokeWidth={3.5} aria-hidden />
  </span>
);

export const LogReaction = ({
  logId,
  reactions = [],
  currentUserId,
  disabled,
  fameAmount,
  awardedFame,
  recipientName,
  showHint,
}: LogReactionProps) => {
  const [optimistic, setOptimistic] = useState<{
    reacted: boolean;
    fame: number;
  } | null>(null);
  const [isPending, setIsPending] = useState(false);
  // Id of the celebration on screen (0 = none); keys its pieces so a retry after an error replays it.
  const [celebration, setCelebration] = useState(0);
  // The motivator's own +1 shows as a bubble pinned to the button — the only time it has a tooltip.
  const [showReceipt, setShowReceipt] = useState(false);

  // The optimistic guess only stands in until the logs stream reports the same thing; the moment
  // props agree it stops applying on its own, so there's nothing to clear and no flicker in between.
  const streamedReacted = reactions.includes(currentUserId);
  const isGuessing =
    optimistic !== null && optimistic.reacted !== streamedReacted;
  const isReacted = isGuessing ? optimistic.reacted : streamedReacted;
  const totalFame = isGuessing ? optimistic.fame : awardedFame;
  const recipient = recipientName ?? "the player";

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Motivating is one-way — once given it stays, so a motivated row ignores further clicks.
    if (disabled || isPending || isReacted) return;

    const celebrationId = Date.now();
    setCelebration(celebrationId);
    setTimeout(
      () => setCelebration((id) => (id === celebrationId ? 0 : id)),
      CELEBRATION_MS,
    );

    setOptimistic({ reacted: true, fame: totalFame + fameAmount });
    setIsPending(true);

    try {
      const result = await toggleLogReaction(logId);

      // The server prices the reaction, so reconcile against what it actually granted.
      setOptimistic({
        reacted: result.reacted,
        fame: Math.max(0, totalFame + result.fameAwarded),
      });

      if (result.reacted && result.fameAwarded > 0) {
        // The button has been used once, so it no longer has to advertise itself anywhere.
        markMotivateHintDone();
        // Their +N already lifted off the button; the receipt is only for what the motivator earned.
        setTimeout(
          () => {
            setShowReceipt(true);
            setTimeout(() => setShowReceipt(false), RECEIPT_MS);
          },
          Math.max(0, celebrationId + RECEIPT_AFTER_MS - Date.now()),
        );
      }
    } catch {
      // Drop the guess and fall back to whatever the stream says — nothing was written.
      setOptimistic(null);
      setCelebration(0);
      toast.error("Could not update the reaction. Try again.");
    } finally {
      setIsPending(false);
    }
  };

  // Own row: there is nothing to press here, so it reads as the counter it actually is instead of
  // as a button that quietly refuses to work.
  if (disabled) {
    if (reactions.length === 0) return null;

    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span className='flex min-h-11 items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-400 sm:gap-2 sm:px-3 sm:text-[13px]'>
            <Coin className='h-5 w-5 sm:h-[22px] sm:w-[22px]' />
            <span className='tabular-nums'>{totalFame}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className='flex items-center gap-1.5 py-0.5'>
            <span>
              {reactions.length === 1
                ? "1 player"
                : `${reactions.length} players`}{" "}
              motivated you — you earned +{totalFame}
            </span>
            <Coin className='h-4 w-4' />
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <>
      {/* No hover tooltip — this one opens only for the receipt. */}
      <Tooltip open={showReceipt}>
        <TooltipTrigger asChild>
          <button
            type='button'
            onClick={handleToggle}
            disabled={isPending}
            aria-pressed={isReacted}
            aria-disabled={isReacted}
            // Both faces are solid, so a bannered row's underlay skips this button.
            data-opaque
            aria-label={
              isReacted
                ? `Motivated. This activity earned ${totalFame} Fame`
                : `Motivate ${recipient} and give them ${fameAmount} Fame`
            }
            className={cn(
              PRESSABLE,
              "group relative flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs transition-[color,background-color,transform] duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 sm:gap-2 sm:px-3 sm:text-[13px]",
              // Both faces are opaque: the button also sits on players' banners, where a tinted,
              // see-through face lost its colour and the two states read as the same dark key.
              // A motivated row is solid gold; one still waiting for you is a neutral key.
              // The gold key stays pressed in — no lip underneath, a dark edge above — because
              // motivating is one-way and there is nothing left to press.
              isReacted
                ? "cursor-default border-b-0 border-t-[3px] border-t-amber-700 bg-amber-400 font-bold text-zinc-950 active:[clip-path:none] active:[translate:none]"
                : "cursor-pointer border-b-zinc-950 bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
              showHint && !isReacted && "ring-1 ring-amber-400/40",
            )}>
            {showHint && !isReacted && (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -inset-1 rounded-lg bg-amber-400/25 blur-md",
                  styles.hint,
                )}
              />
            )}
            {celebration !== 0 && (
              <span
                key={`pulse-${celebration}`}
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 rounded-lg bg-amber-400/30",
                  styles.pulse,
                )}
              />
            )}
            <span className='relative flex items-center gap-1.5 sm:gap-2'>
              <span className='relative flex [perspective:240px]'>
                {isReacted ? (
                  // Paid out: the coin has left the button, and a check stands where it was.
                  // The check is the slot's own element from the click on and only fades in;
                  // the tossed coin is laid over it. Swapping one element for another when
                  // the celebration ended made the mark hop.
                  <>
                    <PaidCheck
                      className={celebration !== 0 ? styles.checkIn : undefined}
                    />
                    {celebration !== 0 && (
                      <Coin
                        className={cn(
                          "absolute inset-0 h-full w-full",
                          styles.toss,
                        )}
                      />
                    )}
                  </>
                ) : (
                  <Coin className='h-5 w-5 sm:h-[22px] sm:w-[22px]' />
                )}
                {celebration !== 0 &&
                  SPILL.map((coin, index) => (
                    <span
                      key={`spill-${celebration}-${index}`}
                      aria-hidden
                      style={spillStyle(coin)}
                      className={cn(
                        "pointer-events-none absolute left-1/2 top-1/2",
                        styles.drift,
                      )}>
                      <span className={cn("absolute left-0 top-0", styles.arc)}>
                        <Coin className='absolute -left-1.5 -top-1.5 h-3 w-3 max-w-none' />
                      </span>
                    </span>
                  ))}
              </span>
              {/* The coin and the +N carry it on a phone; the word only crowds the name. */}
              <span className='hidden sm:inline'>
                {isReacted ? "Motivated" : "Motivate"}
              </span>
              <span className='relative'>
                <span
                  className={cn(
                    "inline-block font-bold tabular-nums",
                    !isReacted && "text-amber-400",
                    celebration !== 0 && styles.pop,
                  )}>
                  {isReacted ? totalFame : `+${fameAmount}`}
                </span>
                {celebration !== 0 && (
                  // The preview "+N" lifts off as the new total takes its place.
                  <span
                    key={`lift-${celebration}`}
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 flex items-center justify-center whitespace-nowrap font-bold tabular-nums text-zinc-950",
                      styles.lift,
                    )}>
                    +{fameAmount}
                  </span>
                )}
              </span>
            </span>
          </button>
        </TooltipTrigger>
        {/* Straight from the primitive, so the shared tooltip's zoom-in stays out of it: this one
            runs its own rise-and-fade. Still portalled, so the donation card's overflow can't clip it. */}
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side='top'
            sideOffset={6}
            className={cn(
              "z-[130] flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-1 font-sans text-xs font-semibold text-zinc-400",
              styles.receipt,
            )}>
            <span className='tabular-nums text-amber-300'>+1</span>
            <span>for you</span>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </Tooltip>
      {/* The receipt bubble is visual only — say the same thing to screen readers. */}
      <span role='status' className='sr-only'>
        {showReceipt ? "You earned 1 Fame for motivating" : ""}
      </span>
    </>
  );
};
