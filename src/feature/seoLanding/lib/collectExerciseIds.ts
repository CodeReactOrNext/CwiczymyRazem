import type { SeoLandingConfig } from "../types/seoLanding.types";

/** Exercise ids embedded on a landing page, in reading order. */
export const collectExerciseIds = (config: SeoLandingConfig): string[] =>
  config.sections.flatMap((section) =>
    section.blocks.flatMap((block) =>
      block.kind === "exercise" ? [block.exerciseId] : []
    )
  );
