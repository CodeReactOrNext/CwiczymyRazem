import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { toggleLogReaction } from "feature/logs/services/toggleLogReaction.service";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

interface LogReactionProps {
  logId: string;
  reactions?: string[];
  currentUserId: string;
  disabled?: boolean;
  /** Fame the recipient gets when this row (or grouped row) is motivated. */
  fameAmount: number;
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

export const LogReaction = ({ logId, reactions = [], currentUserId, disabled, fameAmount }: LogReactionProps) => {
  const isReacted = reactions.includes(currentUserId);
  const [localReactions, setLocalReactions] = useState(reactions);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const rippleId = Date.now();
    setRipples((prev) => [
      ...prev,
      { id: rippleId, x: e.clientX - rect.left, y: e.clientY - rect.top },
    ]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    const nowReacted = !localReactions.includes(currentUserId);

    if (nowReacted) {
      setLocalReactions([...localReactions, currentUserId]);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 900);
      toast.success(
        <div className="flex items-center gap-1">
          <span>You motivated the player! You get +1</span>
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
        </div>,
        {
          icon: <img src="/images/coin.png" alt="coin" className="h-5 w-5 object-contain" />,
        }
      );
    } else {
      setLocalReactions(localReactions.filter((id) => id !== currentUserId));
    }

    await toggleLogReaction(logId, currentUserId, !nowReacted, fameAmount);
  };

  if (disabled && localReactions.length === 0) return null;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <motion.button
          onClick={handleToggle}
          whileTap={disabled ? undefined : { scale: 0.85 }}
          animate={isAnimating ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={cn(
            "group relative flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors duration-150 sm:min-h-[38px] sm:gap-2 sm:rounded-xl sm:px-3.5 sm:text-sm",
            disabled
              ? "cursor-default bg-amber-500/15 text-amber-400"
              : isReacted
              ? "cursor-pointer bg-amber-500/15 text-amber-400"
              : "cursor-pointer bg-zinc-800 text-zinc-400 shadow-sm hover:bg-zinc-700 hover:text-zinc-200"
          )}
          title={undefined}
        >
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg sm:rounded-xl">
            {ripples.map((ripple) => (
              <motion.span
                key={ripple.id}
                initial={{ opacity: 0.5, scale: 0 }}
                animate={{ opacity: 0, scale: 4 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/40"
                style={{ left: ripple.x, top: ripple.y }}
              />
            ))}
          </span>
          <AnimatePresence>
            {isAnimating && (
              <motion.span
                key="pulse"
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="pointer-events-none absolute inset-0 rounded-lg bg-amber-400/40 sm:rounded-xl"
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isAnimating &&
              BURST_COINS.map((coin, index) => (
                <motion.span
                  key={`burst-${index}`}
                  initial={{ opacity: 1, scale: 0.4, x: 0, y: 0, rotate: 0 }}
                  animate={{ opacity: 0, scale: 1, x: coin.x, y: coin.y, rotate: coin.rotate }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, delay: coin.delay, ease: "easeOut" }}
                  className="pointer-events-none absolute left-1/2 top-1/2 -ml-2 -mt-2 sm:-ml-2.5 sm:-mt-2.5"
                >
                  <img src="/images/coin.png" alt="" className="h-4 w-4 object-contain sm:h-5 sm:w-5" />
                </motion.span>
              ))}
          </AnimatePresence>
          <img
            src="/images/coin.png"
            alt="coin"
            className={cn(
              "h-5 w-5 object-contain transition-transform duration-200 sm:h-[22px] sm:w-[22px]",
              !isReacted && "opacity-50 group-hover:scale-110 group-hover:opacity-100"
            )}
          />
          {localReactions.length > 0 ? (
            <motion.span
              key={localReactions.length}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="text-xs font-bold tabular-nums sm:text-[13px]"
            >
              {localReactions.length * fameAmount}
            </motion.span>
          ) : (
            <span className="text-xs font-semibold tabular-nums sm:text-[13px]">+{fameAmount}</span>
          )}
        </motion.button>
      </TooltipTrigger>
      <TooltipContent className="bg-white text-zinc-900 border-zinc-200 font-bold shadow-xl">
        <div className="flex items-center gap-1.5 py-0.5">
          <span>Motivate the player and give them +{fameAmount}</span>
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
          <span className="mx-1 opacity-50">|</span>
          <span>you get +1</span>
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
