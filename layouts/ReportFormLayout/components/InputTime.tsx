import { FaChevronDown, FaChevronUp } from "react-icons/fa";

export default function InputTime() {
  return (
    <div className='flex max-w-[3rem] flex-col items-center gap-y-2'>
      <FaChevronUp />
      <input
        className='w-full bg-second p-1 text-center	 text-xl font-bold tracking-widest	  text-tertiary focus:outline-none focus:ring focus:ring-main-opposed xs:p-2'
        type='string'
        placeholder={"00"}
      />
      <FaChevronDown />
    </div>
  );
}