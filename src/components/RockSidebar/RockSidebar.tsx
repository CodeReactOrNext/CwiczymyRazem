import { Button } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { FeedbackModal } from "components/FeedbackBubble";
import { MobileBottomNav } from "components/MobileBottomNav/MobileBottomNav";
import Avatar from "components/UI/Avatar";
import { useHasUnclaimedMilestone } from "feature/aiSummary/hooks/useHasUnclaimedMilestone";
import { NotificationsBell } from "feature/notifications/components/NotificationsBell";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserInfo,
  selectUserName,
} from "feature/user/store/userSlice";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { AnimatePresence, motion } from "framer-motion";
import { useFeedbackPrompt } from "hooks/useFeedbackPrompt";
import { useRipple } from "hooks/useRipple";
import { useTranslation } from "hooks/useTranslation";
import {
  Activity,
  Home,
  Library,
  LogOut,
  Map,
  MessageSquarePlus,
  Milestone,
  Music,
  Settings,
  Swords,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NavPagesTypes } from "types/layout.types";


export interface SidebarLinkInterface {
  id: NavPagesTypes;
  name: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface RockSidebarProps {
  pageId: NavPagesTypes;
}

const SidebarNavLink = ({
  href,
  name,
  icon,
  isActive,
  onClick,
  showBadge = false,
  tooltip,
  emphasized = false,
}: {
  href: string;
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  showBadge?: boolean;
  tooltip?: string;
  emphasized?: boolean;
}) => {
  const { createRipple, ripple } = useRipple();
  const link = (
    <Link
      href={href}
      onClick={(e) => {
        createRipple(e);
        onClick?.();
      }}
      className={`relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm border transition-all duration-200 active:scale-[0.98] ${
        emphasized ? "font-semibold" : "font-medium"
      } ${
        isActive
          ? "border-transparent bg-cyan-500/10 text-cyan-300 shadow-sm"
          : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
      }`}>
      {ripple}
      <span className={isActive ? "text-cyan-400" : "text-zinc-500"}>{icon}</span>
      <span className="flex-1">{name}</span>
      {showBadge ? (
        <span
          aria-label="Unclaimed reward"
          className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
        />
      ) : (
        isActive && <div className="h-2 w-2 rounded-full bg-cyan-400" />
      )}
    </Link>
  );

  if (!tooltip) return link;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const SidebarActionButton = ({
  icon,
  iconClass = "text-zinc-500",
  label,
  onClick,
}: {
  icon: React.ReactNode;
  iconClass?: string;
  label: string;
  onClick: () => void;
}) => {
  const { createRipple, ripple } = useRipple();
  return (
    <button
      onClick={(e) => {
        createRipple(e);
        onClick();
      }}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] text-zinc-400 hover:bg-white/5 hover:text-zinc-300">
      {ripple}
      <span className={iconClass}>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const SidebarExternalLink = ({
  href,
  icon,
  iconClass = "text-zinc-500",
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  iconClass?: string;
  label: string;
  onClick?: () => void;
}) => {
  const { createRipple, ripple } = useRipple();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        createRipple(e);
        onClick?.();
      }}
      className="relative flex items-center gap-3 overflow-hidden rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] text-zinc-400 hover:bg-white/5 hover:text-zinc-300">
      {ripple}
      <span className={iconClass}>{icon}</span>
      <span>{label}</span>
    </a>
  );
};

