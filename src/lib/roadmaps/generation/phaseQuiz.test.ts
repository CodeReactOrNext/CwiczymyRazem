import { describe, expect, it } from "vitest";

import { normaliseQuizQuestions } from "./phaseQuiz";

const good = (prompt: string, answerIndex = 1) => ({
  prompt,
  options: ["A", "B", "C", "D"],
  answerIndex,
  explanation: "Because.",
});

describe("normaliseQuizQuestions", () => {
  it("keeps well-formed questions and gives them stable ids", () => {
    const questions = normaliseQuizQuestions(
      [good("One?"), good("Two?", 3)],
      "phase-1",
    );
    expect(questions.map((q) => q.id)).toEqual(["phase-1-q1", "phase-1-q2"]);
    expect(questions[1].answerIndex).toBe(3);
  });

  it("drops a question with the wrong number of options", () => {
    const questions = normaliseQuizQuestions(
      [{ ...good("One?"), options: ["A", "B", "C"] }, good("Two?")],
      "p",
    );
    expect(questions.map((q) => q.prompt)).toEqual(["Two?"]);
  });

  it("drops a question whose answer index points outside its options", () => {
    expect(normaliseQuizQuestions([good("One?", 4)], "p")).toEqual([]);
    expect(normaliseQuizQuestions([good("One?", -1)], "p")).toEqual([]);
  });

  it("drops duplicate options and duplicate prompts", () => {
    const questions = normaliseQuizQuestions(
      [
        { ...good("One?"), options: ["A", "a", "C", "D"] },
        good("Two?"),
        good("two?"),
      ],
      "p",
    );
    expect(questions.map((q) => q.prompt)).toEqual(["Two?"]);
  });

  it("trims whitespace off everything it keeps", () => {
    const [question] = normaliseQuizQuestions(
      [
        {
          prompt: "  One?  ",
          options: [" A", "B ", " C ", "D"],
          answerIndex: 0,
          explanation: " Because. ",
        },
      ],
      "p",
    );
    expect(question.prompt).toBe("One?");
    expect(question.options).toEqual(["A", "B", "C", "D"]);
    expect(question.explanation).toBe("Because.");
  });

  it("is empty for nothing", () => {
    expect(normaliseQuizQuestions(undefined, "p")).toEqual([]);
  });
});
