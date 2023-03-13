import { useField } from "formik";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

import { addZeroToTime } from "utils/converter/addZeroToTime";

interface InputTimeProps {
  name: string;
  description: string;
  addZero?: boolean;
}

const InputTime = ({ name, description, addZero }: InputTimeProps) => {
  const [field, meta, helpers] = useField(name);

  const addValue = (value: number) => {
    return value ? ++value : 1;
  };
  const minusValue = (value: number) => {
    if (value <= 0) return 0;
    return value ? --value : 1;
  };
  return (
    <>
      <div className='flex max-w-[3rem] flex-col items-center gap-y-2 '>
        <button
          type='button'
          onClick={() =>
            addZero
              ? helpers.setValue(addZeroToTime(addValue(field.value)))
              : helpers.setValue(addValue(field.value))
          }
          className='active:click-behavior-second'>
          <FaChevronUp />
        </button>
        <div>
          <p className='m-0 bg-second-800 bg-opacity-50 text-center text-sm '>
            {description}
          </p>
          <input
            className='mb-0 w-full bg-second p-1 text-center	 text-xl font-bold tracking-widest	 text-tertiary focus:outline-none focus:ring focus:ring-main-opposed xs:p-2'
            type='string'
            placeholder={"00"}
            {...field}
          />
        </div>

        <button
          type='button'
          onClick={() =>
            addZero
              ? helpers.setValue(addZeroToTime(minusValue(field.value)))
              : helpers.setValue(minusValue(field.value))
          }
          className='active:click-behavior-second'>
          <FaChevronDown />
        </button>
      </div>
    </>
  );
};

export default InputTime;
