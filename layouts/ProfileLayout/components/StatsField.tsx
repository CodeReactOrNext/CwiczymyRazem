import IconBox from "components/IconBox";
import { IconType } from "react-icons/lib";

export interface StatsFieldProps {
  Icon: IconType;
  description: string;
  value: string | number;
}

const StatsField = ({ Icon, description, value }: StatsFieldProps) => {
  return (
    <div className='relative right-2 m-2 flex w-32 flex-col border-2  border-second-400/60 bg-second-600 p-1 font-openSans text-xs radius-default sm:w-48 sm:text-sm'>
      <div className='flex w-full flex-row items-center justify-around border-b-2 border-second-400/60'>
        {/* <IconBox Icon={Icon} /> */}
        <p className='  w-[50%] border-main text-center font-sans text-xl font-extrabold tracking-wider opacity-90 sm:text-3xl '>
          {value}
        </p>
      </div>

      <p className='mx-2 self-center p-1 font-bold '>{description}</p>
    </div>
  );
};
export default StatsField;
