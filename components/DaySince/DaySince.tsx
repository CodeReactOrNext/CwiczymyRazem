import { useTranslation } from "react-i18next";

const DaySince = ({ date }: { date: Date }) => {
  const { t } = useTranslation("common");
  function daysSince(date: Date) {
    var currentDate = new Date();
    var timeDiff = Math.abs(currentDate.getTime() - date.getTime());
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return diffDays;
  }
  const daysSinceNumber = daysSince(date);
  return (
    <p className='text-sm text-mainText opacity-75'>
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
