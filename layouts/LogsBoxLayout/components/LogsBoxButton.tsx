import { IconType } from "react-icons/lib";

interface LogsBoxButtonProps {
  title: string;
  active: boolean;
  onClick: () => void;
  Icon: IconType;
}

const LogsBoxButton = ({
  title,
  active,
  onClick,
  Icon,
}: LogsBoxButtonProps) => {
  return (
    <button
      className={`flex flex-row items-center bg-opacity-80 p-2 radius-default hover:bg-main-opposed-100
      ${active ? "bg-main-opposed-200 " : ""}`}
      onClick={onClick}>
      <Icon className='mx-1 text-base  xs:text-2xl sm:text-base' />
      <span className='hidden sm:block'> {title}</span>
    </button>
  );
};

export default LogsBoxButton;
