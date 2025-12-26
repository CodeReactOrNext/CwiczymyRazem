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

  // Consolidate rendering to always show a visible button
  return (
    <button
      onClick={handleToggle}
      className={cn(
        "group relative ml-2 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold transition-all hover:scale-105 active:scale-95",
        isReacted
          ? "border-orange-500/30 bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
          : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-orange-500/30 hover:bg-zinc-800 hover:text-orange-400"
      )}
      title={isReacted ? "Remove reaction" : "High five!"}
    >
      <div className="relative flex items-center justify-center">
        <FaFire 
          size={12} 
          className={cn(
            "transition-colors duration-300", 
            isReacted ? "fill-orange-400" : "fill-current group-hover:text-orange-500"
          )} 
        />
        
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 1, scale: 1, y: 0 }}
              animate={{ opacity: 0, scale: 2.5, y: -10 }}
              className="absolute inset-0 pointer-events-none"
            >
              <FaFire size={12} className="text-orange-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {localReactions.length > 0 ? (
        <span>{localReactions.length}</span>
      ) : (
        <span className="opacity-0 w-0 overflow-hidden group-hover:w-auto group-hover:opacity-100 transition-all duration-300">
           React
        </span>
      )}
    </button>
  );
};
