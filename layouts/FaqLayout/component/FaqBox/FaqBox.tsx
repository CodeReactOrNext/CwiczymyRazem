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
      <div className='flex  h-20 w-full flex-row items-center gap-4 bg-second p-4 text-4xl text-tertiary hover:bg-second-100'>
        <div className='text-main-opposed'>
          {isOpen ? <FaMinus /> : <FaPlus />}
        </div>
        <p>{title}</p>
      </div>
      {isOpen && (
        <div className='mt-1 flex w-full flex-row items-center bg-second p-4 text-xl text-tertiary'>
          <p> {message}</p>
        </div>
      )}
    </div>
  );
};

export default FaqBox;
