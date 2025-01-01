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
  FaLock,
  FaLockOpen,
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

  const exerciseCategories = [
    { value: "technique", label: "Technika" },
    { value: "theory", label: "Teoria" },
    { value: "hearing", label: "Sluch" },
    { value: "creativity", label: "Kreatywnosc" },
  ];

  const submitHandler = async (values: exercisePlanInterface) => {
    const exercise = values.exercise.map((item) => {
      return { ...item, time: item.time * 60000 };
    });
    try {
      await firebaseUploadExercisePlan({ ...values, exercise: exercise });
      toast.success("Dodano ćwiczenie");
      backHandler();
    } catch {
      toast.error("Nie udało się dodać ćwiczenia");
    }
  };

  const addNewExercise = (push: (obj: any) => void) => {
    push({
      title: "",
      category: "technique",
      time: 0,
      done: false,
    });
  };

  return (
    <dialog className='modal' id='my_modal_3'>
      <div className='modal-box max-w-[900px] border border-second-400/60 bg-second '>
        <Formik
          initialValues={initialValues}
          onSubmit={submitHandler}
          validationSchema={exerciseSchema}>
          {({ values }: { values: exercisePlanInterface }) => {
            return (
              <>
                <div className='mb-4 rounded-lg bg-second-800/50 p-6 '>
                  <h3 className='mb-4 text-xl font-semibold text-white'>
                    Nowy plan ćwiczeń
                  </h3>
                  <div className='space-y-2'>
                    <label className='text-sm text-secondText'>
                      Tytuł planu
                    </label>
                    <Input
                      name='title'
                      Icon={FaIndent}
                      placeholder={"Np. Dzień 2 - Ćwiczenie improwizacji"}
                    />
                  </div>
                </div>
                <FieldArray
                  name={"exercise"}
                  render={({ push, remove }) => (
                    <Form>
                      <div className='rounded-lg bg-second-800/50 p-6 '>
                        <h4 className='mb-2 text-lg font-medium text-white'>
                          Lista ćwiczeń
                        </h4>

                        <div className='space-y-2'>
                          <div className='flex items-center gap-4'>
                            <div className='flex-1'>Nazwa ćwiczenia</div>
                            <div className='w-48'>Rodzaj</div>
                            <div className='w-32'>
                              <div className='label'>
                                <span className='label'>
                                  Czas ćwiczenia w minuach
                                </span>
                              </div>
                            </div>
                            <div className='w-[38px]' />
                          </div>
                          {values.exercise.length > 0 &&
                            values.exercise.map((exercise, index) => (
                              <div
                                key={index}
                                className='pb-3 transition-all duration-200'>
                                <div className='flex items-center gap-4'>
                                  <div className='flex-1'>
                                    <Input
                                      name={`exercise[${index}].title`}
                                      placeholder='Nazwa ćwiczenia'
                                      Icon={FaIndent}
                                    />
                                  </div>
                                  <div className='w-48'>
                                    <Field
                                      as='select'
                                      name={`exercise[${index}].category`}
                                      className='select select-bordered w-full bg-second-800/50 text-gray-200'>
                                      {exerciseCategories.map((category) => (
                                        <option
                                          key={category.value}
                                          value={category.value}>
                                          {category.label}
                                        </option>
                                      ))}
                                    </Field>
                                  </div>
                                  <div className='w-32'>
                                    <InputTime
                                      name={`exercise[${index}].time`}
                                      Icon={FaRegClock}
                                    />
                                  </div>
                                  <button
                                    type='button'
                                    onClick={() => remove(index)}
                                    className='p-2 text-red-400 transition-colors hover:scale-110 hover:text-red-300'
                                    title='Usuń ćwiczenie'>
                                    <FaTimes size={22} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          <button
                            type='button'
                            className='btn w-full gap-2'
                            onClick={() => addNewExercise(push)}>
                            <FaPlus className='animate-pulse' /> Dodaj nowe
                            ćwiczenie
                          </button>
                        </div>
                      </div>

                      <div className='mt-6 flex items-center justify-between rounded-lg bg-second-800/50 p-4'>
                        <label className='flex cursor-pointer items-center gap-2 text-gray-300 transition-colors hover:text-gray-200'>
                          <Field
                            type='checkbox'
                            name='isPrivate'
                            className='checkbox-primary checkbox'
                          />
                          <span className='flex items-center gap-2'>
                            {values.isPrivate ? (
                              <FaLock className='text-white' />
                            ) : (
                              <FaLockOpen />
                            )}
                            Plan prywatny
                          </span>
                        </label>
                      </div>

                      <div className='modal-action mt-6 flex justify-end gap-3'>
                        <button
                          type='button'
                          className='btn btn-outline '
                          onClick={backHandler}>
                          Anuluj
                        </button>
                        <button
                          type='submit'
                          className='0 btn transition-colors'>
                          Zapisz plan
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
