import type { AchievementList } from "feature/achievements/achievementsData";
import Achievement from "feature/achievements/components/Achievement";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { MdUpgrade } from "react-icons/md";
import { convertMsToHM } from "utils/converter";

import type { BonusPointsInterface } from "../../RatingPopUpLayout";

interface BonusPointsItemProps {
  bonusPoints: BonusPointsInterface;
  actualDayWithoutBreak: number;
  achievements: AchievementList[];
  isGetNewLevel: boolean;
}

const BonusPointsItem = ({
  bonusPoints,
  actualDayWithoutBreak,
  achievements,
  isGetNewLevel,
}: BonusPointsItemProps) => {
  const { t } = useTranslation(["common", "report"]);
  const { timePoints, additionalPoints, habitsCount, time, multiplier } =
    bonusPoints;

  const getMulitplierString = (multiplier: number) =>
    "1" + "." + multiplier.toString().split("").pop();

  return (
    <ul className='relative mb-12 w-full border  border-second-400/60 bg-second-500 px-8 py-8 font-openSans text-sm radius-default xs:text-base'>
      <li>
        <motion.ul
          initial={{ x: "-120%", opacity: "0%" }}
          animate={{ x: 0, opacity: "100%" }}
          transition={{ delay: 2 }}>
          {isGetNewLevel && (
            <li className='mb-5 flex items-center text-white'>
              <MdUpgrade className='text-4xl' />
              <p className='text-2xl'>{t("report:rating_popup.new_level")}</p>
            </li>
          )}
        </motion.ul>
      </li>

      <motion.li
        initial={{ x: "-120%", opacity: "0%" }}
        animate={{ x: 0, opacity: "100%" }}
        transition={{ delay: 1, duration: 0.3 }}
        className='mb-3 flex items-center gap-3'>
        <p className='font-sans text-4xl text-main-300'>
          x{getMulitplierString(multiplier)}
        </p>
        <p>{t("report:rating_popup.regularity")}</p>
      </motion.li>
      <motion.li
        initial={{ x: "-120%", opacity: "0%" }}
        animate={{ x: 0, opacity: "100%" }}
        transition={{ delay: 1.3, duration: 0.3 }}
        className='mb-3 flex items-center gap-3'>
        <p className='font-sans text-4xl  text-main-300'>+{timePoints}</p>
        <p>{t("report:rating_popup.time")}</p>
      </motion.li>
      {additionalPoints ? (
        <li className='mb-3'>
          <p>
            {" "}
            <span className=' font-sans text-4xl  text-main-300'>
              +{additionalPoints}
            </span>{" "}
            {t("report:rating_popup.habits")}
          </p>
        </li>
      ) : (
        ""
      )}

      {achievements.length > 0 && (
        <li className=' mb-3 flex items-center '>
          <p>{t("report:rating_popup.new_achievements")}</p>
          <div className='flex gap-3 p-2'>
            {achievements.map((id) => (
              <Achievement key={id} id={id} />
            ))}
          </div>
        </li>
      )}

      <p className='text-secondText'>
        {actualDayWithoutBreak} {t("report:rating_popup.streak")}
      </p>
      <p className='text-secondText'>
        {t("report:rating_popup.habitsWithCount", { count: habitsCount })}
      </p>
      <p className='text-secondText'>
        {t("report:rating_popup.time_amount")} {convertMsToHM(time)}
      </p>
    </ul>
  );
};

export default BonusPointsItem;
