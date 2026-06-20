import { useRipple } from "hooks/useRipple";
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
  const { createRipple, ripple } = useRipple();
  return (
    <div className='relative'>
      <button
        className={`transition-color relative flex min-h-[44px] min-w-[44px] flex-row items-center justify-center gap-1 overflow-hidden bg-opacity-80 p-2 duration-200 rounded-xl hover:bg-second-300 sm:min-h-0 sm:min-w-0 sm:p-2
        ${active ? "bg-second-400 " : ""}`}
        onClick={(e) => {
          createRipple(e);
          onClick();
        }}>
        {ripple}
        <Icon className='mx-1 text-base xs:text-2xl sm:text-base' />
        <span className='hidden font-normal sm:block'> {title}</span>
        {hasNewMessages && (
          <span className="ml-1 flex min-w-[20px] h-5 items-center justify-center rounded-[8px] bg-red-600 px-1 text-[11px] font-extrabold text-white shadow-sm">
            {notificationCount || "!"}
          </span>
        )}
      </button>
      {hasNewDot && !hasNewMessages && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full shadow-md" />
      )}
    </div>
  );
};

export default LogsBoxButton;
