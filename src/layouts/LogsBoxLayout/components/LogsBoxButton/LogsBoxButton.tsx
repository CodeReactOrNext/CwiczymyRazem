import { cn } from "assets/lib/utils";
import { CountBadge } from "components/CountBadge/CountBadge";
import { tabNavItemClass } from "components/PageTabs/tabNav";
import type { LucideIcon } from "lucide-react";

interface LogsBoxButtonProps {
  title: string;
  active: boolean;
  onClick: () => void;
  notificationCount?: number;
  hasNewMessages?: boolean;
  hasNewDot?: boolean;
  Icon: LucideIcon;
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
    <Icon size='1em' className='shrink-0 text-base' />
    {/* Phones get the icons alone, so four tabs still fit on one rail. */}
    <span className='hidden sm:inline'>{title}</span>
    {hasNewMessages && (
      // Inline next to the label rather than pinned to a corner; no cap, as before.
      <CountBadge
        count={notificationCount || "!"}
        tone='alert'
        max={Infinity}
        className='static'
      />
    )}
    {hasNewDot && !hasNewMessages && (
      <span className='absolute right-1.5 top-2 h-2 w-2 rounded-full bg-red-600' />
    )}
  </button>
);

export default LogsBoxButton;
