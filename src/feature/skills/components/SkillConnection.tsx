import { motion } from "framer-motion";
import { SkillNodeDef } from "feature/skills/data/skillTreeStructure";

interface SkillConnectionProps {
  fromNode: SkillNodeDef;
  toNode: SkillNodeDef;
  isUnlocked: boolean; // If parent is unlocked, line is brighter
  color: string;
}

export const SkillConnection = ({ fromNode, toNode, isUnlocked, color }: SkillConnectionProps) => {
  const GRID_SIZE = 80;
  const GRID_GAP = 60;
  // Offset to center of node (w-24 = 96px width, but actual node circle is w-16 = 64px. w-24 includes padding)
  // The layout logic in SkillNode uses w-24 (96px) box. Center is 48, 48 relative to that box.
  // BUT in SkillNode: left = x * (GRID_SIZE + GRID_GAP). 
  // Let's match the logic.
  
  const getNodeCenter = (node: SkillNodeDef) => {
    const left = node.x * (GRID_SIZE + GRID_GAP);
    const top = node.y * (GRID_SIZE + GRID_GAP);
    // Center of the 24x24 tailwind unit box (96px) is 48.
    return { x: left + 48, y: top + 48 };
  };

  const start = getNodeCenter(fromNode);
  const end = getNodeCenter(toNode);

  return (
    <svg className="absolute inset-0 pointer-events-none overflow-visible w-full h-full z-0">
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
        stroke={isUnlocked ? color : "#27272a"} // Zinc-800 if locked
        strokeWidth="2"
        fill="none"
      />
      
      {/* Animated Dash for flow effect if unlocked */}
      {isUnlocked && (
        <motion.path
            d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 4"
            animate={{ strokeDashoffset: [20, 0] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </svg>
  );
};
