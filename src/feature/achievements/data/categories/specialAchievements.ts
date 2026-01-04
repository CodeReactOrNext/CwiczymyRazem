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
  achivFactor("health_habits" as AchievementList, FaHeart, "common", (ctx) => ctx.reportData.bonusPoints.habitsCount === 5),
  achivFactor("ring" as AchievementList, FaRing, "common", (ctx) => {
    const { time } = ctx.statistics;
    return time.creativity > hoursToMilliseconds(5) && time.technique > hoursToMilliseconds(5) && time.theory > hoursToMilliseconds(5) && time.hearing > hoursToMilliseconds(5);
  }),
  achivFactor("balance" as AchievementList, FaBalanceScale, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return techniqueTime >= hoursToMilliseconds(1) && theoryTime >= hoursToMilliseconds(1) && hearingTime >= hoursToMilliseconds(1) && creativityTime >= hoursToMilliseconds(1);
  }),
  achivFactor("doctor" as AchievementList, FaUserMd, "rare", AchievementRequirement.statThreshold("habitsCount", 100), AchievementRequirement.getProgressFor.statThreshold("habitsCount", 100, "habits")),
  achivFactor("yolo" as AchievementList, FaGrimace, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
    return totalTime >= hoursToMilliseconds(3) && ctx.inputData.habbits.length === 0;
  }),
  achivFactor("tired" as AchievementList, FaTired, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return (techniqueTime + theoryTime + hearingTime + creativityTime) >= hoursToMilliseconds(5);
  }),
  achivFactor("fire" as AchievementList, FaHotjar, "veryRare", (ctx) => ctx.reportData.totalPoints >= 60),
  achivFactor("medal" as AchievementList, FaMedal, "veryRare", AchievementRequirement.achievementCount(20), AchievementRequirement.getProgressFor.achievementCount(20)),
  achivFactor("dumbbel" as AchievementList, FaDumbbell, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 5 && ctx.inputData.countBackDays !== undefined),
  achivFactor("vip" as AchievementList, FaWrench, "veryRare", () => false),
  achivFactor("short" as AchievementList, FaShieldAlt, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 10 && ctx.reportData.totalPoints <= 15),
  achivFactor("event" as AchievementList, FaTrophy, "veryRare", () => false),
  achivFactor("batteryHearth" as AchievementList, GiHeartBattery, "epic", AchievementRequirement.statThreshold("habitsCount", 2000), AchievementRequirement.getProgressFor.statThreshold("habitsCount", 2000, "habits")),
  achivFactor("bomb" as AchievementList, GiRollingBomb, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 2 && ctx.inputData.countBackDays !== undefined),
];
