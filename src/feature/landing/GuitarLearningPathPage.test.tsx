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

import { journeyModules } from "feature/journey/data/journeyModules";
import { accuracyToStars } from "feature/journey/services/journey.service";
import { safeNextPath } from "utils/auth/safeNextPath";

import {
  LEARNING_PATH_FAQS,
  LEARNING_PATH_FIRST_STEP_PATH,
  LEARNING_PATH_MAP_ANCHOR,
  LEARNING_PATH_META,
  LEARNING_PATH_MODULE_COPY,
  LEARNING_PATH_ROUTES,
} from "./data/learningPath";
import {
  GuitarLearningPathPage,
  LEARNING_PATH_STAR_LADDER,
} from "./GuitarLearningPathPage";
import { buildGuitarLearningPathProps } from "./lib/learningPathProps";

const props = buildGuitarLearningPathProps();

describe("guitar learning path landing", () => {
  it("keeps SERP metadata within limits", () => {
    expect(LEARNING_PATH_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(LEARNING_PATH_META.metaDescription.length).toBeLessThanOrEqual(160);
    expect(LEARNING_PATH_FAQS).toHaveLength(3);
  });

  it("maps every live module and gives each one a profile", () => {
    expect(props.modules.map((m) => m.id)).toEqual(
      journeyModules.map((m) => m.id),
    );
    for (const entry of props.modules) {
      expect(LEARNING_PATH_MODULE_COPY[entry.id]).toBeDefined();
      expect(entry.stepCount).toBe(
        journeyModules
          .find((m) => m.id === entry.id)!
          .stages.flatMap((s) => s.steps).length,
      );
      expect(entry.entryChecklist.length).toBeGreaterThan(0);
      expect(entry.examCount).toBeGreaterThan(0);
    }
    expect(props.planned.length).toBeGreaterThan(0);
  });

  it("says where the microphone is needed, from the exercises themselves", () => {
    const fundamentals = props.modules.find((m) => m.id === "fundamentals")!;
    expect(fundamentals.listeningExamCount).toBe(fundamentals.examCount);

    // Click exams up to the last stage; the Play! stage listens.
    const fretboard = props.modules.find((m) => m.id === "fretboard")!;
    expect(fretboard.listeningExamCount).toBeGreaterThan(0);
    expect(fretboard.listeningExamCount).toBeLessThan(fretboard.examCount);
    expect(fretboard.listeningStages).toEqual(["Play!"]);
  });

  it("shows the same star thresholds the exam grades with", () => {
    LEARNING_PATH_STAR_LADDER.forEach((rung, idx) => {
      expect(accuracyToStars(rung.accuracy)).toBe(idx + 1);
    });
    expect(accuracyToStars(LEARNING_PATH_STAR_LADDER[0].accuracy - 1)).toBe(
      null,
    );
  });

  it("previews the first played lesson", () => {
    expect(props.firstLesson.title).toBe("First Melody");
    expect(props.firstLesson.examBpm).toBeGreaterThan(0);
    expect(props.firstLesson.tips.length).toBeGreaterThan(0);
  });

  it("sends CTAs through sign-up to the first step of the path", () => {
    expect(LEARNING_PATH_ROUTES.firstStage).toBe(
      `/signup?next=${encodeURIComponent(LEARNING_PATH_FIRST_STEP_PATH)}`,
    );
    const next = new URL(
      `https://x${LEARNING_PATH_ROUTES.firstStage}`,
    ).searchParams.get("next");
    expect(safeNextPath(next)).toBe(LEARNING_PATH_FIRST_STEP_PATH);

    const [, query] = LEARNING_PATH_FIRST_STEP_PATH.split("?");
    const params = new URLSearchParams(query);
    const firstModule = journeyModules.find(
      (m) => m.id === params.get("module"),
    );
    expect(firstModule?.stages[0].steps[0].id).toBe(params.get("step"));
  });

  it("server-renders the H1, the stage map, the modules and the CTAs", () => {
    const html = renderToString(<GuitarLearningPathPage {...props} />);

    expect(html).toContain(LEARNING_PATH_META.title);
    expect(html).toContain(`id="${LEARNING_PATH_MAP_ANCHOR}"`);
    for (const entry of props.modules) {
      expect(html).toContain(entry.title);
      for (const step of entry.stages.flatMap((s) => s.steps)) {
        expect(html).toContain(step.title.replace(/&/g, "&amp;"));
      }
    }
    for (const entry of props.planned) {
      expect(html).toContain(entry.title.replace(/&/g, "&amp;"));
    }
    for (const href of Object.values(LEARNING_PATH_ROUTES)) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain("See the first stage");
    expect(html).toContain('href="/wiki/note-detection"');
    expect(html).not.toContain('"FAQPage"');
  });
});
