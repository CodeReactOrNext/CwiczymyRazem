import { Guitar, Headphones, Music } from "lucide-react";
import { memo } from "react";
import { TbGuitarPick } from "react-icons/tb";

import type { ExerciseCategory } from "../../../types/exercise.types";

interface BackgroundAmbianceProps {
  category: ExerciseCategory | "mixed";
  isPlayalong?: boolean;
  visible?: boolean;
}

// Category accent colours (Tailwind *-500) used to tint the icon pattern.
const CATEGORY_HEX: Record<string, string> = {
  technique:  "#3b82f6", // blue-500
  theory:     "#10b981", // emerald-500
  creativity: "#a855f7", // purple-500
  hearing:    "#f97316", // orange-500
  mixed:      "#06b6d4", // cyan-500
};

export const BackgroundAmbiance = memo(function BackgroundAmbiance({ category, isPlayalong, visible = true }: BackgroundAmbianceProps) {
  if (!visible) return null;

  const color = isPlayalong ? "#dc2626" : (CATEGORY_HEX[category] ?? CATEGORY_HEX.mixed);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Tiled icon pattern, tinted to the category colour */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" style={{ color }}>
        <defs>
          <pattern id="session-bg-pattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse" patternTransform="rotate(-15)">
            <g transform="translate(20, 20) scale(1)">
              <Guitar size={32} strokeWidth={1.5} />
            </g>
            <g transform="translate(100, 40) scale(1)">
              <Music size={28} strokeWidth={1.5} />
            </g>
            <g transform="translate(40, 100) scale(1)">
              <TbGuitarPick size={30} strokeWidth={1.5} />
            </g>
            <g transform="translate(110, 110) scale(1)">
              <Headphones size={32} strokeWidth={1.5} />
            </g>
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="url(#session-bg-pattern)" />
      </svg>
    </div>
  );
});
