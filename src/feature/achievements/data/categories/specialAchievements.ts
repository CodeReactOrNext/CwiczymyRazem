import {
  FaBalanceScale,
  FaHeart,
  FaRing,
  FaUserMd,
  FaHandSparkles,
  FaGrimace,
  FaTired,
  FaHotjar,
  FaMedal,
  FaDumbbell,
  FaWrench,
  FaShieldAlt,
  FaTrophy,
} from "react-icons/fa";
import { GiHeartBattery, GiRollingBomb } from "react-icons/gi";
import { hoursToMilliseconds } from "date-fns";
import { inputTimeConverter } from "utils/converter";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";
import { AchievementList } from "../../types";
import { achivFactor } from "../achievementsData.utils";

export const specialAchievements = [
  achivFactor("health_habits", FaHeart, "common", (ctx) => ctx.reportData.bonusPoints.habitsCount === 5),
  achivFactor("ring", FaRing, "common", (ctx) => {
    const { time } = ctx.statistics;
    return time.creativity > hoursToMilliseconds(5) && time.technique > hoursToMilliseconds(5) && time.theory > hoursToMilliseconds(5) && time.hearing > hoursToMilliseconds(5);
  }),
  achivFactor("balance", FaBalanceScale, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return techniqueTime >= hoursToMilliseconds(1) && theoryTime >= hoursToMilliseconds(1) && hearingTime >= hoursToMilliseconds(1) && creativityTime >= hoursToMilliseconds(1);
  }),
  achivFactor("doctor", FaUserMd, "rare", AchievementRequirement.statThreshold("habitsCount", 100), AchievementRequirement.getProgressFor.statThreshold("habitsCount", 100, "habits")),
  achivFactor("yolo", FaGrimace, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
    return totalTime >= hoursToMilliseconds(3) && ctx.inputData.habbits.length === 0;
  }),
  achivFactor("tired", FaTired, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return (techniqueTime + theoryTime + hearingTime + creativityTime) >= hoursToMilliseconds(5);
  }),
  achivFactor("fire", FaHotjar, "veryRare", (ctx) => ctx.reportData.totalPoints >= 60),
  achivFactor("medal", FaMedal, "veryRare", AchievementRequirement.achievementCount(20), AchievementRequirement.getProgressFor.achievementCount(20)),
  achivFactor("dumbbel", FaDumbbell, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 5 && ctx.inputData.countBackDays !== undefined),
  achivFactor("vip", FaWrench, "veryRare", () => false),
  achivFactor("short", FaShieldAlt, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 10 && ctx.reportData.totalPoints <= 15),
  achivFactor("event", FaTrophy, "veryRare", () => false),
  achivFactor("batteryHearth", GiHeartBattery, "epic", AchievementRequirement.statThreshold("habitsCount", 2000), AchievementRequirement.getProgressFor.statThreshold("habitsCount", 2000, "habits")),
  achivFactor("bomb", GiRollingBomb, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 2 && ctx.inputData.countBackDays !== undefined),
];
