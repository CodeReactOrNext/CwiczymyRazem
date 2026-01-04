import {
  FaBalanceScale,
  FaBook,
  FaCalendarWeek,
  FaCat,
  FaChartLine,
  FaClock,
  FaDumbbell,
  FaEvernote,
  FaFrog,
  FaGrimace,
  FaGuitar,
  FaHandSparkles,
  FaHatCowboy,
  FaHatWizard,
  FaHeadphones,
  FaHeart,
  FaHiking,
  FaHotjar,
  FaHourglass,
  FaInfinity,
  FaKiwiBird,
  FaMedal,
  FaMicrophoneAlt,
  FaMicroscope,
  FaMouse,
  FaPalette,
  FaRecordVinyl,
  FaRing,
  FaRoute,
  FaShieldAlt,
  FaThumbsUp,
  FaTired,
  FaTrophy,
  FaUserMd,
  FaUserNinja,
  FaWrench,
} from "react-icons/fa";
import { 
  GiCelebrationFire, 
  GiMisdirection, 
  GiMoebiusTriangle, 
  GiMuscularTorso, 
  GiNotebook, 
  GiPush, 
  GiSwordman, 
  GiSwordsPower, 
  GiWeight, 
  GiWeightLiftingUp,
  GiHeartBattery,
  GiExtraTime,
  GiRollingBomb,
  GiRearAura,
  GiCard2Hearts,
  GiCard3Diamonds,
  GiCard4Diamonds,
  GiCard5Diamonds,
  GiCard6Diamonds,
  GiCardAceDiamonds,
  GiCardKingDiamonds,
  GiCardJackDiamonds,
  GiMultipleTargets
} from "react-icons/gi";
import type { IconType } from "react-icons/lib";
import { hoursToMilliseconds, minutesToMilliseconds } from "date-fns";
import { TbGuitarPick } from "react-icons/tb";
import { inputTimeConverter } from "utils/converter";
import type { AchievementCheck, AchievementContext, AchievementList, AchievementsDataInterface } from "../types";
import { AchievementRequirement } from "feature/achievements/utils/AchievementRequirement";

const achivFactor = (
  id: AchievementList,
  Icon: IconType,
  rarity: "common" | "rare" | "veryRare" | "epic",
  check: AchievementCheck
): AchievementsDataInterface => ({
  id,
  Icon,
  rarity,
  name: `${id}.title` as any,
  description: `${id}.description` as any,
  check,
});

