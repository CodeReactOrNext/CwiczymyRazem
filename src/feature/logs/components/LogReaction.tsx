import { useState } from "react";
import { FaFire } from "react-icons/fa";
import { cn } from "assets/lib/utils";
import { toggleLogReaction } from "feature/logs/services/toggleLogReaction.service";
import { motion, AnimatePresence } from "framer-motion";

interface LogReactionProps {
  logId: string;
  reactions?: string[];
  currentUserId: string;
}

export const LogReaction = ({ logId, reactions = [], currentUserId }: LogReactionProps) => {
  const isReacted = reactions.includes(currentUserId);
  const [localReactions, setLocalReactions] = useState(reactions);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const nowReacted = !localReactions.includes(currentUserId);
    
    if (nowReacted) {
      setLocalReactions([...localReactions, currentUserId]);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
    } else {
      setLocalReactions(localReactions.filter(id => id !== currentUserId));
    }
    
    await toggleLogReaction(logId, currentUserId, !nowReacted);
  };

  if (localReactions.length === 0 && !isReacted) {
    return (
      <button
        onClick={handleToggle}
        className="text-zinc-700 hover:text-orange-500/50 transition-colors p-1"
      >
        <FaFire size={12} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "group relative flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition-all",
        isReacted 
          ? "bg-orange-500/10 text-orange-500" 
          : "bg-zinc-800/30 text-zinc-500 hover:bg-zinc-800/50"
      )}
    >
      <div className="relative">
        <FaFire size={10} className={cn(isReacted && "fill-orange-500")} />
        
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 2 }}
              className="absolute inset-0 pointer-events-none"
            >
              <FaFire size={10} className="text-orange-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <span>{localReactions.length}</span>
    </button>
  );
};
