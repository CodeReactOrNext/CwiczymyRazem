import { IconType } from "react-icons/lib";

interface LogsBoxButtonProps {
  title: string;
  active: boolean;
  onClick: () => void;
  notificationCount?: number;
  hasNewMessages?: boolean;
  Icon: IconType;
}

const LogsBoxButton = ({
  title,
  active,
  onClick,
  Icon,
  notificationCount,
  hasNewMessages,
}: LogsBoxButtonProps) => {
  return (
    <div className='indicator'>
      <button
        className={`transition-color flex flex-row items-center gap-1 bg-opacity-80 p-1 duration-200 radius-default hover:bg-second-300 xs:p-2
        ${active ? "bg-second-400 " : ""}`}
        onClick={onClick}>
        <Icon className='mx-1 text-base xs:text-2xl sm:text-base' />
        <span className='hidden font-normal sm:block'> {title}</span>
        {hasNewMessages && (
          <span className='badge indicator-item bg-main-500 text-white'>
            {notificationCount || "!"}
          </span>
        )}
      </button>
    </div>
  );
};

export default LogsBoxButton;
