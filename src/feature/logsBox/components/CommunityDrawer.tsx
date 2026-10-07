import { Sheet, SheetContent, SheetTitle } from "assets/components/ui/sheet";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { useOnlineUsers } from "hooks/useOnlineUsers";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";

/**
 * Who is around right now, next to the drawer's title. Lives inside the sheet's content, which
 * mounts only while the drawer is open, so the presence listener isn't running on every page.
 */
const OnlineCount = () => {
  const { t } = useTranslation("feed");
  const { onlineUsers } = useOnlineUsers();

  // A player with two tabs open reports twice.
  const online = new Set(onlineUsers.map((user) => user.uid)).size;
  const practicing = new Set(
    onlineUsers.filter((user) => user.currentActivity).map((user) => user.uid),
  ).size;

  if (online === 0) return null;

  return (
    <p className='flex items-center gap-2 text-xs text-zinc-400'>
      <span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
      <span>
        <Interpolate
          text={t("community.online")}
          values={{ count: <span className='font-semibold text-zinc-200'>{online}</span> }}
        />
      </span>
      {practicing > 0 && (
        <span>
          ·{" "}
          <Interpolate
            text={t("community.practicing")}
            values={{ count: <span className='font-semibold text-cyan-300'>{practicing}</span> }}
          />
        </span>
      )}
    </p>
  );
};

/**
 * The dashboard's activity feed and chats, reachable from every page. Streams only while open —
 * the feed's listeners come up with the drawer and go down with it.
 */
export const CommunityDrawer = () => {
  const { t } = useTranslation("feed");
  const isOpen = useCommunityDrawer((state) => state.isOpen);
  const setOpen = useCommunityDrawer((state) => state.setOpen);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side='right'
        aria-describedby={undefined}
        // The sheet is portalled out of the themed wrapper, so it brings the theme along — otherwise
        // every themed colour in the feed (card backgrounds, muted text) silently resolves to nothing.
        className='dark-theme flex w-full flex-col gap-0 p-0 sm:max-w-xl'>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 px-6 pb-2 pr-14 pt-5'>
          <SheetTitle className='text-base'>{t("community.sheet_title")}</SheetTitle>
          <OnlineCount />
        </div>
        {isOpen && (
          <LogsBoxView
            contained
            className='h-full min-h-0 flex-1 rounded-none bg-transparent'
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
