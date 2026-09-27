import { cn } from "assets/lib/utils";
import { tabNavItemClass } from "components/PageTabs/tabNav";
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

/** One tab of the feed panel, drawn with the app's shared tab bar (see `tabNav`). */
const LogsBoxButton = ({
  title,
  active,
  onClick,
  Icon,
  notificationCount,
  hasNewMessages,
  hasNewDot,
}: LogsBoxButtonProps) => (
  <button
    type='button'
    onClick={onClick}
    aria-pressed={active}
    aria-label={title}
    className={cn(tabNavItemClass(active), "relative px-3 sm:px-4")}>
    <Icon className='shrink-0 text-base' />
    {/* Phones get the icons alone, so four tabs still fit on one rail. */}
    <span className='hidden sm:inline'>{title}</span>
    {hasNewMessages && (
      <span className='flex h-5 min-w-[20px] items-center justify-center rounded-[8px] bg-red-600 px-1 text-[11px] font-extrabold text-white'>
        {notificationCount || "!"}
      </span>
    )}
    {hasNewDot && !hasNewMessages && (
      <span className='absolute right-1.5 top-2 h-2 w-2 rounded-full bg-red-600' />
    )}
  </button>
);

export default LogsBoxButton;
