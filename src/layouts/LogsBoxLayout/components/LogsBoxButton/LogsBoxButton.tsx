import type { IconType } from "react-icons/lib";

interface LogsBoxButtonProps {
  title: string;
  active: boolean;
  onClick: () => void;
  notificationCount?: number;
  hasNewMessages?: boolean;
  hasNewDot?: boolean;
  Icon: IconType;
}

const LogsBoxButton = ({
  title,
  active,
  onClick,
  Icon,
  notificationCount,
  hasNewMessages,
  hasNewDot,
}: LogsBoxButtonProps) => {
  return (
    <div className='relative'>
      <button
        className={`transition-color flex flex-row items-center gap-1 bg-opacity-80 p-1 duration-200 rounded-xl hover:bg-second-300 xs:p-2
        ${active ? "bg-second-400 " : ""}`}
        onClick={onClick}>
        <Icon className='mx-1 text-base xs:text-2xl sm:text-base' />
        <span className='hidden font-normal sm:block'> {title}</span>
        {hasNewMessages && (
          <span className="ml-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {notificationCount || "!"}
          </span>
        )}
      </button>
      {hasNewDot && !hasNewMessages && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full shadow-md" />
      )}
    </div>
  );
};

export default LogsBoxButton;
