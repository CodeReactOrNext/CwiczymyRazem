import ExercisePlanLayout from "layouts/ExercisePlanLayout/ExercisePlanLayout";
import { exerciseInterface } from "../ExercisePlan/ExercisePlan";

interface ExerciseTodoProps {
  exercisesArr: exerciseInterface[];
  backFn: () => void;
}

const ExerciseTodo = ({ backFn, exercisesArr }: ExerciseTodoProps) => {
  return (
    <>
      {exercisesArr.map((item, index) => (
        <ExercisePlanLayout
          key={index}
          index={index}
          title={item.title}
          time={item.time}
          type={item.category}
        />
      ))}

      <div className='m-3  flex flex-row justify-center gap-5 p-3 text-base '>
        <button
          className='rounded-md bg-white p-1 py-2 text-second'
          onClick={backFn}>
          Wróć
        </button>
      </div>
    </>
  );
};

export default ExerciseTodo;
