import Achievement from "components/Achievement";
import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

const AchievementsCarousel = ({
  achievements,
}: {
  achievements: AchievementList[];
}) => {
  const [index, setIndex] = useState(0);
  const { t } = useTranslation("leadboard");
  const itemsShow = 4;

  const rightMax = index + itemsShow >= achievements.length;
  const leftMax = index === 0;

  const displayItems = (index: number) => {
    return achievements.slice(index, itemsShow + index);
  };

  const handleNext = () => {
    if (rightMax) {
      return;
    }
    setIndex((prevIndex) => (prevIndex + 1) % achievements.length);
  };

  const handlePrev = () => {
    if (leftMax) {
      return;
    }
    setIndex(
      (prevIndex) => (prevIndex + achievements.length - 1) % achievements.length
    );
  };

  return (
    <div className='col-span-3 hidden h-full w-full flex-col items-center justify-center bg-opacity-80 sm:flex md:col-span-1 md:w-fit md:justify-end'>
      <div className='flex rounded-lg p-2 text-base backdrop-blur-sm xxs:text-2xl lg:text-xl xl:text-2xl'>
        <button onClick={handlePrev}>
          <FaAngleLeft
            className={`${
              leftMax
                ? "cursor-default text-gray-600"
                : "text-gray-300 transition-colors hover:text-white active:click-behavior-second"
            } `}
          />
        </button>

        <div className='flex w-[100px] justify-around font-openSans text-base font-bold xxs:text-lg xs:w-[150px] lg:w-[100px] xl:w-[150px]'>
          {achievements.length === 0
            ? t("empty")
            : displayItems(index).map((achivId) => {
                return <Achievement key={achivId} id={achivId} />;
              })}
        </div>
        <button onClick={handleNext}>
          <FaAngleRight
            className={`${
              rightMax
                ? "cursor-default text-gray-600"
                : "text-gray-300 transition-colors hover:text-white active:click-behavior-second"
            } `}
          />
        </button>
      </div>
      <p className='pb-2 font-openSans text-xs  text-secondText'>
        {t("achievements")} {achievements.length}/{achievementsData.length}
      </p>
    </div>
  );
};

export default AchievementsCarousel;
