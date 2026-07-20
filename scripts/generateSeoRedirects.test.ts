import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { writeFileSync } from "fs";
import { getExerciseLandingHref } from "lib/exerciseLandingLink";
import { join } from "path";
import { describe, expect, it } from "vitest";

/**
 * Script-as-test (same convention as the former exportExercises.test.ts):
 * regenerates scripts/seoRedirects.json — a 301 for every legacy
 * /exercises/{slug} URL pointing at the most relevant SEO landing page.
 * next.config.js require()s the JSON, so the file is committed.
 *
 * Rerun with: npx vitest run scripts/generateSeoRedirects.test.ts
 */
describe("generate SEO redirects for legacy /exercises URLs", () => {
  it("writes scripts/seoRedirects.json with one 301 per exercise", () => {
    const seen = new Set<string>();
    const redirects = exercisesAgregat.flatMap((exercise) => {
      const source = `/exercises/${idToSlug(exercise.id)}`;
      if (seen.has(source)) return [];
      seen.add(source);
      return [
        {
          source,
          destination: getExerciseLandingHref(exercise.id, exercise),
          permanent: true,
        },
      ];
    });

    expect(redirects.length).toBeGreaterThan(150);
    for (const redirect of redirects) {
      expect(redirect.destination.startsWith("/")).toBe(true);
    }

    writeFileSync(
      join(__dirname, "seoRedirects.json"),
      JSON.stringify(redirects, null, 2) + "\n"
    );
  });
});
