import { useField } from "formik";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const InputTime = ({ name }: { name: string }) => {
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
      <div className='flex max-w-[3rem] flex-col items-center gap-y-2'>
        <button
          type='button'
          onClick={() => helpers.setValue(addValue(field.value))}
          className='active:click-behavior-second'>
          <FaChevronUp />
        </button>
        <input
          className='w-full bg-second p-1 text-center	 text-xl font-bold tracking-widest	 text-tertiary focus:outline-none focus:ring focus:ring-main-opposed xs:p-2'
          type='string'
          placeholder={"00"}
          {...field}
        />
        <button
          type='button'
          onClick={() => helpers.setValue(minusValue(field.value))}
          className='active:click-behavior-second'>
          <FaChevronDown />
        </button>
      </div>
    </>
  );
};

export default InputTime;
