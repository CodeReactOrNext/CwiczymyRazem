import { cn } from "assets/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { FaGraduationCap, FaInfoCircle, FaLightbulb } from "react-icons/fa";

import type { Exercise } from "../../../types/exercise.types";

interface MobileInstructionsCardProps {
  exercise: Exercise;
}

/**
 * Collapsible instructions / tips card for the mobile session view. Collapsed
 * it shows a two-line preview so the guidance is discoverable without eating
 * the small screen; tapping expands the full content.
 */
export const MobileInstructionsCard = ({ exercise }: MobileInstructionsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const instructions = exercise.instructions ?? [];
  const tips = exercise.tips ?? [];
  if (!instructions.length && !tips.length && !exercise.whyItMatters) return null;

  const preview = instructions[0] ?? exercise.whyItMatters ?? tips[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50">
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
      >
        <FaInfoCircle size={14} className="shrink-0 text-cyan-400/80" />
        <span className="flex-1 text-[11px] font-semibold capitalize tracking-wider text-zinc-200">
          Instructions
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {!isExpanded && (
        <p className="-mt-1 px-4 pb-3 text-xs leading-relaxed text-zinc-500 line-clamp-2">
          {preview}
        </p>
      )}

      {isExpanded && (
        <div className="space-y-5 border-t border-white/5 px-4 py-4">
          {exercise.whyItMatters && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-200">
                <FaGraduationCap size={12} />
                <h4 className="text-[10px] font-semibold capitalize tracking-wider">Why This Matters</h4>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">{exercise.whyItMatters}</p>
            </div>
          )}

          {instructions.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-200">
                <FaInfoCircle size={12} />
                <h4 className="text-[10px] font-semibold capitalize tracking-wider">Instructions</h4>
              </div>
              <ol className="space-y-2.5">
                {instructions.map((instruction, idx) => (
                  <li key={idx} className="flex gap-2.5 text-xs leading-relaxed text-zinc-300">
                    <span className="shrink-0 font-mono font-bold text-cyan-500/70">{idx + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tips.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-200">
                <FaLightbulb size={12} className="text-amber-400/80" />
                <h4 className="text-[10px] font-semibold capitalize tracking-wider">Pro Tips</h4>
              </div>
              <div className="space-y-2.5">
                {tips.map((tip, idx) => (
                  <div key={idx} className="flex gap-2.5 text-xs leading-relaxed text-zinc-400">
                    <span className="shrink-0 font-semibold text-amber-500/60">#{idx + 1}</span>
                    <p>{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
