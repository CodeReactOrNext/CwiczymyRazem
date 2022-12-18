import { useField } from "formik";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { toast } from "react-toastify";

export default function InputTime({ name }: { name: string }) {
  const [field, meta] = useField(name);
  return (
    <>
      <div className='flex max-w-[3rem] flex-col items-center gap-y-2'>
        <FaChevronUp />
        <input
          className='w-full bg-second p-1 text-center	 text-xl font-bold tracking-widest	  text-tertiary focus:outline-none focus:ring focus:ring-main-opposed xs:p-2'
          type='string'
          placeholder={"00"}
          {...field}
        />
        <FaChevronDown />
      </div>
   
    </>
  );
}
