import { hoursToMilliseconds } from "date-fns";
import {
  FaHandSparkles,
  FaMicrophoneAlt,
  FaRecordVinyl,
  FaRoute,
} from "react-icons/fa";
import { inputTimeConverter } from "utils/converter";

import { achivFactor } from "../achievementsData.utils";

export const habitAchievements = [
  achivFactor("record", FaMicrophoneAlt, "rare", (ctx) => {
    const { techniqueTime } = inputTimeConverter(ctx.inputData);
    return ctx.inputData.habbits.includes("recording") && ctx.inputData.habbits.includes("metronome") && techniqueTime >= hoursToMilliseconds(3);
  }),
  achivFactor("vinyl", FaRecordVinyl, "rare", (ctx) => {
    const { creativityTime } = inputTimeConverter(ctx.inputData);
    return ctx.inputData.habbits.includes("recording") && creativityTime >= hoursToMilliseconds(3);
  }),
  achivFactor("rightway", FaHandSparkles, "rare", (ctx) => {
    const { techniqueTime } = inputTimeConverter(ctx.inputData);
    return ctx.inputData.habbits.includes("warmup") && techniqueTime >= hoursToMilliseconds(3);
  }),
  achivFactor("path", FaRoute, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return techniqueTime > hoursToMilliseconds(0.5) && theoryTime > hoursToMilliseconds(0.5) && hearingTime > hoursToMilliseconds(0.5) && creativityTime > hoursToMilliseconds(0.5) && ctx.inputData.habbits.includes("exercise_plan");
  }),
];
