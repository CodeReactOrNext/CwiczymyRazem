import { useState } from "react";
import { FaMinus, FaPlus } from "react-icons/fa";

interface FaqBoxProps {
  title: string;
  message: string;
}

const FaqBox = ({ title, message }: FaqBoxProps) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className='cursor-pointer' onClick={() => setIsOpen(!isOpen)}>
      <div
        className='min-h-20 flex w-full flex-row items-center gap-4 bg-second p-4 text-2xl text-tertiary-300 radius-default hover:bg-second-200 md:text-3xl
       lg:text-4xl '>
        <div className='text-main-opposed'>
          {isOpen ? <FaMinus /> : <FaPlus />}
        </div>
        <p>{title}</p>
      </div>
      {isOpen && (
        <div className='mt-1 flex w-full flex-row items-center bg-second-900 p-4 px-8 font-openSans text-sm tracking-wide text-mainText md:text-base lg:px-12 radius-default '>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
};

export default FaqBox;
