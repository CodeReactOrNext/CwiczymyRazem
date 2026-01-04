import {
  FaMicrophoneAlt,
  FaRecordVinyl,
  FaHandSparkles,
  FaRoute,
} from "react-icons/fa";
import { hoursToMilliseconds } from "date-fns";
import { inputTimeConverter } from "utils/converter";
import { AchievementList } from "../../types";
import { achivFactor } from "../achievementsData.utils";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";

export const habitAchievements = [
  achivFactor("record" as AchievementList, FaMicrophoneAlt, "rare", (ctx) => {
    const { techniqueTime } = inputTimeConverter(ctx.inputData);
    return ctx.inputData.habbits.includes("recording") && ctx.inputData.habbits.includes("metronome") && techniqueTime >= hoursToMilliseconds(3);
  }, AchievementRequirement.getProgressFor.statTimeThreshold("technique", hoursToMilliseconds(3))),
  achivFactor("vinyl" as AchievementList, FaRecordVinyl, "rare", (ctx) => {
    const { creativityTime } = inputTimeConverter(ctx.inputData);
    return ctx.inputData.habbits.includes("recording") && creativityTime >= hoursToMilliseconds(3);
  }, AchievementRequirement.getProgressFor.statTimeThreshold("creativity", hoursToMilliseconds(3))),
  achivFactor("rightway" as AchievementList, FaHandSparkles, "rare", (ctx) => {
    const { techniqueTime } = inputTimeConverter(ctx.inputData);
    return ctx.inputData.habbits.includes("warmup") && techniqueTime >= hoursToMilliseconds(3);
  }, AchievementRequirement.getProgressFor.statTimeThreshold("technique", hoursToMilliseconds(3))),
  achivFactor("path" as AchievementList, FaRoute, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return techniqueTime > hoursToMilliseconds(0.5) && theoryTime > hoursToMilliseconds(0.5) && hearingTime > hoursToMilliseconds(0.5) && creativityTime > hoursToMilliseconds(0.5) && ctx.inputData.habbits.includes("exercise_plan");
  }, AchievementRequirement.getProgressFor.totalTimeThreshold(hoursToMilliseconds(2))), // Approximation: 0.5 * 4 = 2h total
];
