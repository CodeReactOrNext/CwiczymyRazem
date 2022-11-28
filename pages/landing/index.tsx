import LandingLayout from "layouts/LandingLayout";
import { StatisticProps } from "layouts/LandingLayout/components/Statistic";
import type { NextPage } from "next";
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

const Landing: NextPage = () => {
  const statistics: StatisticProps[] = [
    {
      Icon: FaClock,
      description: "Łącznie spędziłeś na ćwiczeniach:",
      value: "21:32h",
    },
    {
      Icon: FaGuitar,
      description: "Liczba sesji",
      value: "23",
    },
    {
      Icon: FaStar,
      description: "Punktów",
      value: "23",
    },
    {
      Icon: FaHeart,
      description: "Punktów za zdrowe nawyki: ",
      value: "32",
    },
    {
      Icon: FaMedal,
      description: "Odznaki: ",
      value: "32",
    },
    {
      Icon: FaDumbbell,
      description: "Najdłuższa sesja: ",
      value: "4:21h",
    },
    {
      Icon: FaCalendarDay,
      description: "Ilość dni bez przerwy: ",
      value: "4",
    },
    {
      Icon: FaStarHalf,
      description: "Najwięcej punktów za jeden raport: ",
      value: "4",
    },
  ];
  return <LandingLayout statistics={statistics} />;
};

export default Landing;
