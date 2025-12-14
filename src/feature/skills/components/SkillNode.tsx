import { Badge } from "assets/components/ui/badge";
import { cn } from "assets/lib/utils";
import type { CategoryKeys } from "components/Charts/ActivityChart";
import { getSkillTheme } from "feature/skills/constants/skillTreeTheme";
import type { GuitarSkill, GuitarSkillId } from "feature/skills/skills.types";
import { Lock, Star, Check } from "lucide-react";
import { motion } from "framer-motion";

interface SkillNodeProps {
  skill: GuitarSkill;
  x: number;
  y: number;
  isUnlocked: boolean;
  currentPoints: number;
  maxPoints?: number; 
  isAvailable: boolean; 
  isSelected?: boolean;
  onUpgrade: (id: GuitarSkillId) => void;
}

export const SkillNode = ({
  skill,
  x,
  y,
  isUnlocked,
  currentPoints,
  maxPoints = 5,
  isAvailable,
  isSelected,
  onUpgrade,
}: SkillNodeProps) => {
  const Icon = skill.icon || Star;
  const theme = getSkillTheme(skill.category);
  
  // Grid size constants - must match parent container
  const GRID_SIZE = 80; 
  const GRID_GAP = 60;
  
  const left = x * (GRID_SIZE + GRID_GAP);
  const top = y * (GRID_SIZE + GRID_GAP);

  return (
    <motion.div
      className={cn(
        "absolute flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 transform",
        "w-24 h-24 z-10 cursor-pointer group"
      )}
      style={{ left, top }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: (x + y) * 0.05 }}
      onClick={() => onUpgrade(skill.id)}
    >
      {/* Glow Effect for Available/Unlocked */}
      {(isUnlocked || isAvailable) && (
        <div className={cn(
          "absolute inset-0 rounded-full blur-xl opacity-40 transition-opacity duration-1000",
          theme.glow, 
          !isUnlocked && "animate-pulse" // Only pulse if available but not unlocked? Or both?
        )} />
      )}

      {/* Main Node Circle */}
      <div className={cn(
        "relative w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-lg",
        isSelected ? `ring-4 scale-110 z-20 ${theme.border} ring-opacity-40` : "", // Use theme border for ring too? or ring-COLOR
        // Simplified isSelected ring:
        isSelected && `ring-4 ring-white/20`, // Generic white ring or theme ring? Let's try Generic or Theme. Theme is better.
        
        isUnlocked 
          ? `bg-zinc-900 ${theme.border} ${theme.primary} shadow-[0_0_15px_rgba(0,0,0,0.5)]` // Add theme shadow manually or use utility class if mapped
          : isAvailable
            ? `bg-zinc-900 border-white/20 hover:${theme.border} ${theme.primary} hover:scale-110`
            : "bg-zinc-950 border-zinc-800 text-zinc-700 grayscale cursor-not-allowed"
      )}
      style={isSelected ? { borderColor: theme.line } : undefined} // Force border color on selection if needed
      >
        <Icon className="w-8 h-8" />
        
        {/* Level Indicator Badge */}
        {isUnlocked && (
           <div className={cn(
             "absolute -bottom-2 px-1.5 py-0.5 rounded-full shadow-sm text-[10px] font-bold border",
             "bg-zinc-900",
             theme.border,
             theme.primary
           )}>
             {currentPoints}
           </div>
        )}
      </div>

      {/* Label Tooltip */}
      <div className={cn(
        "mt-2 text-center transition-all duration-300 px-2 py-1 rounded bg-black/80 backdrop-blur-sm border border-white/10",
        isUnlocked || isAvailable ? "opacity-100" : "opacity-60",
      )}>
        <div className={cn("text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]", 
             isUnlocked ? theme.primary : "text-white"
        )}>
            {skill.name || skill.id.replace(/_/g, ' ')}
        </div>
      </div>

    </motion.div>
  );
};
