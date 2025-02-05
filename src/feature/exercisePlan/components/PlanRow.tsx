import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import IconBox from "components/IconBox";
import { Divider } from "components/UI";
import type { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import { FaClipboardList, FaClock } from "react-icons/fa";
import { convertMsToHM } from "utils/converter";

const PlanRow = ({
  exercise,
  onClick,
}: {
  exercise: exercisePlanInterface;
  onClick: () => void;
}) => {
  const isTechnicPresent = exercise.exercise.some(
    (exercise) => exercise.category === "technique"
  );

  const isHearingPresent = exercise.exercise.some(
    (exercise) => exercise.category === "hearing"
  );

  const isCreativityPresent = exercise.exercise.some(
    (exercise) => exercise.category === "creativity"
  );

  const isTheoryPresent = exercise.exercise.some(
    (exercise) => exercise.category === "theory"
  );

  return (
    <div className='m-2  w-full gap-4 border border-second-400/60 bg-main-opposed-bg p-4 font-openSans text-sm radius-default hover:bg-main-opposed-800'>
      <div className='mb-2 flex w-fit gap-4 rounded-md bg-second-400 p-2'>
        {isTechnicPresent && <TechniqueIcon className='text-secondText' />}
        {isHearingPresent && <HearingIcon className='text-secondText' />}
        {isTheoryPresent && <TheoryIcon className='text-secondText' />}
        {isCreativityPresent && <CreativityIcon className='text-secondText' />}
      </div>
      <p className='text-lg font-semibold' onClick={onClick}>
        {exercise.title}
      </p>

      <Divider />
      <div className='mt-4 flex w-full flex-wrap items-center justify-between gap-6'>
        <div className='mt-4 flex flex-wrap items-center  gap-6'>
          <p className='flex flex-row  items-center gap-1 '>
            <IconBox Icon={FaClock} small />
            <span className='text-secondText'>Czas: </span>
            {convertMsToHM(
              exercise.exercise.reduce(
                (totalTime, currentTime) => totalTime + currentTime.time,
                0
              )
            )}
          </p>

          <p className='flex flex-row items-center gap-1'>
            <IconBox Icon={FaClipboardList} small />
            <span className='text-secondText'>Ilosc cwizen:</span>
            {exercise.exercise.length}
          </p>
          <p className='text-secondText'>
            {exercise.isPrivate ? "Prywatne" : "Publiczne"}
          </p>
        </div>

        <div className='flex h-full  items-center gap-4'>
          <button
            className='flex flex-row items-center gap-1'
            onClick={onClick}>
            Wybierz
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanRow;
