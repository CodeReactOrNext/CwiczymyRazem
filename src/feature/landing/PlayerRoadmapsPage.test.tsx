// @vitest-environment jsdom

import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// next/font/google only works inside the Next compiler; outside it the export
// is a plain object, so hand the page the variable class it expects.
vi.mock("next/font/google", () => ({
  Plus_Jakarta_Sans: () => ({
    variable: "--font-jakarta-landing",
    className: "",
  }),
}));

import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import {
  ROADMAP_GENERATION_COST,
  ROADMAP_PRIVATE_GENERATION_COST,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import { safeNextPath } from "utils/auth/safeNextPath";

import {
  ROADMAP_EXAMPLES,
  ROADMAP_FACTS,
  ROADMAP_STEP_EXAMPLE,
} from "./data/playerRoadmapExamples";
import {
  PLAYER_ROADMAPS_APP_PATH,
  PLAYER_ROADMAPS_CTA_HREF,
  PLAYER_ROADMAPS_FAQS,
  PLAYER_ROADMAPS_META,
  PLAYER_ROADMAPS_PRICES,
} from "./data/playerRoadmaps";
import { buildPlayerRoadmapsProps } from "./lib/playerRoadmapsProps";
import { PlayerRoadmapsPage } from "./PlayerRoadmapsPage";

const props = buildPlayerRoadmapsProps();
const html = renderToString(<PlayerRoadmapsPage {...props} />);

describe("player roadmaps landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(PLAYER_ROADMAPS_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(PLAYER_ROADMAPS_META.metaDescription.length).toBeLessThanOrEqual(
      160,
    );
    expect(html).toContain("<h1");
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it("sends the CTA through sign-up to the roadmaps page", () => {
    const next = new URLSearchParams(
      PLAYER_ROADMAPS_CTA_HREF.split("?")[1],
    ).get("next");
    expect(safeNextPath(next)).toBe(PLAYER_ROADMAPS_APP_PATH);
    expect(html).toContain(
      `href="${PLAYER_ROADMAPS_CTA_HREF.replace(/&/g, "&amp;")}"`,
    );
  });

  it("quotes the prices the generator actually charges", () => {
    const tokens = PLAYER_ROADMAPS_PRICES.map((price) => price.tokens);
    expect(tokens).toContain(ROADMAP_GENERATION_COST);
    expect(tokens).toContain(ROADMAP_PRIVATE_GENERATION_COST);
    expect(PLAYER_ROADMAPS_FAQS[0].message).toContain(
      `${ROADMAP_GENERATION_COST} tokens`,
    );
  });

  it("names a step exercise that is in the library", () => {
    const exercise = exercisesAgregat.find(
      (entry) => entry.id === ROADMAP_STEP_EXAMPLE.exerciseId,
    );
    expect(exercise?.title).toBe(props.stepExerciseTitle);
    expect(html).toContain(props.stepExerciseTitle.replace(/&/g, "&amp;"));
  });

  it("keeps the frozen examples consistent with the facts quoted", () => {
    const showcase = ROADMAP_EXAMPLES.find(
      (roadmap) => roadmap.id === ROADMAP_STEP_EXAMPLE.roadmapId,
    );
    expect(showcase).toBeDefined();
    expect(
      showcase!.phases[ROADMAP_STEP_EXAMPLE.phaseIndex].steps[
        ROADMAP_STEP_EXAMPLE.stepIndex
      ].title,
    ).toBe(ROADMAP_STEP_EXAMPLE.title);

    for (const roadmap of ROADMAP_EXAMPLES) {
      const steps = roadmap.phases.reduce((n, p) => n + p.steps.length, 0);
      expect(roadmap.phases.length).toBeGreaterThanOrEqual(
        ROADMAP_FACTS.phasesMin,
      );
      expect(roadmap.phases.length).toBeLessThanOrEqual(
        ROADMAP_FACTS.phasesMax,
      );
      expect(steps).toBeGreaterThanOrEqual(ROADMAP_FACTS.stepsMin);
      expect(steps).toBeLessThanOrEqual(ROADMAP_FACTS.stepsMax);
    }
  });

  it("renders every step of the showcase roadmap for crawlers", () => {
    const showcase = ROADMAP_EXAMPLES.find(
      (roadmap) => roadmap.id === ROADMAP_STEP_EXAMPLE.roadmapId,
    )!;
    const escape = (text: string) =>
      text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
    for (const phase of showcase.phases) {
      for (const step of phase.steps) {
        expect(html).toContain(escape(step.title));
      }
    }
  });
});
