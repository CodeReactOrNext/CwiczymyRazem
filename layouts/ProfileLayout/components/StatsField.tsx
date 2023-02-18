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
 
    </div>
  );
};
export default StatsField;
