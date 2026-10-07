import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "assets/components/ui/drawer";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import { Lock, X } from "lucide-react";
import Link from "next/link";

export interface MoreSheetItem {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
  external?: boolean;
  /** Level the page opens at — set only while the account is below it. */
  lockedLvl?: number;
  showBadge?: boolean;
}

export interface MoreSheetGroup {
  id: string;
  /** Groups without a title are loose destinations (Arsenal, Settings…). */
  title?: string;
  items: MoreSheetItem[];
}

/** Marks the bottom bar, so a tap on it is not read as "tap outside the sheet". */
export const MOBILE_BOTTOM_NAV_ATTR = "data-mobile-bottom-nav";

/** Room for the bottom bar (its 52px item + 6px top padding + the safe area). */
const ABOVE_BOTTOM_NAV = "bottom-[calc(58px_+_env(safe-area-inset-bottom,0px))]";

const MoreSheetRow = ({
  item,
  onNavigate,
}: {
  item: MoreSheetItem;
  onNavigate: () => void;
}) => {
  const { t } = useTranslation("nav");

  return (
    <Link
      href={item.href}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noreferrer" : undefined}
      aria-current={item.isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150",
        item.isActive
          ? "bg-cyan-500/10 text-cyan-300"
          : "text-zinc-200 hover:bg-white/5 active:bg-white/10",
      )}>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center",
          item.isActive ? "text-cyan-400" : "text-zinc-400",
        )}>
        {item.icon}
      </span>
      <span className={cn("flex-1", item.lockedLvl && "text-zinc-400")}>
        {item.name}
      </span>
      {item.lockedLvl ? (
        <span
          aria-label={t("locked_until_level", { level: item.lockedLvl })}
          className='flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-zinc-400'>
          <Lock size={12} />
          {item.lockedLvl}
        </span>
      ) : (
        item.showBadge && (
          <span
            aria-label={t("unclaimed_reward")}
            className='h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-500'
          />
        )
      )}
    </Link>
  );
};

/**
 * The phone's "More" tab: a sheet that rises above the bottom bar and lists
 * every destination the four tabs do not cover as plain rows — grouped, but
 * never folded, so nothing hides behind a second tap the way the old
 * slide-in copy of the desktop sidebar did.
 */
export const MobileMoreSheet = ({
  open,
  onOpenChange,
  header,
  groups,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Profile row and the community / notification buttons. */
  header: React.ReactNode;
  groups: MoreSheetGroup[];
  /** Server clock and sign out. */
  footer: React.ReactNode;
}) => {
  const { t } = useTranslation("nav");
  const close = () => onOpenChange(false);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent
        overlayClassName='bg-black/60 lg:hidden'
        onPointerDownOutside={(event) => {
          // The bottom bar stays live under the sheet: "More" toggles it shut
          // and the other tabs navigate (the route change closes it).
          const target = event.target as Element | null;
          if (target?.closest(`[${MOBILE_BOTTOM_NAV_ATTR}]`)) {
            event.preventDefault();
          }
        }}
        className={cn(
          ABOVE_BOTTOM_NAV,
          "max-h-[80dvh] rounded-t-2xl border-0 bg-zinc-950 pt-2 outline-none lg:hidden",
        )}>
        <DrawerTitle className='sr-only'>{t("more")}</DrawerTitle>

        <div className='flex items-center gap-2 px-4 pb-2 pt-3'>
          <div className='min-w-0 flex-1'>{header}</div>
          <DrawerClose
            aria-label={t("close_menu")}
            className='flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/10 hover:text-white'>
            <X size={18} />
          </DrawerClose>
        </div>

        <nav className='min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-6 pt-2'>
          {groups.map((group) => (
            <section key={group.id}>
              {group.title && (
                <h3 className='mb-2 px-3 text-xs font-semibold text-zinc-400'>
                  {group.title}
                </h3>
              )}
              <div className='space-y-0.5 rounded-xl bg-zinc-900/60 p-1'>
                {group.items.map((item) => (
                  <MoreSheetRow key={item.id} item={item} onNavigate={close} />
                ))}
              </div>
            </section>
          ))}

          {footer}
        </nav>
      </DrawerContent>
    </Drawer>
  );
};
