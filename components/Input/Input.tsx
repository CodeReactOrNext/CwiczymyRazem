import { IconType } from "react-icons/lib";

export interface InputProps {
  Icon?: IconType;
  placeholder?: string;
}

const Input = ({ Icon, placeholder }: InputProps) => {
  return (
    <div className='flex w-full flex-row items-center justify-center'>
      {Icon && (
        <div className='flex h-[60px] w-[60px] items-center justify-center bg-main-opposed'>
          <Icon size='24' />
        </div>
      )}
      <input
        className='w-full bg-tertiary p-2 pl-3 text-xl text-main-opposed focus:outline-none focus:ring focus:ring-main-opposed'
        type='text'
        placeholder={placeholder}
      />
    </div>
  );
};

export default Input;
