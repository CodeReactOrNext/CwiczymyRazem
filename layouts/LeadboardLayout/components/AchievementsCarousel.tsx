import Achievement from "components/Achievement";
import ToolTip from "components/ToolTip";
import {
  achievementList,
  achievementsData,
} from "assets/achievements/achievementsData";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";

const AchievementsCarousel = ({
  achievements,
}: {
  achievements: achievementList[];
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
    <div className=' col-span-3 flex h-full w-full flex-col items-center justify-center  md:col-span-1  md:w-fit md:justify-end '>
      <div className='flex  text-base xxs:text-2xl lg:text-xl xl:text-2xl '>
        <button onClick={handlePrev}>
          <FaAngleLeft
            className={`${
              leftMax
                ? "cursor-default text-tertiary-50"
                : "text-main-opposed hover:text-mainText active:click-behavior-second"
            } `}
          />
        </button>

        <div className='flex w-[100px] justify-around text-base xxs:text-xl xs:w-[150px] lg:w-[100px] xl:w-[150px] '>
          <ToolTip />
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
                ? "cursor-default text-tertiary-50"
                : "text-main-opposed hover:text-mainText active:click-behavior-second"
            } `}
          />
        </button>
      </div>
      <p className=' text-tertiary'>
        {t("achievements")} {achievements.length}/{achievementsData.length}
      </p>
    </div>
  );
};

export default AchievementsCarousel;
