// @vitest-environment jsdom

import { spiderBasicExercise } from "feature/exercisePlan/data/exerises/spiderBasic/spiderBasic";
import { LandingExerciseCard } from "feature/landing/components/LandingExerciseCard";
import { getTabPreview } from "feature/landing/lib/tabPreview";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const exercise = {
  id: spiderBasicExercise.id,
  title: spiderBasicExercise.title,
  difficulty: spiderBasicExercise.difficulty,
  category: spiderBasicExercise.category,
  description: spiderBasicExercise.description,
  timeInMinutes: spiderBasicExercise.timeInMinutes,
  tabPreview: getTabPreview(spiderBasicExercise.tablature),
};

describe("LandingExerciseCard", () => {
  it("draws the exercise's own opening bar instead of a generic icon", () => {
    const html = renderToString(
      <LandingExerciseCard
        exercise={exercise}
        href='/beginner-guitar-exercises'
        guideLabel='Beginner guide'
      />,
    );

    expect(html.match(/<circle/g)).toHaveLength(16);
    expect(html).not.toContain("lucide-guitar");
    expect(html).toContain("Technique");
    expect(html).toContain("2 min");
  });

  it("renders the empty strings when an exercise has no tablature", () => {
    const html = renderToString(
      <LandingExerciseCard
        exercise={{ ...exercise, tabPreview: [] }}
        href='/beginner-guitar-exercises'
        guideLabel='Beginner guide'
      />,
    );

    expect(html.match(/<line/g)).toHaveLength(6);
    expect(html).not.toContain("<circle");
  });
});
