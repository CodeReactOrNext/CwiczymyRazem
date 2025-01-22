import { Button } from "assets/components/ui/button";
import ExercisePlanLayout from "layouts/ExercisePlanLayout/ExercisePlanLayout";
import { IoIosReturnLeft } from "react-icons/io";

import type { exerciseInterface } from "../ExercisePlan/ExercisePlan";

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
        <Button variant='outline' onClick={backFn}>
          <IoIosReturnLeft />
          Wróć
        </Button>
      </div>
    </>
  );
};

export default ExerciseTodo;
