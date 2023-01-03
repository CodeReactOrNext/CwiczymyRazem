import { convertMsToHM } from "helpers/timeConverter";
import { StatisticProps } from "layouts/ProfileLayout/components/Statistic";
import ProfileLayout from "layouts/ProfileLayout/ProfileLayout";
import {
  FaCalendarDay,
  FaClock,
  FaDumbbell,
  FaGuitar,
  FaHeart,
  FaMedal,
  FaStar,
  FaStarHalf,
} from "react-icons/fa";
import { achievements as achievementsData } from "data/achievements";
import { StatisticsDataInterface } from "utils/firebase/userStatisticsInitialData";

const ProfileView = () => {
  const userStats: StatisticsDataInterface = {
    time: {
      technique: 0,
      theory: 0,
      hearing: 0,
      creativity: 0,
      longestSession: 0,
    },
    lvl: 1,
    points: 25,
    pointsToNextLvl: 35,
    sessionCount: 0,
    habitsCount: 0,
    dayWithoutBreak: 0,
    maxPoints: 0,
    achievements: ["time_1", "time_2", "time_3"],
    actualDayWithoutBreak: 0,
    lastReportDate: "",
  };
  const userName = "ziemniak";
  const userAvatar = undefined;
  const {
    points,
    sessionCount,
    habitsCount,
    achievements,
    time,
    dayWithoutBreak,
    maxPoints,
  } = userStats!;

  const statistics: StatisticProps[] = [
    {
      Icon: FaClock,
      description: "Łącznie spędziłeś na ćwiczeniach: ",
      value: convertMsToHM(
        time.technique + time.theory + time.creativity + time.hearing
      ),
    },
    {
      Icon: FaGuitar,
      description: "Liczba sesji: ",
      value: sessionCount,
    },
    {
      Icon: FaStar,
      description: "Punktów: ",
      value: points,
    },
    {
      Icon: FaHeart,
      description: "Liczba zdrowych nawyków: ",
      value: habitsCount,
    },
    {
      Icon: FaMedal,
      description: "Odznaki: ",
      value: achievements.length + "/" + achievementsData.length,
    },
    {
      Icon: FaDumbbell,
      description: "Najdłuższa sesja: ",
      value: convertMsToHM(time.longestSession),
    },
    {
      Icon: FaCalendarDay,
      description: "Ilość dni bez przerwy: ",
      value: dayWithoutBreak,
    },
    {
      Icon: FaStarHalf,
      description: "Najwięcej punktów za jeden raport: ",
      value: maxPoints,
    },
  ];

  return (
    <ProfileLayout
      statistics={statistics}
      userStats={userStats}
      userName={userName!}
      userAvatar={userAvatar}
    />
  );
};

export default ProfileView;
