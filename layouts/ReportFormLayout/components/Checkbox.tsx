import { FaQuestionCircle } from "react-icons/fa";

interface CheckboxProps {
  title: string;
  inputId: string;
}

export default function Exercise({ title, inputId }: CheckboxProps) {
  return (
    <div className={`grid grid-cols-[3fr_1fr_1fr] items-center gap-2`}>
      <label htmlFor={inputId} className='justify-self-end'>
        {title}
      </label>
      <input id={inputId} type='checkbox' className='h-8' />
      <FaQuestionCircle className='fill-tertiary-500' />
    </div>
  );
}
