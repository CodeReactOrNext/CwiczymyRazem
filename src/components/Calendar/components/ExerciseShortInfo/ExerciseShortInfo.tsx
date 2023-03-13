import IconBox from "components/IconBox";
import { useTranslation } from "react-i18next";
import { FaClock, FaRegCalendarAlt, FaStar } from "react-icons/fa";
import { ReportListInterface } from "types/api.types";
import { convertMsToHM } from "utils/converter";

const ExerciseShortInfo = ({
  date,
  report,
}: {
  date: Date;
  report: ReportListInterface;
}) => {
  const { t } = useTranslation("common");
  return (
    <div className=' z-40 flex flex-col justify-center'>
      {report.exceriseTitle ? (
        <p className='content-box relative -top-4 m-auto max-w-[280px]  text-center text-sm font-bold'>
          {report.exceriseTitle}
        </p>
      ) : null}

      <div className='flex flex-row justify-around gap-3 '>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaRegCalendarAlt} small />
          <p>{date.toLocaleDateString()}</p>
        </div>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaStar} small />
          <p className='font-bold'>{report.points}</p>
        </div>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaClock} small />
          {convertMsToHM(report.totalTime) + "h"}
        </div>
      </div>

      {report.timeSumary && (
        <div className='p-2'>
          <div className='flex flex-row gap-1'>
            <div className='content-box flex flex-col items-center text-xs'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.techniqueTime) + "h"}
              </p>
              <p>{t("calendar.technique")}</p>
            </div>

            <div className='content-box flex flex-col items-center'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.theoryTime) + "h"}
              </p>
              <p>{t("calendar.theory")}</p>
            </div>

            <div className='content-box flex flex-col items-center'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.hearingTime) + "h"}
              </p>
              <p>{t("calendar.hearing")}</p>
            </div>

            <div className='content-box flex flex-col items-center'>
              <p className='text-sm font-bold'>
                {convertMsToHM(report.timeSumary.creativityTime) + "h"}
              </p>
              <p>{t("calendar.creativity")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseShortInfo;
