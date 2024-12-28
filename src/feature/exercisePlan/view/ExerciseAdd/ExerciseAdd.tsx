import { exercisePlanInterface } from "feature/exercisePlan/view/ExercisePlan/ExercisePlan";
import { Field, FieldArray, Form, Formik } from "formik";
import Input from "layouts/ExercisePlanLayout/Input";
import InputTime from "layouts/ExercisePlanLayout/InputTime";
import Select from "layouts/ExercisePlanLayout/Select";
import {
  FaGuitar,
  FaIndent,
  FaPlus,
  FaRegClock,
  FaTimes,
} from "react-icons/fa";
import { firebaseUploadExercisePlan } from "utils/firebase/client/firebase.utils";
import { exerciseSchema } from "./ExerciseEdit.schema";
import { toast } from "sonner";

interface ExcerisePlanProps {
  backHandler: () => void;
}

const ExceriseAdd = ({ backHandler }: ExcerisePlanProps) => {
  const initialValues: exercisePlanInterface = {
    title: "",
    isPrivate: false,
    exercise: [
      {
        title: "",
        category: "technique",
        time: 0,
        done: false,
      },
    ],
  };

  const submitHandler = async (values: exercisePlanInterface) => {
    const exercise = values.exercise.map((item) => {
      return { ...item, time: item.time * 60000 };
    });
    try {
      await firebaseUploadExercisePlan({ ...values, exercise: exercise });
      toast.success("Dodano ćwiczenie");
      backHandler();
    } catch {
      toast.success("Nie udało się dodać ćwiczenia");
    }
  };

  return (
    <dialog className='modal' id='my_modal_3'>
      <div className='modal-box max-w-[900px]'>
        <Formik
          initialValues={initialValues}
          onSubmit={submitHandler}
          validationSchema={exerciseSchema}>
          {({ values }: { values: exercisePlanInterface }) => {
            return (
              <>
                <div className=' bg-main-opposed-500/20 p-3 radius-default '>
                  <p className='py-1'>Tytuł</p>
                  <Input
                    name='title'
                    Icon={FaIndent}
                    placeholder={"Np. Dzień 2 - Ćwiczenie improwizacji"}
                  />
                </div>
                <FieldArray
                  name={"exercise"}
                  render={({ push, remove }) => (
                    <Form>
                      <div className='flex  flex-col bg-main-opposed-500/20 p-3 radius-default'>
                        <p className='self-start py-1'>Ćwiczenia</p>
                        {values.exercise.length > 0 &&
                          values.exercise.map((exercise, index) => (
                            <>
                              <div
                                key={index}
                                className='flex w-full flex-row gap-3'>
                                <div className='w-full max-w-[350px]'>
                                  <Input
                                    name={`exercise[${index}].title`}
                                    placeholder='Np. '
                                    Icon={FaIndent}
                                  />
                                </div>
                                <Select
                                  name={`exercise[${index}].category`}
                                  Icon={FaGuitar}
                                />

                                <InputTime
                                  name={`exercise[${index}].time`}
                                  Icon={FaRegClock}
                                />
                                <button
                                  type='button'
                                  onClick={() => remove(index)}>
                                  <FaTimes size={22} />
                                </button>
                              </div>
                              <div className='divider' />
                            </>
                          ))}

                        <button
                          type='button'
                          className='btn btn-neutral m-2 flex  flex-row justify-center  gap-1'
                          onClick={() => {
                            push({
                              title: "",
                              category: "technique",
                              time: "0",
                              done: false,
                            });
                          }}>
                          <FaPlus /> Dodaj
                        </button>
                      </div>
                      <div className='m-3 flex flex-row justify-center gap-4 p-3'>
                        <p>
                          Czy chcesz żeby to ćwiczenie nie było widoczne na
                          Twoim profilu?
                        </p>
                        <Field type='checkbox' name='isPrivate' />
                      </div>
                      <div className='modal-action  p-3 text-base '>
                        <button
                          type='button'
                          className='btn  btn-neutral'
                          onClick={backHandler}>
                          Wróć
                        </button>
                        <button type='submit' className='btn  btn-neutral'>
                          Wyślij
                        </button>
                      </div>
                    </Form>
                  )}
                />
              </>
            );
          }}
        </Formik>
      </div>
    </dialog>
  );
};

export default ExceriseAdd;
