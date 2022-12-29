import Achievement from "components/Achievement";
import {
  AchievementList,
  achievements as achievementsData,
} from "data/achievements";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";


const Carousel = ({ achievements }: { achievements: AchievementList[] }) => {
  const [index, setIndex] = useState(0);
  const { t } = useTranslation("leadboard");

  const displayItems = (index: number) => {
    const itemsShow = 4;
    return achievements
      .slice(index)
      .sort((a, b) => +a - +b)
      .concat(achievements.slice(0, index))
      .slice(0, itemsShow);
  };

  const handleNext = () => {
    setIndex((prevIndex) => (prevIndex + 1) % achievements.length);
  };

  const handlePrev = () => {
    setIndex(
      (prevIndex) => (prevIndex + achievements.length - 1) % achievements.length
    );
  };

  return (
    <div className=' col-span-3 flex h-full w-full flex-col items-center justify-center  md:col-span-1  md:w-fit md:justify-end '>
      <div className='flex  text-base xxs:text-2xl lg:text-xl xl:text-2xl '>
        <button onClick={handlePrev}>
          <FaAngleLeft className=' text-main-opposed hover:text-mainText active:click-behavior-second' />
        </button>

        <div className='flex w-[100px] justify-around text-base xxs:text-xl xs:w-[150px] lg:w-[100px] xl:w-[150px] '>
          {achievements.length === 0
            ? "Brak"
            : displayItems(index).map((achivId, index) => {
                return <Achievement key={index} id={achivId} />;
              })}
        </div>
        <button onClick={handleNext}>
          <FaAngleRight className=' text-main-opposed hover:text-mainText active:click-behavior-second' />
        </button>
      </div>
      <p className=' text-tertiary'>
        {t("achievements")} {achievements.length}/{achievementsData.length}
      </p>
    </div>
  );
};

export default Carousel;
