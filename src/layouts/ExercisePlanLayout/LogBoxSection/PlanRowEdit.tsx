import CreativityIcon from "components/Icon/CreativityIcon";
import HearingIcon from "components/Icon/HearingIcon";
import TechniqueIcon from "components/Icon/TechniqueIcon";
import TheoryIcon from "components/Icon/TheoryIcon";
import IconBox from "components/IconBox";
import { Divider } from "components/UI";
import ButtonIcon from "components/UI/ButtonIcon";
import { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import {
  FaClipboardList,
  FaClock,
  FaRegEdit,
  FaRegTrashAlt,
} from "react-icons/fa";
import { FaListUl } from "react-icons/fa";
import { convertMsToHM } from "utils/converter";

const PlanRowEdit = ({
  exercise,
  deleteHandler,
  editHandler,
  showExercise,
}: {
  exercise: exercisePlanInterface;
  showExercise: () => void;
  editHandler: () => void;
  deleteHandler: () => void;
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
      <div className='mb-2 flex gap-4'>
        {isTechnicPresent && <TechniqueIcon className='text-secondText' />}
        {isHearingPresent && <HearingIcon className='text-secondText' />}
        {isTheoryPresent && <TheoryIcon className='text-secondText' />}
        {isCreativityPresent && <CreativityIcon className='text-secondText' />}
      </div>
      <p className='text-lg font-semibold' onClick={showExercise}>
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
          <ButtonIcon Icon={FaRegTrashAlt} onClick={deleteHandler} />
          <ButtonIcon Icon={FaListUl} onClick={showExercise} />
          <ButtonIcon Icon={FaRegEdit} onClick={editHandler} />
        </div>
      </div>
    </div>
  );
};

export default PlanRowEdit;
