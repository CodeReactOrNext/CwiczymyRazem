import { cn } from "assets/lib/utils";
import { toggleLogReaction } from "feature/logs/services/toggleLogReaction.service";
import { AnimatePresence, motion } from "framer-motion";
import { FaGem } from "react-icons/fa";
import { useState } from "react";

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
    } else {
      setLocalReactions(localReactions.filter((id) => id !== currentUserId));
    }

    await toggleLogReaction(logId, currentUserId, !nowReacted);
  };

  if (disabled && localReactions.length === 0) return null;

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "group relative ml-2 flex min-h-[36px] items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-all duration-150",
        disabled
          ? "cursor-default border-amber-500/50 bg-amber-500/15 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
          : isReacted
          ? "cursor-pointer border-amber-500/50 bg-amber-500/15 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.2)] active:scale-90"
          : "cursor-pointer border-zinc-600 bg-zinc-800 text-zinc-400 shadow-sm hover:border-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 active:scale-90"
      )}
      title={disabled ? undefined : isReacted ? "Cofnij reakcję" : "Daj ognia!"}
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
            <FaGem size={13} className="text-amber-400" />
          </motion.span>
        )}
      </AnimatePresence>
      <FaGem
        size={13}
        className={cn(
          "transition-colors duration-200",
          isReacted ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
        )}
      />
      {localReactions.length > 0 ? (
        <span className="text-xs font-bold">{localReactions.length}</span>
      ) : (
        <span className="text-xs font-semibold">+1</span>
      )}
    </button>
  );
};
