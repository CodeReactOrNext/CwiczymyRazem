import { useTranslation } from "react-i18next";

const DaySince = ({ date }: { date: Date }) => {
  const { t } = useTranslation("common");

  const daysSince = (date: Date) => {
    const currentDate = new Date();
    const timeDiff = Math.abs(currentDate.getTime() - date.getTime());
    const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return diffDays;
  };

  const daysSinceNumber = daysSince(date);

  return (
    <p className='font-openSans text-[0.6rem] font-bold  xs:text-[0.65rem] sm:text-xs '>
      {!daysSinceNumber && t("day_since.no_practice")}
      {daysSinceNumber === 1 && t("day_since.pracitce_last_24")}
      {daysSinceNumber > 1 &&
        t("day_since.practice_day", {
          days: daysSinceNumber,
        })}
    </p>
  );
};

export default DaySince;