export const achievementsData: AchievementsDataInterface[] = [
  achivFactor("time_1", FaThumbsUp, "common", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(10))),
  achivFactor("points_1", FaCat, "common", AchievementRequirement.statThreshold("points", 100)),
  achivFactor("day_1", FaChartLine, "common", AchievementRequirement.statThreshold("dayWithoutBreak", 1)),
  achivFactor("day_2", FaCalendarWeek, "common", AchievementRequirement.statThreshold("dayWithoutBreak", 7)),
  achivFactor("health_habits", FaHeart, "common", (ctx) => ctx.reportData.bonusPoints.habitsCount === 5),
  achivFactor("book", FaBook, "common", AchievementRequirement.statTimeThreshold("theory", hoursToMilliseconds(10))),
  achivFactor("ring", FaRing, "common", (ctx) => {
    const { time } = ctx.statistics;
    return time.creativity > hoursToMilliseconds(5) && time.technique > hoursToMilliseconds(5) && time.theory > hoursToMilliseconds(5) && time.hearing > hoursToMilliseconds(5);
  }),
  achivFactor("headphones", FaHeadphones, "common", AchievementRequirement.statTimeThreshold("hearing", hoursToMilliseconds(10))),
  achivFactor("session_1", FaMouse, "common", AchievementRequirement.statThreshold("sessionCount", 10)),
  achivFactor("ninja", FaUserNinja, "common", AchievementRequirement.statTimeThreshold("technique", hoursToMilliseconds(10))),
  achivFactor("artist", FaPalette, "common", AchievementRequirement.statTimeThreshold("creativity", hoursToMilliseconds(10))),
  achivFactor("balance", FaBalanceScale, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return techniqueTime >= hoursToMilliseconds(1) && theoryTime >= hoursToMilliseconds(1) && hearingTime >= hoursToMilliseconds(1) && creativityTime >= hoursToMilliseconds(1);
  }),
  achivFactor("doctor", FaUserMd, "rare", AchievementRequirement.statThreshold("habitsCount", 100)),
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
  achivFactor("yolo", FaGrimace, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    const totalTime = techniqueTime + theoryTime + hearingTime + creativityTime;
    return totalTime >= hoursToMilliseconds(3) && ctx.inputData.habbits.length === 0;
  }),
  achivFactor("path", FaRoute, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return techniqueTime > minutesToMilliseconds(30) && theoryTime > minutesToMilliseconds(30) && hearingTime > minutesToMilliseconds(30) && creativityTime > minutesToMilliseconds(30) && ctx.inputData.habbits.includes("exercise_plan");
  }),
  achivFactor("diamond", FaGuitar, "rare", (ctx) => ctx.statistics.maxPoints >= 100),
  achivFactor("time_2", FaClock, "rare", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(30))),
  achivFactor("session_2", FaHiking, "rare", AchievementRequirement.statThreshold("sessionCount", 100)),
  achivFactor("points_2", FaKiwiBird, "rare", AchievementRequirement.statThreshold("points", 1000)),
  achivFactor("tired", FaTired, "rare", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return (techniqueTime + theoryTime + hearingTime + creativityTime) >= hoursToMilliseconds(5);
  }),
  achivFactor("time_3", FaHourglass, "veryRare", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(100))),
  achivFactor("fire", FaHotjar, "veryRare", (ctx) => ctx.reportData.totalPoints >= 60),
  achivFactor("points_3", FaFrog, "veryRare", AchievementRequirement.statThreshold("points", 10000)),
  achivFactor("scientist", FaMicroscope, "veryRare", AchievementRequirement.statTimeThreshold("theory", hoursToMilliseconds(100))),
  achivFactor("bigear", FaEvernote, "veryRare", AchievementRequirement.statTimeThreshold("hearing", hoursToMilliseconds(100))),
  achivFactor("wizard", FaHatWizard, "veryRare", AchievementRequirement.statTimeThreshold("technique", hoursToMilliseconds(100))),
  achivFactor("medal", FaMedal, "veryRare", (ctx) => ctx.statistics.maxPoints >= 200),
  achivFactor("day_3", FaInfinity, "veryRare", AchievementRequirement.statThreshold("dayWithoutBreak", 30)),
  achivFactor("session_3", FaHatCowboy, "veryRare", AchievementRequirement.statThreshold("sessionCount", 1000)),
  achivFactor("dumbbel", FaDumbbell, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 5 && ctx.inputData.countBackDays !== undefined),
  achivFactor("vip", FaWrench, "veryRare", () => false),
  achivFactor("short", FaShieldAlt, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 10 && ctx.reportData.totalPoints <= 15),
  achivFactor("event", FaTrophy, "veryRare", () => false),
  achivFactor("lvl100", TbGuitarPick, "epic", AchievementRequirement.statThreshold("lvl", 100)),
  achivFactor("fireSession", GiCelebrationFire, "epic", (ctx) => {
    const { techniqueTime, theoryTime, hearingTime, creativityTime } = inputTimeConverter(ctx.inputData);
    return (techniqueTime + theoryTime + hearingTime + creativityTime) >= hoursToMilliseconds(10);
  }),
  achivFactor("batteryHearth", GiHeartBattery, "epic", AchievementRequirement.statThreshold("habitsCount", 2000)),
  achivFactor("100days", GiExtraTime, "epic", AchievementRequirement.totalTimeThreshold(hoursToMilliseconds(24 * 100))),
  achivFactor("bomb", GiRollingBomb, "veryRare", (ctx) => ctx.statistics.actualDayWithoutBreak >= 2 && ctx.inputData.countBackDays !== undefined),
  achivFactor("wannaLearn1", GiSwordman, "common", AchievementRequirement.songCount("wantToLearn", 1)),
  achivFactor("wannaLearn2", GiSwordsPower, "common", AchievementRequirement.songCount("wantToLearn", 3)),
  achivFactor("wannaLearn3", GiNotebook, "common", AchievementRequirement.songCount("wantToLearn", 5)),
  achivFactor("wannaLearn10", GiMisdirection, "rare", AchievementRequirement.songCount("wantToLearn", 10)),
  achivFactor("wannaLearn30", GiMoebiusTriangle, "veryRare", AchievementRequirement.songCount("wantToLearn", 30)),
  achivFactor("learning1", GiWeight, "common", AchievementRequirement.songCount("learning", 1)),
  achivFactor("learning3", GiWeightLiftingUp, "common", AchievementRequirement.songCount("learning", 3)),
  achivFactor("learning5", GiPush, "common", AchievementRequirement.songCount("learning", 5)),
  achivFactor("learning10", GiMuscularTorso, "rare", AchievementRequirement.songCount("learning", 10)),
  achivFactor("learning20", GiMultipleTargets, "veryRare", AchievementRequirement.songCount("learning", 20)),
  achivFactor("learning30", GiRearAura, "epic", AchievementRequirement.songCount("learning", 30)),
  achivFactor("learned1", GiCard2Hearts, "common", AchievementRequirement.songCount("learned", 1)),
  achivFactor("learned3", GiCard3Diamonds, "common", AchievementRequirement.songCount("learned", 3)),
  achivFactor("learned5", GiCard4Diamonds, "common", AchievementRequirement.songCount("learned", 5)),
  achivFactor("learned10", GiCard5Diamonds, "rare", AchievementRequirement.songCount("learned", 10)),
  achivFactor("learned20", GiCard6Diamonds, "veryRare", AchievementRequirement.songCount("learned", 20)),
  achivFactor("learned30", GiCardJackDiamonds, "veryRare", AchievementRequirement.songCount("learned", 30)),
  achivFactor("learned50", GiCardKingDiamonds, "epic", AchievementRequirement.songCount("learned", 50)),
  achivFactor("learned100", GiCardAceDiamonds, "epic", AchievementRequirement.songCount("learned", 100)),
];
