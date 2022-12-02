import {
  achievementsRarityType,
  achievementsRarity,
} from "constants/achievementsRarity";
import { useTranslation } from "react-i18next";
import { FaMedal, FaMarker } from "react-icons/fa";

export interface AchievementBoxProps extends achievementsRarityType {
  achivment?: string;
}
//Its placeholder. This need to be full dynamic.
export default function AchievementBox({ rarity }: AchievementBoxProps) {
  const { t } = useTranslation("achievements");

  return (
    <div className='relative right-2 mt-4 flex flex-row'>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center bg-main sm:h-10 sm:w-10 `}>
        <FaMedal className='text-mainText' />
      </div>
      <div className='mx-2 self-center '>
        <p className=' text-sm text-mainText'>{t(rarity)}</p>
        <div className='flex w-full max-w-[20rem] flex-row flex-wrap gap-4'>
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
          <FaMarker />
        </div>
      </div>
    </div>
  );
}
