import { cn } from "assets/lib/utils";
import { toggleLogReaction } from "feature/logs/services/toggleLogReaction.service";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "assets/components/ui/tooltip";

interface LogReactionProps {
  logId: string;
  reactions?: string[];
  currentUserId: string;
  disabled?: boolean;
}

export const LogReaction = ({ logId, reactions = [], currentUserId, disabled }: LogReactionProps) => {
  const isReacted = reactions.includes(currentUserId);
  const [localReactions, setLocalReactions] = useState(reactions);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    const nowReacted = !localReactions.includes(currentUserId);

    if (nowReacted) {
      setLocalReactions([...localReactions, currentUserId]);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
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

    await toggleLogReaction(logId, currentUserId, !nowReacted);
  };

  if (disabled && localReactions.length === 0) return null;

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          onClick={handleToggle}
          className={cn(
            "group relative flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-all duration-150",
            disabled
              ? "cursor-default border-amber-500/50 bg-amber-500/15 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              : isReacted
              ? "cursor-pointer border-amber-500/50 bg-amber-500/15 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)] active:scale-90"
              : "cursor-pointer border-zinc-600 bg-zinc-800 text-zinc-400 shadow-sm hover:border-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 active:scale-90"
          )}
          title={undefined}
        >
          <AnimatePresence>
            {isAnimating && (
              <motion.span
                key="burst"
                initial={{ opacity: 1, scale: 1, y: 0 }}
                animate={{ opacity: 0, scale: 2, y: -18 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute"
              >
                <img src="/images/coin.png" alt="coin" className="h-5 w-5 object-contain" />
              </motion.span>
            )}
          </AnimatePresence>
          <img 
            src="/images/coin.png" 
            alt="coin" 
            className={cn(
              "h-5 w-5 object-contain transition-opacity duration-200",
              !isReacted && "opacity-50 group-hover:opacity-100"
            )} 
          />
          {localReactions.length > 0 ? (
            <span className="text-xs font-bold">{localReactions.length * 10}</span>
          ) : (
            <span className="text-xs font-semibold">+10</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-white text-zinc-900 border-zinc-200 font-bold shadow-xl">
        <div className="flex items-center gap-1.5 py-0.5">
          <span>Motivate the player and give them +10</span>
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
          <span className="mx-1 opacity-50">|</span>
          <span>you get +1</span>
          <img src="/images/coin.png" alt="coin" className="h-4 w-4 object-contain" />
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