const RockSidebar = ({ pageId }: RockSidebarProps) => {
  const { t } = useTranslation("common");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { show: showFeedbackPrompt, markAsDismissed, markAsSent } = useFeedbackPrompt();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);
  const hasUnclaimedMilestone = useHasUnclaimedMilestone();

  const getActiveProfileSection = () => {
    const { pathname } = router;
    if (pathname === "/dashboard" || pathname === "/profile") return "home";
    if (pathname.startsWith("/timer")) return "practice";
    if (pathname.startsWith("/songs")) return "songs";
    if (pathname.startsWith("/profile/activity")) return "progress";
    if (pathname.startsWith("/practice-log")) return "progress";
    if (pathname === "/summary") return "summary";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/seasons")) return "leaderboard";
    if (pathname.startsWith("/arsenal")) return "arsenal";
    if (pathname.startsWith("/plans")) return "library";
    if (pathname.startsWith("/my-exercises")) return "library";
    if (pathname.startsWith("/tab-editor")) return "library";
    if (pathname.startsWith("/favorites")) return "library";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/roadmap")) return "roadmap";
    return null;
  };

  const activeId = getActiveProfileSection();

  const isLinkActive = (id: string | null, href: string) => {
    if (activeId) return activeId === id;
    if (id === pageId && pageId !== null) return true;
    if (href !== "/" && router.pathname === href) return true;
    return false;
  };

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  const mainNavigation = [
    { id: "home", name: "Home", href: "/dashboard", icon: <Home size={18} /> },
    { id: "practice", name: "Practice", href: "/timer", icon: <Timer size={20} />, emphasized: true },
    { id: "songs", name: "Songs", href: "/songs", icon: <Music size={20} />, emphasized: true },
    { id: "progress", name: "Progress", href: "/profile/activity", icon: <Activity size={18} /> },
    {
      id: "summary",
      name: "Milestones",
      href: "/summary",
      icon: <Milestone size={18} />,
      tooltip: "Weekly rewards for hitting practice goals",
    },
    { id: "leaderboard", name: "Leaderboard", href: "/leaderboard", icon: <Trophy size={18} /> },
    { id: "arsenal", name: "Arsenal", href: "/arsenal", icon: <Swords size={18} /> },
  ];

  const libraryNavigation = [
    { id: "library", name: "Library", href: "/favorites", icon: <Library size={18} /> },
  ];

  const otherNavigation = [
    { id: "settings", name: "Settings", href: "/settings", icon: <Settings size={16} /> },
  ];

  const renderNavLinks = (
    items: {
      id: string;
      name: string;
      href: string;
      icon: React.ReactNode;
      tooltip?: string;
      emphasized?: boolean;
    }[],
    onClick?: () => void
  ) =>
    items.map(({ id, name, href, icon, tooltip, emphasized }) => (
      <SidebarNavLink
        key={id}
        href={href}
        name={name}
        icon={icon}
        isActive={isLinkActive(id, href)}
        onClick={onClick}
        showBadge={id === "summary" && hasUnclaimedMilestone}
        tooltip={tooltip}
        emphasized={emphasized}
      />
    ));

  const userProfileSection = (mobile?: boolean) => {
    if (!userStats || !userName) return null;

    if (mobile) {
      return (
        <Link
          href={`/user/${userAuth}`}
          onClick={handleLinkClick}
          className="block border-b border-white/10 p-4 transition-colors duration-200 hover:bg-white/5">
          <div className="flex items-center gap-3">
            <Avatar
              avatarURL={userAvatar}
              name={userName}
              lvl={userStats.lvl}
              selectedGuitar={userInfo?.selectedGuitar}
              guitarYear={userInfo?.selectedGuitarYear}
              guitarCountry={userInfo?.selectedGuitarCountry}
            />
            <div className="min-w-0 flex-1">
              <span className="truncate text-[15px] font-bold text-white tracking-wide">
                {userName}
              </span>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link
        href={`/user/${userAuth}`}
        className="block rounded-lg p-4 transition-colors duration-200 hover:bg-white/5">
        <div className="flex items-center gap-3">
          <Avatar
            avatarURL={userAvatar}
            name={userName}
            lvl={userStats.lvl}
            selectedGuitar={userInfo?.selectedGuitar as number}
            guitarYear={userInfo?.selectedGuitarYear}
            guitarCountry={userInfo?.selectedGuitarCountry}
          />
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <span className="truncate text-[15px] font-bold text-white tracking-wide">
              {userName}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const navContent = (mobile?: boolean) => (
    <nav
      className={`flex flex-1 flex-col overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent ${
        mobile ? "pb-20" : ""
      }`}>
      <div className="space-y-8">
        <div>
          <div className="space-y-1">{renderNavLinks(mainNavigation, mobile ? handleLinkClick : undefined)}</div>
        </div>

        <div>
          <div className="space-y-1">{renderNavLinks(libraryNavigation, mobile ? handleLinkClick : undefined)}</div>
        </div>

        <div className="space-y-1">
          {renderNavLinks(otherNavigation, mobile ? handleLinkClick : undefined)}

          <SidebarActionButton
            icon={<MessageSquarePlus size={16} />}
            label="Send Feedback"
            onClick={() => {
              if (mobile) handleLinkClick();
              setIsFeedbackOpen(true);
            }}
          />

          <SidebarExternalLink
            href="https://discord.gg/6yJmsZW2Ne"
            icon={<FaDiscord size={16} />}
            label={t("nav.discord")}
            onClick={mobile ? handleLinkClick : undefined}
          />
        </div>
      </div>

      <div className="hidden lg:block lg:flex-1" />

      <Link
        href="/roadmap"
        onClick={mobile ? handleLinkClick : undefined}
        className="mt-10 flex items-start gap-3 rounded-xl bg-amber-500/10 p-3 transition-all duration-200 active:scale-[0.98] hover:bg-amber-500/15">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <Map size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-300">Community Roadmap</p>
          <p className="mt-0.5 text-xs leading-snug text-amber-400/60">
            Help build Riff Quest
          </p>
        </div>
      </Link>

      {mobile && (
        <>
          <button
            onClick={() => {
              handleLinkClick();
              dispatch(logUserOff());
            }}
            className="mt-8 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 mb-12">
            <span className="text-zinc-500">
              <LogOut size={16} />
            </span>
            <span>Sign Out</span>
          </button>
        </>
      )}
    </nav>
  );

  return (
    <>
      <MobileBottomNav onMenuClick={() => setIsMobileOpen(true)} />

      {/* Desktop Sidebar */}
      <aside className="hidden h-full bg-card backdrop-blur-xl lg:flex lg:w-64 lg:flex-col">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center">
                <Image src="/images/logolight.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
              </div>
              <h2 className="text-sm font-semibold text-white">Riff Quest</h2>
            </Link>
            <div className="ml-auto">
              <NotificationsBell />
            </div>
          </div>
        </div>

        {userProfileSection()}
        {navContent()}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-[100dvh] w-72 flex-col border-r border-white/10 bg-zinc-900/95 backdrop-blur-xl lg:hidden">
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center">
                    <Image src="/images/logolight.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Riff Quest</h2>
                </Link>
                <div className="flex items-center gap-2">
                  <NotificationsBell />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileOpen(false)}
                    className="text-zinc-400 hover:bg-white/10 hover:text-white">
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {userProfileSection(true)}
              {navContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <FeedbackModal
        variant="prompt"
        isOpen={showFeedbackPrompt}
        onClose={markAsDismissed}
        onSent={markAsSent}
      />
    </>
  );
};

export default RockSidebar;
