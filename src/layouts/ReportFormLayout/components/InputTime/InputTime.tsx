import { useField } from "formik";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { addZeroToTime } from "utils/converter";

interface InputTimeProps {
  name: string;
  description: string;
  addZero?: boolean;
  min?: number;
  max?: number;
}

const InputTime = ({
  name,
  description,
  addZero,
  min = 0,
  max = 99,
}: InputTimeProps) => {
  const [field, meta, helpers] = useField(name);

  const addValue = (value: number) => {
    const newValue = value ? ++value : 1;
    return newValue > max ? max : newValue;
  };

  const minusValue = (value: number) => {
    if (value <= min) return min;
    const newValue = value ? --value : 1;
    return newValue < min ? min : newValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d{0,2}$/.test(value) || value === "") {
      helpers.setValue(value);
    }
  };

  const handleInputBlur = () => {
    const numericValue = parseInt(field.value, 10);
    if (!isNaN(numericValue) && numericValue >= min && numericValue <= max) {
      helpers.setValue(addZero ? addZeroToTime(numericValue) : numericValue);
    } else {
      helpers.setValue(min);
    }
  };

  return (
    <div className='flex flex-col items-center gap-y-2 rounded-lg bg-gray-800 p-4 shadow-lg'>
      <label className='mb-2 text-center text-sm text-gray-300' htmlFor={name}>
        {description}
      </label>
      <div className='flex flex-col items-center'>
        <button
          type='button'
          onClick={() =>
            addZero
              ? helpers.setValue(addZeroToTime(addValue(field.value)))
              : helpers.setValue(addValue(field.value))
          }
          className='btn btn-circle btn-sm mb-2 bg-gray-700 text-white hover:bg-gray-600'>
          <FaChevronUp />
        </button>
        <input
          id={name}
          className='w-16 rounded-md bg-gray-900 py-2 text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-second-100'
          type='text'
          placeholder='00'
          value={field.value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
        />
        <button
          type='button'
          onClick={() =>
            addZero
              ? helpers.setValue(addZeroToTime(minusValue(field.value)))
              : helpers.setValue(minusValue(field.value))
          }
          className='btn btn-circle btn-sm mt-2 bg-gray-700 text-white hover:bg-gray-600'>
          <FaChevronDown />
        </button>
      </div>
    </div>
  );
};

export default InputTime;
