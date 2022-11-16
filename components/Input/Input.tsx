import { IconType } from "react-icons/lib";

export interface InputProps {
  Icon?: IconType;
  placeholder?: string;
  id?: string;
}

const Input = ({ Icon, placeholder, id }: InputProps) => {
  return (
    <div className='flex w-full flex-row items-center justify-center'>
      {Icon && (
        <div className='flex h-[50px] w-[50px] items-center justify-center bg-main-opposed xs:h-[60px] xs:w-[60px]'>
          <Icon size='24' />
        </div>
      )}
      <input
        id={id}
        className='w-full bg-tertiary p-1 pl-3 text-xl text-main-opposed focus:outline-none focus:ring focus:ring-main-opposed xs:p-2'
        type='text'
        placeholder={placeholder}
      />
    </div>
  );
};

export default Input;
