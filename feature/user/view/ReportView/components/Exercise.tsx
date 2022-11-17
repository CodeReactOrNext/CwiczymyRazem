import Input from "components/Input";
import { FaQuestionCircle } from "react-icons/fa";

interface Props {
  title: string;
  inputId: string;
  isCheckbox?: boolean;
}

export default function Exercise({ title, inputId, isCheckbox }: Props) {
  return (
    <div
      className={`grid grid-cols-[3fr_5fr_1fr] items-center gap-2 ${
        isCheckbox ? "grid-cols-[3fr_1fr_1fr]" : ""
      }`}>
      <label htmlFor={inputId} className='justify-self-end'>
        {title}
      </label>
      {isCheckbox ? (
        <input id={inputId} type='checkbox' className='h-8' />
      ) : (
        <span className='flex items-end gap-1 text-base'>
          <Input id={inputId} />
          <p>Godzin</p>
          <Input />
          <p>Minut</p>
        </span>
      )}
      <FaQuestionCircle className='fill-tertiary-500' />
    </div>
  );
}
