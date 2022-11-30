import { useTranslation } from "react-i18next";

interface Props {
  exerciseData: {
    multiplier?: number;
    additionalPoints?: number;
    streak?: number;
    habitsCount?: number;
    time?: string;
  };
}

export default function BonusPointsItem({
  exerciseData: { multiplier, additionalPoints, streak, habitsCount, time },
}: Props) {
  const { t } = useTranslation(["common", "report"]);
  return (
    <li className='flex items-center gap-3 md:first:-translate-x-[5%] md:last:translate-x-[5%]'>
      {multiplier && (
        <p className='text-2xl text-main-500 sm:text-4xl'>x{multiplier}</p>
      )}
      {additionalPoints && (
        <p className='text-2xl text-main-500 sm:text-4xl'>
          +{additionalPoints}
        </p>
      )}
      {streak && (
        <>
          <p className='xs:text-xl md:text-2xl'>
            {t("report:rating_popup.regularity")}
          </p>
          <p className='text-base md:text-lg'>
            {streak} {t("report:rating_popup.streak")}
          </p>
        </>
      )}
      {habitsCount && (
        <>
          <p className='xs:text-xl md:text-2xl'>
            {t("report:rating_popup.habits")}
          </p>
          <p className='text-base md:text-lg'>
            {t("report:rating_popup.habitsWithCount", { count: habitsCount })}
          </p>
        </>
      )}
      {time && (
        <>
          <p className='xs:text-xl md:text-2xl'>
            {t("report:rating_popup.time")}
          </p>
          <p className='text-base md:text-lg'>
            {t("report:rating_popup.time_amount")} {time}
          </p>
        </>
      )}
    </li>
  );
}
