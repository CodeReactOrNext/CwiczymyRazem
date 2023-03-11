import IconBox from "components/IconBox";
import { FaClock, FaRegCalendarAlt, FaStar } from "react-icons/fa";
import { convertMsToHM } from "utils/converter/timeConverter";

const ExerciseShortInfo = ({ date }) => {
  return (
    <div className='absolute z-40 flex flex-col justify-center bg-black/50 p-2'>
      {date.report.exceriseTitle ? (
        <p className='content-box relative -top-4 m-auto max-w-[280px]  text-center text-sm font-bold'>
          {date.report.exceriseTitle}
        </p>
      ) : (
        ""
      )}

      <div className='flex flex-row justify-around gap-3 '>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaRegCalendarAlt} small />
          <p>{date.date.toLocaleDateString()}</p>
        </div>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaStar} small />
          <p className='font-bold'>{date.report.points}</p>
        </div>
        <div className='flex flex-row items-center'>
          <IconBox Icon={FaClock} small />
          {convertMsToHM(date.report.totalTime) + "h"}
        </div>
      </div>

      {date.report.timeSumary ? (
        <div className='p-2'>
          <div className='flex flex-row gap-1'>
            <div className='content-box flex flex-col items-center text-xs'>
              <p className='text-sm font-bold'>
                {convertMsToHM(date.report.timeSumary.techniqueTime) + "h"}
              </p>
              <p>Technika</p>
            </div>

            <div className='content-box flex flex-col items-center'>
              <p className='text-sm font-bold'>
                {convertMsToHM(date.report.timeSumary.theoryTime) + "h"}
              </p>
              <p>Teoria</p>
            </div>

            <div className='content-box flex flex-col items-center'>
              <p className='text-sm font-bold'>
                {convertMsToHM(date.report.timeSumary.hearingTime) + "h"}
              </p>
              <p>Słuch</p>
            </div>

            <div className='content-box flex flex-col items-center'>
              <p className='text-sm font-bold'>
                {convertMsToHM(date.report.timeSumary.creativityTime) + "h"}
              </p>
              <p>Kreatywność</p>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default ExerciseShortInfo;
