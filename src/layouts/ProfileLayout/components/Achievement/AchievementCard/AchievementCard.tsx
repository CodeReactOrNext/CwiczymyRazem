import { useTranslation } from "react-i18next";
import ToolTip from "components/UI/ToolTip";
import {
  AchievementList,
  achievementsData,
} from "assets/achievements/achievementsData";

const AchievementCard = ({ id }: { id: AchievementList }) => {
  const { t } = useTranslation("achievements");
  const achievementData = achievementsData.find((achiv) => achiv.id === id);
  const { Icon, rarity, description, name } = achievementData!;

  return (
    <div className='group'>
      <ToolTip />
      <div
        className={`
       ${
         rarity === "common"
           ? "border-achievements-common bg-second-200 text-achievements-common"
           : ""
       }
        ${
          rarity === "rare"
            ? "border-achievements-rare bg-achievements-rare text-main-opposed-800"
            : ""
        }
        ${
          rarity === "veryRare"
            ? " border-achievements-veryRare bg-achievements-veryRare text-main-opposed-800"
            : ""
        }
        cursor-help  border-2 border-opacity-20  p-2 shadow-inset-cool  transition-transform radius-default group-hover:scale-[170%]`}>
        <Icon className=' text-lg drop-shadow-md	md:text-3xl' />
      </div>
      <p className='absolute z-40 hidden bg-black bg-opacity-80 p-2 text-lg opacity-0 transition-opacity	radius-default group-hover:block  group-hover:opacity-100'>
        <>
          {t(name) as string}
          <span className='hidden text-sm group-hover:block  '>
            {t(description) as string}
          </span>
        </>
      </p>
    </div>
  );
};

export default AchievementCard;
