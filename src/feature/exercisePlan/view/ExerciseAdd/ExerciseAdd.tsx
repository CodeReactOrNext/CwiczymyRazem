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
    { value: "warmup", label: "Rozgrzewka" },
    { value: "song", label: "Utwór" },
    { value: "other", label: "Inne" }
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
      <div className='modal-box max-w-[900px] bg-gray-900 shadow-xl'>
        <Formik
          initialValues={initialValues}
          onSubmit={submitHandler}
          validationSchema={exerciseSchema}>
          {({ values }: { values: exercisePlanInterface }) => {
            return (
              <>
                <div className='bg-gray-800/50 p-6 rounded-lg shadow-md mb-4'>
                  <h3 className='text-xl font-semibold mb-4 text-white'>Nowy plan ćwiczeń</h3>
                  <div className='space-y-2'>
                    <label className='text-sm text-gray-300'>Tytuł planu</label>
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
                      <div className='bg-gray-800/50 p-6 rounded-lg shadow-md'>
                        <h4 className='text-lg font-medium mb-4 text-white'>Lista ćwiczeń</h4>
                        <div className='space-y-4'>
                          {values.exercise.length > 0 &&
                            values.exercise.map((exercise, index) => (
                              <div key={index} className='bg-gray-700/30 p-4 rounded-lg transition-all duration-200 hover:bg-gray-700/40'>
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
                                      as="select"
                                      name={`exercise[${index}].category`}
                                      className="select select-bordered w-full bg-gray-800/50 text-gray-200"
                                    >
                                      {exerciseCategories.map((category) => (
                                        <option key={category.value} value={category.value}>
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
                                    className='p-2 text-red-400 hover:text-red-300 transition-colors hover:scale-110'
                                    title="Usuń ćwiczenie"
                                  >
                                    <FaTimes size={22} />
                                  </button>
                                </div>
                              </div>
                            ))}

                          <button
                            type='button'
                            className='btn btn-primary w-full gap-2 hover:bg-blue-600 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]'
                            onClick={() => addNewExercise(push)}
                          >
                            <FaPlus className="animate-pulse" /> Dodaj nowe ćwiczenie
                          </button>
                        </div>
                      </div>

                      <div className='mt-6 bg-gray-800/50 p-4 rounded-lg flex items-center justify-between'>
                        <label className='flex items-center gap-2 text-gray-300 cursor-pointer hover:text-gray-200 transition-colors'>
                          <Field 
                            type='checkbox' 
                            name='isPrivate'
                            className='checkbox checkbox-primary' 
                          />
                          <span className='flex items-center gap-2'>
                            {values.isPrivate ? <FaLock className="text-blue-400" /> : <FaLockOpen />}
                            Plan prywatny
                          </span>
                        </label>
                      </div>

                      <div className='modal-action mt-6 flex justify-end gap-3'>
                        <button
                          type='button'
                          className='btn btn-outline hover:bg-gray-700/50'
                          onClick={backHandler}>
                          Anuluj
                        </button>
                        <button 
                          type='submit' 
                          className='btn btn-primary hover:bg-blue-600 transition-colors'
                        >
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
