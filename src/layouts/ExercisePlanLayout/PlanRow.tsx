import { FaClipboardList, FaClock } from "react-icons/fa";
import { convertMsToHM } from "utils/converter";

const PlanRow = ({
  title,
  exerciseNumber,
  onClick,
  sumTime,
}: {
  title: string;
  exerciseNumber: number;
  sumTime: number;
  onClick: () => void;
}) => {
  return (
    <div className='m-2 flex flex-row justify-start gap-4 border-2 border-main-opposed-200/70 bg-main-opposed-600 p-3 font-openSans text-sm radius-default'>
      <p className='w-[50%]'>{title}</p>
      <div className='flex-ro flex w-[50%] justify-around'>
        <p className='flex flex-row items-center gap-1 '>
          <FaClock className='text-tertiary' />
          {convertMsToHM(sumTime)}
        </p>
        <p className='flex flex-row items-center gap-1'>
          <FaClipboardList className='text-tertiary' />
          {exerciseNumber}
        </p>
        <button className='flex flex-row items-center gap-1' onClick={onClick}>
          Wybierz
        </button>
      </div>
    </div>
  );
};

export default PlanRow;
