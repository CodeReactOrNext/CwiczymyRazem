import { selectUserAuth } from "feature/user/store/userSlice";
import ExercisePlanLayout from "layouts/ExercisePlanLayout/ExercisePlanLayout";
import PlanRow from "layouts/ExercisePlanLayout/PlanRow";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { SkillsType } from "types/skillsTypes";
import { firebaseGetExercisePlan } from "utils/firebase/client/firebase.utils";
import ExerciseTodo from "../ExerciseTodo/ExerciseTodo";

export interface exerciseInterface {
  title: string;
  category: SkillsType;
  time: number;
  done: boolean;
}
export interface exercisePlanInterface {
  id?: string;
  title: string;
  isPrivate: boolean;
  exercise: exerciseInterface[];
}
const ExercisePlan = () => {
  const [exercisePlans, setExercisePlans] = useState<
    null | exercisePlanInterface[]
  >(null);
  const [exercises, setExercises] = useState<null | exerciseInterface[]>(null);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    if (userAuth) {
      firebaseGetExercisePlan(userAuth).then((exercisePlan) => {
        setExercisePlans(exercisePlan);
      });
    }
  }, []);


  return (
    <div className=' m-4 min-w-[730px] '>
      <div className='content-box'>
        <p className='text-center text-lg'>Twoje Ćwiczenia</p>
      </div>
      <div className='max-h-[300px] overflow-x-auto  border-main-opposed-200/70 bg-main-opposed-600/50 radius-default'>
        <div className='flex flex-col p-4'>
          {!exercises &&
            exercisePlans &&
            exercisePlans.map((item, index) => (
              <div
                key={index}
                className='cursor-pointer'
                onClick={() => setExercises(exercisePlans[index].exercise)}>
                <PlanRow
                  title={item.title}
                  exerciseNumber={item.exercise.length}
                  sumTime={item.exercise.reduce(
                    (sumTime, item) => sumTime + item.time,
                    0                 
                  )}
                  onClick={() => setExercises(exercisePlans[index].exercise)}
                />
              </div>
            ))}
          {exercises && (
            <ExerciseTodo
              exercisesArr={exercises}
              backFn={() => setExercises(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExercisePlan;
