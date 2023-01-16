import { IconType } from "react-icons/lib";

export interface StatsFieldProps {
  Icon: IconType;
  description: string;
  value: string | number;
}

const StatsField = ({ Icon, description, value }: StatsFieldProps) => {
  return (
    <div className='relative right-2 flex flex-row font-openSans font-bold text-sm'>
      <div className='flex h-8  w-8 shrink-0 items-center justify-center  bg-main  text-mainText sm:h-10 sm:w-10 sm:text-lg'>
        <Icon />
      </div>
      <p className='mx-2  self-center text-main-opposed-600'>
        {description}
        <span className='fonte- ml-1 text-mainText'>{value}</span>
      </p>
    </div>
  );
};
export default StatsField;
