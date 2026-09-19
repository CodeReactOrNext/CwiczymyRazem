// @vitest-environment jsdom

import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { serializeExercise } from "feature/exercises/lib/serializeExercise";
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

import {
  INTERACTIVE_PRACTICE_DEMO_EXERCISE_ID,
  INTERACTIVE_PRACTICE_FAQS,
  INTERACTIVE_PRACTICE_META,
  INTERACTIVE_PRACTICE_START_HREF,
} from "./data/interactivePractice";
import { InteractiveGuitarPracticePage } from "./InteractiveGuitarPracticePage";

const demoExercise = exercisesAgregat.find(
  (ex) => ex.id === INTERACTIVE_PRACTICE_DEMO_EXERCISE_ID,
);

describe("interactive guitar practice landing", () => {
  it("embeds a demo exercise that exists and has notation to render", () => {
    expect(demoExercise).toBeTruthy();
    expect(demoExercise?.tablature?.length).toBeGreaterThan(0);
    expect(demoExercise?.metronomeSpeed).toBeTruthy();
  });

  it("keeps SERP metadata within limits and the intent split (three FAQs)", () => {
    expect(INTERACTIVE_PRACTICE_META.metaTitle.length).toBeLessThanOrEqual(60);
    expect(
      INTERACTIVE_PRACTICE_META.metaDescription.length,
    ).toBeLessThanOrEqual(160);
    // Setup and hardware questions belong in the wiki; the landing answers
    // only the three about the feedback itself (duplication review 2026-09-19).
    expect(INTERACTIVE_PRACTICE_FAQS).toHaveLength(3);
  });

  it("sends Start through sign-up and straight into the demo drill", () => {
    expect(INTERACTIVE_PRACTICE_START_HREF).toBe(
      "/signup?next=%2Fpractice%2Fexercise%2Fchromatic-accents",
    );
  });

  it("server-renders the H1, the demo drill, the FAQ and the wiki hand-off", () => {
    const html = renderToString(
      <InteractiveGuitarPracticePage
        exercise={serializeExercise(demoExercise!)}
      />,
    );

    expect(html).toContain(INTERACTIVE_PRACTICE_META.title);
    expect(html).toContain(demoExercise!.title);
    for (const faq of INTERACTIVE_PRACTICE_FAQS) {
      expect(html).toContain(faq.title);
    }
    expect(html).toContain('href="/wiki/note-detection"');
    expect(html).toContain(
      `href="${INTERACTIVE_PRACTICE_START_HREF.replace(/&/g, "&amp;")}"`,
    );
  });
});
