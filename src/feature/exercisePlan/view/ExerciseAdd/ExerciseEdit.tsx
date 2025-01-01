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

interface ExcerisePlanProps {
  exercise: any;
  backHandler: () => void;
}

const ExerciseEdit = ({ backHandler, exercise }: ExcerisePlanProps) => {
  const initialValues = exercise;

  const submitHandler = async (values: exercisePlanInterface) => {
    const exercise = values.exercise.map((item) => {
      return { ...item, time: item.time * 60000 };
    });
    await firebaseUploadExercisePlan(
      { ...values, exercise: exercise },
      values.id
    );
    backHandler();
  };

  return (
    <dialog className='modal' id='my_modal_4'>
      <div className='modal-box max-w-[900px]'>
        <div className='flex h-full w-full  flex-col items-center py-1 '>
          <Formik
            initialValues={{
              ...initialValues,
              exercise: initialValues.exercise.map((item: any) => {
                return { ...item, time: item.time / 60000 };
              }),
            }}
            onSubmit={submitHandler}>
            {({ values }: { values: exercisePlanInterface }) => (
              <div className='flex w-full flex-col gap-2 p-4'>
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
                            <div
                              key={index}
                              className=' mb-3 flex w-full flex-row gap-3'>
                              <div className='max-w-[300px]'>
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
                          ))}

                        <button
                          type='button'
                          className='m-2 flex flex-row justify-center  gap-1'
                          onClick={() => {
                            push({ title: "", category: "technique" });
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
                      <div className='m-3 flex flex-row justify-center gap-5 rounded-sm bg-main-opposed-500/20 p-3 text-base '>
                        <button type='button' onClick={backHandler}>
                          Wróć
                        </button>
                        <button type='submit'>Wyślij</button>
                      </div>
                    </Form>
                  )}
                />
              </div>
            )}
          </Formik>
        </div>
      </div>
    </dialog>
  );
};

export default ExerciseEdit;
