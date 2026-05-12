import { cn } from "assets/lib/utils";
import { memo } from "react";

import type { ExerciseCategory } from "../../../types/exercise.types";

interface BackgroundAmbianceProps {
  category: ExerciseCategory | "mixed";
  isPlayalong?: boolean;
  visible?: boolean;
}

export const BackgroundAmbiance = memo(function BackgroundAmbiance({ category, isPlayalong, visible = true }: BackgroundAmbianceProps) {
  if (!visible) return null;
  return (
    <>
      <div className={cn(
        "absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-20 transition-all duration-1000",
        category === "technique"  && "bg-blue-500",
        category === "theory"     && "bg-emerald-500",
        category === "creativity" && "bg-purple-500",
        category === "hearing"    && "bg-orange-500",
        category === "mixed"      && "bg-cyan-500",
        isPlayalong && "bg-red-600 opacity-30 blur-[150px]"
      )} />
      <div className={cn(
        "absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10 transition-all duration-1000",
        category === "technique"  && "bg-indigo-500",
        category === "theory"     && "bg-green-500",
        category === "creativity" && "bg-pink-500",
        category === "hearing"    && "bg-amber-500",
        category === "mixed"      && "bg-blue-500"
      )} />
    </>
  );
});
