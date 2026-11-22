import type { ChipColor } from "assets/components/ui/chip";
import type { ExerciseCategory } from "feature/exercisePlan/types/exercise.types";

/**
 * The one exercise category → Chip colour map. Same hues as the category dots in the
 * auto-plan generator (`CATEGORY_DOT`): technique emerald, theory blue, hearing amber,
 * creativity purple. Anything else (mixed, unknown) stays neutral.
 */
export const CATEGORY_CHIP_COLOR: Record<ExerciseCategory, ChipColor> = {
  technique: "emerald",
  theory: "blue",
  hearing: "amber",
  creativity: "purple",
  mixed: "gray",
};

export const getCategoryChipColor = (category: string | undefined): ChipColor =>
  (category && CATEGORY_CHIP_COLOR[category as ExerciseCategory]) || "gray";
