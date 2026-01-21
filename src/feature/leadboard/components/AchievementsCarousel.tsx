import AchievementIcon from "feature/achievements/components/AchievementIcon";
import { achievementsData } from "feature/achievements/data/achievementsData";
import type { AchievementList } from "feature/achievements/types";
import React, { useState } from "react";
import { useTranslation } from "hooks/useTranslation";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

export const AchievementsCarousel = ({
  achievements,
}: {
  achievements: AchievementList[];
}) => {
  const [index, setIndex] = useState(0);
  const { t } = useTranslation("leadboard");
  const itemsShow = 4;

  const rightMax = index + itemsShow >= achievements.length;
  const leftMax = index === 0;

  const displayItems = (itemsIndex: number) => {
    return achievements.slice(itemsIndex, itemsShow + itemsIndex);
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
    <div className='flex flex-col items-center justify-center bg-opacity-80 w-fit'>
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
                return <AchievementIcon key={achivId} id={achivId} />;
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
