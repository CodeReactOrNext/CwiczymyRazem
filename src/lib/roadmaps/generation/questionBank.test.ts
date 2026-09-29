import { describe, expect, it } from "vitest";

import {
  BANK_QUESTION_IDS,
  cleanOptions,
  enforcePickRules,
  MAX_CUSTOM_QUESTIONS,
  MAX_QUESTIONS,
  QUESTION_BANK,
  renderQuestionBank,
} from "./questionBank";

const opts = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    value: `v${i}`,
    label: `Option ${i}`,
  }));

describe("question bank", () => {
  it("lists every id once, in priority order", () => {
    expect(QUESTION_BANK.map((q) => q.id)).toEqual([...BANK_QUESTION_IDS]);
    expect(new Set(BANK_QUESTION_IDS).size).toBe(BANK_QUESTION_IDS.length);
  });

  it("gives every fixed-option question at least two options and every model question a brief", () => {
    for (const question of QUESTION_BANK) {
      if (question.kind === "radio" || question.kind === "checkboxes") {
        expect(question.options?.length ?? 0).toBeGreaterThanOrEqual(2);
      }
      if (
        question.kind === "modelRadio" ||
        question.kind === "modelCheckboxes"
      ) {
        expect(question.optionsBrief).toBeTruthy();
        expect(question.options).toBeUndefined();
      }
    }
  });

  it("renders the bank for the prompt with every id and its rule", () => {
    const text = renderQuestionBank();
    for (const question of QUESTION_BANK) {
      expect(text).toContain(`- ${question.id} —`);
      expect(text).toContain(question.when);
    }
  });
});

describe("cleanOptions", () => {
  it("trims, deduplicates by value, falls back to the label and caps", () => {
    expect(
      cleanOptions([
        { value: " a ", label: " Alpha " },
        { value: "a", label: "Again" },
        { label: "Beta" },
        { value: "", label: "" },
        { value: "c", label: "C" },
        { value: "d", label: "D" },
        { value: "e", label: "E" },
      ]),
    ).toEqual([
      { value: "a", label: "Alpha" },
      { value: "Beta", label: "Beta" },
      { value: "c", label: "C" },
      { value: "d", label: "D" },
    ]);
    expect(cleanOptions("nope")).toEqual([]);
  });
});

describe("enforcePickRules", () => {
  it("keeps only bank ids, in bank order, and drops duplicates", () => {
    const { asked } = enforcePickRules(
      [
        { id: "ending", options: [] },
        { id: "songs", options: [] },
        { id: "made-up", options: [] },
        { id: "songs", options: [] },
      ],
      [],
    );
    expect(asked.map((q) => q.id)).toEqual(["songs", "ending"]);
  });

  it("drops a model question without enough options and strips options from fixed ones", () => {
    const { asked } = enforcePickRules(
      [
        { id: "sides", options: opts(1) },
        { id: "useFor", options: opts(3) },
        { id: "includes", options: opts(3) },
      ],
      [],
    );
    expect(asked).toEqual([
      { id: "useFor", options: opts(3) },
      { id: "includes" },
    ]);
  });

  it("applies the pairing rules", () => {
    const ids = (asked: { id: string }[]) => asked.map((q) => q.id);

    expect(
      ids(enforcePickRules([{ id: "target", options: opts(3) }], []).asked),
    ).toEqual([]);
    expect(
      ids(
        enforcePickRules(
          [
            { id: "target", options: opts(3) },
            { id: "startingPoint", options: opts(3) },
          ],
          [],
        ).asked,
      ),
    ).toEqual(["startingPoint", "target"]);

    expect(
      ids(enforcePickRules([{ id: "repertoireDepth", options: [] }], []).asked),
    ).toEqual([]);
    expect(
      ids(
        enforcePickRules(
          [
            { id: "repertoireDepth", options: [] },
            { id: "songs", options: [] },
          ],
          [],
        ).asked,
      ),
    ).toEqual(["songs", "repertoireDepth"]);

    expect(
      ids(
        enforcePickRules(
          [
            { id: "weakSpot", options: opts(3) },
            { id: "startingPoint", options: opts(3) },
          ],
          [],
        ).asked,
      ),
    ).toEqual(["startingPoint"]);
  });

  it("cleans custom questions and caps them", () => {
    const { custom } = enforcePickRules(
      [],
      [
        {
          question: "  How long was the break? ",
          options: opts(3),
          multi: false,
        },
        { question: "No options", options: opts(1), multi: false },
        { question: "Which era?", options: opts(2), multi: true },
        { question: "One too many", options: opts(2), multi: false },
      ],
    );
    expect(custom).toHaveLength(MAX_CUSTOM_QUESTIONS);
    expect(custom[0]).toEqual({
      id: "custom-1",
      question: "How long was the break?",
      options: opts(3),
      multi: false,
    });
    expect(custom[1].id).toBe("custom-2");
    expect(custom[1].multi).toBe(true);
  });

  it("cuts to the cap: practiceStyle first, then customs, then the tail", () => {
    const all = BANK_QUESTION_IDS.map((id) => ({ id, options: opts(3) }));
    const result = enforcePickRules(all, [
      { question: "Custom one", options: opts(2), multi: false },
    ]);
    expect(result.asked.length + result.custom.length).toBe(MAX_QUESTIONS);
    expect(result.asked.map((q) => q.id)).not.toContain("practiceStyle");
    expect(result.custom).toEqual([]);

    const five = enforcePickRules(
      [
        { id: "songs", options: [] },
        { id: "includes", options: [] },
        { id: "ending", options: [] },
        { id: "practiceStyle", options: [] },
      ],
      [{ question: "Custom", options: opts(2), multi: false }],
    );
    expect(five.asked.map((q) => q.id)).toEqual([
      "songs",
      "includes",
      "ending",
      "practiceStyle",
    ]);
    expect(five.custom).toHaveLength(1);
  });

  it("answers nothing for nothing", () => {
    expect(enforcePickRules(undefined, null)).toEqual({
      asked: [],
      custom: [],
    });
  });
});
