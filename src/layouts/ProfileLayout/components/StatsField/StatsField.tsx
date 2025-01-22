import IconBox from "components/IconBox";
import type { IconType } from "react-icons/lib";

export interface StatsFieldProps {
  Icon: IconType;
  description: string;
  value: string | number;
}

const StatsField = ({ Icon, description, value }: StatsFieldProps) => {
  return (
    <div className='content-box relative flex h-fit flex-col gap-1 p-1 font-openSans text-xs sm:text-sm'>
      <p className='p-1 text-secondText'>{description}</p>
      <div className='flex w-full flex-row items-center'>
        <IconBox medium Icon={Icon} />

        <p className='ml-1 w-[70%] border-main font-sans text-xl font-extrabold tracking-wider opacity-90 sm:text-2xl '>
          {value}
        </p>
      </div>
    </div>
  );
};
export default StatsField;
