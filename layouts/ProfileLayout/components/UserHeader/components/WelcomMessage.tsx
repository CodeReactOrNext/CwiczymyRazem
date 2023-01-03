import { useTranslation } from "react-i18next";

interface WelocmeMessageProps {
  userName: string;
  place: number;
  points: number;
}
export const WelcomeMessage = ({
  userName,
  place,
  points,
}: WelocmeMessageProps) => {
  const { t } = useTranslation("landing");
  return (
    <div className='text:xs xxs:text-base sm:text-2xl md:text-base lg:text-xl xl:text-2xl'>
      <p className=' xs:text-lg md:text-xl lg:text-2xl xl:text-3xl  '>
        {t("hey")} <span className='text-mainText'>{userName}!</span>
      </p>
      <p>
        {t("ranking_place")} <span className='text-mainText'>{place}</span>
      </p>
      <p>
        {t("earned_points")} <span className='text-mainText'>{points}</span>
      </p>
    </div>
  );
};
