import {
  FOUR_DAY_MULTIPLER,
  HABBITS_POINTS_VALUE,
  TIME_POINTS_VALUE,
} from "constants/ratingValue";
import {
  HabbitsType,
  ReportFormikInterface,
} from "feature/user/view/ReportView/ReportView.types";
import { expect, describe, it } from "vitest";
import { makeRatingData } from "../makeRatingData";

describe("makeRatingData", () => {
  const emptyInputData: ReportFormikInterface = {
    techniqueHours: "0",
    techniqueMinutes: " 0",
    theoryHours: "0",
    theoryMinutes: "0",
    hearingHours: "0",
    hearingMinutes: "0",
    creativityHours: "0",
    creativityMinutes: "0",
    countBackDays: 0,
    reportTitle: "0",
    habbits: [],
  };

  it("return 'zeros' in object if you send 'nothing'(not added time, habbits, etc.)", () => {
    const totalTime = 0;
    const actualDayWithoutBreak = 0;

    const ratingData = makeRatingData(
      emptyInputData,
      totalTime,
      actualDayWithoutBreak
    );
    const expectedRaintingData = {
      totalPoints: 0,
      reportDate: new Date(),
      bonusPoints: {
        streak: 0,
        multiplier: 0,
        habitsCount: 0,
        additionalPoints: 0,
        time: 0,
        timePoints: 0,
      },
    };
    expect(ratingData).toEqual(expectedRaintingData);
  });

  it("calculate timePoints correctly", () => {
    const totalTime = 18000000;
    const actualDayWithoutBreak = 0;
    const ratingData = makeRatingData(
      emptyInputData,
      totalTime,
      actualDayWithoutBreak
    );

    const expectedRaintingData = {
      totalPoints: Math.floor(totalTime * TIME_POINTS_VALUE),
      reportDate: new Date(),
      bonusPoints: {
        streak: 0,
        multiplier: 0,
        habitsCount: 0,
        additionalPoints: 0,
        time: 18000000,
        timePoints: Math.floor(totalTime * TIME_POINTS_VALUE),
      },
    };
    expect(ratingData).toEqual(expectedRaintingData);
  });

  it("calculate healthHabbits correctly", () => {
    const totalTime = 0;
    const actualDayWithoutBreak = 0;
    const habbits: HabbitsType[] = ["exercise_plan", "metronome"];
    const habbitsCount = habbits.length;
    const inputData: ReportFormikInterface = {
      ...emptyInputData,
      habbits: habbits,
    };

    const ratingData = makeRatingData(
      inputData,
      totalTime,
      actualDayWithoutBreak
    );

    const expectedRaintingData = {
      totalPoints: Math.floor(habbitsCount * HABBITS_POINTS_VALUE),
      reportDate: new Date(),
      bonusPoints: {
        streak: 0,
        multiplier: 0,
        habitsCount: habbitsCount,
        additionalPoints: 6,
        time: 0,
        timePoints: 0,
      },
    };
    expect(ratingData).toEqual(expectedRaintingData);
  });

  it("calculate multiplier correctly", () => {
    const totalTime = 20000000;
    const actualDayWithoutBreak = 4;
    const timePoints = Math.floor(totalTime * TIME_POINTS_VALUE);

    const ratingData = makeRatingData(
      emptyInputData,
      totalTime,
      actualDayWithoutBreak
    );

    const expectedRaintingData = {
      totalPoints: timePoints + Math.floor(timePoints * FOUR_DAY_MULTIPLER),
      reportDate: new Date(),
      bonusPoints: {
        streak: 4,
        multiplier: FOUR_DAY_MULTIPLER,
        habitsCount: 0,
        additionalPoints: 0,
        time: 20000000,
        timePoints: timePoints,
      },
    };
    expect(ratingData).toEqual(expectedRaintingData);
  });
});
