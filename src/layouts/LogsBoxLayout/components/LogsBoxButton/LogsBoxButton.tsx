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
      className={`flex flex-row items-center gap-1 bg-opacity-80 p-1  duration-200 transition-color radius-default hover:bg-second-300 xs:p-2
      ${active ? "bg-second-400 " : ""}`}
      onClick={onClick}>
      <Icon className='mx-1 text-base   xs:text-2xl sm:text-base' />
      <span className='hidden font-normal sm:block'> {title}</span>
    </button>
  );
};

export default LogsBoxButton;
