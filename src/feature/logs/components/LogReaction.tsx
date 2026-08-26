import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { markMotivateHintDone } from "feature/logs/hooks/useMotivateHint";
import { toggleLogReaction } from "feature/logs/services/toggleLogReaction.service";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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
  /** Player the row belongs to — named in the tooltip and toast so the reward feels addressed. */
  recipientName?: string;
  /** Nudge this button as the one to try. The feed marks a single row, until the user gets it. */
  showHint?: boolean;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

/** Coin shrapnel launched from the button center on a successful reaction. */
const BURST_COINS = [
  { x: -30, y: -36, rotate: -45, delay: 0 },
  { x: -13, y: -50, rotate: 20, delay: 0.05 },
  { x: 3, y: -56, rotate: -10, delay: 0.1 },
  { x: 19, y: -46, rotate: 40, delay: 0.03 },
  { x: 32, y: -32, rotate: -25, delay: 0.08 },
];

const Coin = ({ className }: { className?: string }) => (
  <img
    src='/images/coin.png'
    alt=''
    className={cn("object-contain", className)}
  />
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

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
    if (disabled || isPending) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const rippleId = Date.now();
    setRipples((prev) => [
      ...prev,
      { id: rippleId, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    const nowReacted = !isReacted;

    setOptimistic({
      reacted: nowReacted,
      fame: Math.max(0, totalFame + (nowReacted ? fameAmount : -fameAmount)),
    });
    setIsPending(true);

    if (nowReacted) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 900);
    }

    try {
      const result = await toggleLogReaction(logId);

      // The server prices the reaction, so reconcile against what it actually granted.
      setOptimistic({
        reacted: result.reacted,
        fame: Math.max(0, totalFame + result.fameAwarded),
      });

      if (result.reacted) {
        // The button has been used once, so it no longer has to advertise itself anywhere.
        markMotivateHintDone();
        toast.success(
          <div className='flex flex-wrap items-center gap-1'>
            <span>You motivated {recipient}! They got</span>
            <span className='font-bold text-amber-400'>
              +{result.fameAwarded}
            </span>
            <Coin className='h-4 w-4' />
            <span>— you get</span>
            <span className='font-bold text-amber-400'>+1</span>
            <Coin className='h-4 w-4' />
          </div>,
          {
            icon: <Coin className='h-5 w-5' />,
          },
        );
      }
    } catch {
      // Drop the guess and fall back to whatever the stream says — nothing was written.
      setOptimistic(null);
      setIsAnimating(false);
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
          <span className='flex min-h-[32px] items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 text-xs font-semibold text-amber-400 sm:min-h-[38px] sm:gap-2 sm:px-3 sm:text-[13px]'>
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
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <motion.button
          type='button'
          onClick={handleToggle}
          disabled={isPending}
          aria-pressed={isReacted}
          aria-label={
            isReacted
              ? `Motivated. Click to take it back. This activity earned ${totalFame} Fame`
              : `Motivate ${recipient} and give them ${fameAmount} Fame`
          }
          whileTap={{ scale: 0.85 }}
          animate={isAnimating ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "group relative flex min-h-[32px] cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 sm:min-h-[38px] sm:gap-2 sm:px-3 sm:text-[13px]",
            isReacted
              ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
              : "bg-zinc-800 text-zinc-300 hover:bg-amber-500/15 hover:text-amber-300",
            showHint && !isReacted && "ring-1 ring-amber-400/40",
            isPending && "cursor-wait opacity-70",
          )}>
          {showHint && !isReacted && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0.2 }}
              animate={{ opacity: [0.2, 0.7, 0.2] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className='pointer-events-none absolute -inset-1 rounded-lg bg-amber-400/25 blur-md'
            />
          )}
          <span className='pointer-events-none absolute inset-0 overflow-hidden rounded-lg'>
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                initial={{ opacity: 0.5, scale: 0 }}
                animate={{ opacity: 0, scale: 4 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className='absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/40'
                style={{ left: ripple.x, top: ripple.y }}
              />
            ))}
          </span>
          <AnimatePresence>
            {isAnimating && (
              <motion.span
                key='pulse'
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className='pointer-events-none absolute inset-0 rounded-lg bg-amber-400/40'
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isAnimating &&
              BURST_COINS.map((coin, index) => (
                <motion.span
                  key={`burst-${index}`}
                  initial={{ opacity: 1, scale: 0.4, x: 0, y: 0, rotate: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 1,
                    x: coin.x,
                    y: coin.y,
                    rotate: coin.rotate,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    delay: coin.delay,
                    ease: "easeOut",
                  }}
                  className='pointer-events-none absolute left-1/2 top-1/2 -ml-2 -mt-2 sm:-ml-2.5 sm:-mt-2.5'>
                  <Coin className='h-4 w-4 sm:h-5 sm:w-5' />
                </motion.span>
              ))}
          </AnimatePresence>
          <span className='relative flex items-center gap-1.5 sm:gap-2'>
            <Coin
              className={cn(
                "h-5 w-5 transition-opacity duration-200 sm:h-[22px] sm:w-[22px]",
                !isReacted && "opacity-60 group-hover:opacity-100",
              )}
            />
            <span>{isReacted ? "Motivated" : "Motivate"}</span>
            <motion.span
              key={isReacted ? `total-${totalFame}` : `preview-${fameAmount}`}
              initial={isReacted ? { scale: 1.5 } : false}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className={cn(
                "font-bold tabular-nums",
                !isReacted && "text-amber-400",
              )}>
              {isReacted ? totalFame : `+${fameAmount}`}
            </motion.span>
          </span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>
        <div className='flex flex-wrap items-center gap-1.5 py-0.5'>
          {isReacted ? (
            <>
              <span>You motivated this — click again to take it back.</span>
              <span className='opacity-50'>|</span>
              <span>earned +{totalFame}</span>
              <Coin className='h-4 w-4' />
            </>
          ) : (
            <>
              <span>
                Click to motivate — {recipient} gets +{fameAmount}
              </span>
              <Coin className='h-4 w-4' />
              <span className='opacity-50'>|</span>
              <span>you get +1</span>
              <Coin className='h-4 w-4' />
            </>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
