import { useField } from "formik";
import { motion } from "framer-motion";
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

  const isError = meta.touched && meta.error;
  const hasValue = parseInt(field.value, 10) > 0;

  return (
    <div className='flex flex-col items-center font-openSans'>
      <motion.button
        type='button'
        onClick={() =>
          addZero
            ? helpers.setValue(addZeroToTime(addValue(field.value)))
            : helpers.setValue(addValue(field.value))
        }
        whileHover={{ scale: 1.1, y: -1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#1c1c22]/80 to-[#15151a]/80 text-white shadow-sm transition-all hover:from-[#25252a]/80 hover:to-[#1a1a1f]/80 hover:shadow'>
        <FaChevronUp className='text-xs text-[#4a7edd]/80' />
      </motion.button>

      <div className='relative my-2'>
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}>
          <input
            id={name}
            className={`w-16 rounded-lg bg-gradient-to-b from-[#0c0c0e]/80 to-[#0a0a0c]/80 py-2 text-center text-xl font-medium outline-none backdrop-blur-sm transition-all ${
              isError
                ? "border-error-300 border shadow-[0_0_5px_0_rgba(239,68,68,0.2)]"
                : hasValue
                ? "border border-gray-700/30 text-white shadow-sm"
                : "border border-gray-800/20 text-gray-400 hover:border-gray-700/30"
            }`}
            type='text'
            placeholder='00'
            value={field.value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            aria-label={description}
          />
          <div className='mt-1 text-center text-xs font-medium text-gray-500'>
            {description}
          </div>
        </motion.div>
      </div>

      <motion.button
        type='button'
        onClick={() =>
          addZero
            ? helpers.setValue(addZeroToTime(minusValue(field.value)))
            : helpers.setValue(minusValue(field.value))
        }
        whileHover={{ scale: 1.1, y: 1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className='flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-[#1c1c22]/80 to-[#15151a]/80 text-white shadow-sm transition-all hover:from-[#25252a]/80 hover:to-[#1a1a1f]/80 hover:shadow'>
        <FaChevronDown className='text-xs text-[#4a7edd]/80' />
      </motion.button>
    </div>
  );
};

export default InputTime;
