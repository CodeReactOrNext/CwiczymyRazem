import { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import { selectUserAuth } from "feature/user/store/userSlice";
import PlanRowEdit from "layouts/ExercisePlanLayout/LogBoxSection/PlanRowEdit";
import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import {
  firebaseDeleteExercisePlan,
  firebaseGetExercisePlan,
} from "utils/firebase/client/firebase.utils";
import ExerciseAdd from "../ExerciseAdd";
import ExercisePlanLayout from "layouts/ExercisePlanLayout/ExercisePlanLayout";
import ExerciseEdit from "../ExerciseAdd/ExerciseEdit";
import { CircleSpinner, SpiralSpinner } from "react-spinners-kit";
import { Button } from "assets/components/ui/button";
import { IoIosReturnLeft } from "react-icons/io";

interface ExercisesBoxShow {
  index?: number;
  box: "view" | "edit" | "add";
}

const ExerciseBox = () => {
  const [exercisesBox, setExercisesBox] = useState<null | ExercisesBoxShow>(
    null
  );
  const [exercises, setExercises] = useState<exercisePlanInterface[] | null>(
    null
  );
  const userAuth = useAppSelector(selectUserAuth);

  const updateExercisePlan = async () => {
    if (userAuth) {
      firebaseGetExercisePlan(userAuth).then((exercisePlan) => {
        setExercises(exercisePlan);
      });
    }
  };

  const deleteHandler = async (id: string) => {
    await firebaseDeleteExercisePlan(id);
    updateExercisePlan();
  };

  const refreshBox = () => {
    setExercisesBox(null);
    updateExercisePlan();
  };

  useEffect(() => {
    updateExercisePlan();
  }, []);

  if (exercisesBox?.box === "add") return null;

  if (exercisesBox?.box === "view" && exercises)
    return (
      <>
        {exercises[exercisesBox.index! - 1].exercise.map((item, index) => (
          <ExercisePlanLayout
            key={index}
            index={index}
            title={item.title}
            time={item.time}
            type={item.category}
          />
        ))}
        <div className='m-3 flex flex-row justify-center gap-5 rounded-sm p-3 text-base '>
          <Button variant='outline' onClick={refreshBox}>
            <IoIosReturnLeft />
            Wróć
          </Button>
        </div>
      </>
    );

  if (exercises)
    return (
      <div className='flex h-full w-full  flex-col items-center py-2 '>
        {exercises.map((exercise, index) => (
          <PlanRowEdit
            key={index}
            exercise={exercise}
            showExercise={() =>
              setExercisesBox({ index: index + 1, box: "view" })
            }
            deleteHandler={() => deleteHandler(exercise.id!)}
            editHandler={() => {
              setExercisesBox({ index: index + 1, box: "edit" });
              // @ts-ignore
              document?.getElementById("my_modal_4")?.showModal();
            }}
          />
        ))}
        <div className='mt-6'>
          <Button
            //@ts-ignore
            onClick={() => document?.getElementById("my_modal_3")?.showModal()}>
            <FaPlus /> Dodaj Nowe ćwiczenie
          </Button>
        </div>
        <ExerciseAdd
          backHandler={() =>
            //@ts-ignore
            document?.getElementById("my_modal_3")?.close()
          }
        />

        {exercises && exercisesBox && (
          <ExerciseEdit
            exercise={exercises[exercisesBox.index! - 1]}
            backHandler={refreshBox}
          />
        )}
      </div>
    );

  return (
    <div className='flex h-full w-full items-center justify-center'>
      <CircleSpinner />
    </div>
  );
};

export default ExerciseBox;
