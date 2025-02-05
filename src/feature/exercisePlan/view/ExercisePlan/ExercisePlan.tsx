import PlanRow from "feature/exercisePlan/components/PlanRow";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import type { SkillsType } from "types/skillsTypes";
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
  const [isLoading, setIsLoading] = useState(true);
  const userAuth = useAppSelector(selectUserAuth);

  useEffect(() => {
    const fetchExercisePlans = async () => {
      if (userAuth) {
        try {
          const exercisePlan = await firebaseGetExercisePlan(userAuth);
          setExercisePlans(exercisePlan);
        } catch (error) {
          console.error("Failed to fetch exercise plans:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchExercisePlans();
  }, [userAuth]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='container  px-4 py-6'>
      <div className='mb-6 border border-second-400/60 bg-second p-6 radius-default'>
        <div className='mb-6 flex items-center justify-center gap-3'>
          <h2 className='font-openSans text-xl font-semibold text-gray-100'>
            Twoje Ćwiczenia
          </h2>
        </div>

        <div className='w-full overflow-y-auto p-4'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <FaSpinner className='animate-spin text-3xl text-blue-400' />
            </div>
          ) : !exercises && exercisePlans && exercisePlans.length > 0 ? (
            <motion.div className='space-y-3'>
              {exercisePlans.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}>
                  <PlanRow
                    exercise={item}
                    onClick={() => setExercises(exercisePlans[index].exercise)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : exercisePlans?.length === 0 ? (
            <div className='py-8 text-center text-gray-400'>
              Nie masz jeszcze żadnych planów ćwiczeń
            </div>
          ) : exercises ? (
            <ExerciseTodo
              exercisesArr={exercises}
              backFn={() => setExercises(null)}
            />
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default ExercisePlan;
