import { IconType } from "react-icons/lib";

interface IconBoxProps {
  Icon: IconType;
}

const IconBox = ({ Icon }: IconBoxProps) => {
  return (
    <div className='m-2 flex h-7 w-7 '>
      <Icon />
    </div>
  );
};
export default IconBox;
