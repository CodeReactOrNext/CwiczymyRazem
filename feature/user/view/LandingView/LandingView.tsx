import { selectUserData, selectUserName } from "feature/user/store/userSlice";
import { convertMsToHM } from "helpers/timeConverter";
import LandingLayout from "layouts/LandingLayout";
import { LandingNavProps } from "layouts/LandingLayout/components/LandingNav";
import { StatisticProps } from "layouts/LandingLayout/components/Statistic";
import { achievements as achievementsData } from "data/achievements";
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
import { useAppSelector } from "store/hooks";

const LandingView = () => {
  const userStats = useAppSelector(selectUserData);
  const userName = useAppSelector(selectUserName);
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

  const navigation: LandingNavProps = {
    leftSideLinks: [
      {
        name: "Raportuj",
        href: "/report",
      },
      {
        name: "Ćwicz",
        href: "/timer",
      },
    ],
    rightSideLinks: [
      {
        name: "Leadboard",
        href: "/leaderboard",
      },
      {
        name: "FAQ",
        href: "/faq",
      },
    ],
  };
  return (
    <LandingLayout
      statistics={statistics}
      navigation={navigation}
      userStats={userStats!}
      userName={userName!}
    />
  );
};

export default LandingView;
