import IconBox from "components/IconBox";
import { IconType } from "react-icons/lib";

export interface StatsFieldProps {
  Icon: IconType;
  description: string;
  value: string | number;
}

const StatsField = ({ Icon, description, value }: StatsFieldProps) => {
  return (
    <div className='content-box relative right-2 m-2 flex  w-32 flex-col p-1 font-openSans text-xs sm:w-48 sm:text-sm'>
      <div className='flex w-full flex-row items-center justify-around border-b-2 border-second-400/60'>
        <IconBox medium Icon={Icon} />
        <p className='ml-1 w-[70%] border-main font-sans text-xl font-extrabold tracking-wider opacity-90 sm:text-2xl '>
          {value}
        </p>
      </div>
      <p className=' p-1 font-thin'>{description}</p>
    </div>
  );
};
export default StatsField;
