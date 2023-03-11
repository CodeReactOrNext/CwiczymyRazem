import { IconType } from "react-icons/lib";

interface IconBoxProps {
  Icon: IconType;
  small?: boolean;
}

const IconBox = ({ Icon, small }: IconBoxProps) => {
  return (
    <div
      className={`${
        small ? "m-1 mx-2 h-5 w-5 text-sm" : "m-2 h-7 w-7 sm:h-10 sm:w-10 sm:text-lg"
      }
       flex shrink-0 items-center justify-center bg-main-200 text-mainText radius-default `}>
      <Icon />
    </div>
  );
};
export default IconBox;
