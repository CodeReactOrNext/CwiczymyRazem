import type { TablatureMeasure } from "feature/exercisePlan/types/exercise.types";
import { useMemo } from "react";

import type { TablatureRenderData } from "./tablatureRenderData";
import { buildTablatureRenderData, STRING_COLORS, STRING_SPACING } from "./tablatureRenderData";
import { STRING_COUNT } from "./tablatureStringRows";

export * from "./tablatureRenderData";

/** {@link buildTablatureRenderData}, memoized for a component. */
export function useTablatureRenderData(
  measures: TablatureMeasure[] | undefined,
  palette: readonly string[] = STRING_COLORS,
  stringSpacing: number = STRING_SPACING,
  flipStrings: boolean = false,
  stringCount: number = STRING_COUNT,
): TablatureRenderData {
  return useMemo(
    () => buildTablatureRenderData(measures, palette, stringSpacing, flipStrings, stringCount),
    [measures, palette, stringSpacing, flipStrings, stringCount],
  );
}
