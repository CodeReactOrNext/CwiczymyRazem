import { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import {
  FaClipboardList,
  FaClock,
  FaRegEdit,
  FaRegTrashAlt,
} from "react-icons/fa";
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
  return (
    <div className='m-2 flex w-full flex-row gap-4 border-2 border-main-opposed-200/70 bg-main-opposed-500 p-3 font-openSans text-sm radius-default hover:bg-main-opposed-300'>
      <p className='w-[50%] cursor-pointer' onClick={showExercise}>
        {exercise.title}
      </p>
      <div className='flex-ro flex w-[50%] justify-around'>
        <p className='flex flex-row items-center gap-1 '>
          <FaClock className='text-tertiary' />
          {convertMsToHM(
            exercise.exercise.reduce(
              (totalTime, currentTime) => totalTime + currentTime.time,
              0
            )
          )}
        </p>
        <p className='flex flex-row items-center gap-1'>
          <FaClipboardList className='text-tertiary' />
          {exercise.exercise.length}
        </p>
        <button onClick={deleteHandler}>
          <FaRegTrashAlt />
        </button>
        <button onClick={editHandler}>
          <FaRegEdit />
        </button>
        <p>{exercise.isPrivate ? "Prywatne" : "Publiczne"}</p>
      </div>
    </div>
  );
};

export default PlanRowEdit;
