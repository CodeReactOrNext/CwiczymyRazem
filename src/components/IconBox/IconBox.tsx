import { IconType } from "react-icons/lib";

interface IconBoxProps {
  Icon: IconType;
  small?: boolean;
  medium?: boolean;
}

const IconBox = ({ Icon, small, medium }: IconBoxProps) => {
  return (
    <div
      className={`${
        small
          ? "m-1 mx-2 h-5 w-5 !rounded-md text-sm"
          : medium
          ? "m-1.5 h-6 w-6 sm:h-8 sm:w-8 sm:text-base"
          : "m-2 h-7 w-7 sm:h-10 sm:w-10 sm:text-lg"
      }
       flex shrink-0 items-center justify-center   text-mainText radius-default `}>
      <Icon />
    </div>
  );
};
export default IconBox;
