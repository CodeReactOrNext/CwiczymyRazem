import { IconType } from "react-icons/lib";

interface IconBoxProps {
  Icon: IconType;
}

const IconBox = ({ Icon }: IconBoxProps) => {
  return (
    <div className='m-2 flex h-7 w-7  items-center justify-center bg-main-200 text-mainText radius-default sm:h-10 sm:w-10 sm:text-lg'>
      <Icon />
    </div>
  );
};
export default IconBox;
