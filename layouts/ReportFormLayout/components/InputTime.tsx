import { useField } from "formik";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const InputTime = ({ name }: { name: string }) => {
  const [field, meta, helpers] = useField(name);

  return (
    <>
      <div className='flex max-w-[3rem] flex-col items-center gap-y-2'>
        <button
          type='button'
          onClick={() => helpers.setValue(field.value ? ++field.value : 1)}
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
          onClick={() => helpers.setValue(field.value ? --field.value : 1)}
          className='active:click-behavior-second'>
          <FaChevronDown />
        </button>
      </div>
    </>
  );
};

export default InputTime;
