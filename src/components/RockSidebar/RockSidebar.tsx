import { Button } from "assets/components/ui/button";
import { Separator } from "assets/components/ui/separator";
import { FeedbackModal } from "components/FeedbackBubble";
import { MobileBottomNav } from "components/MobileBottomNav/MobileBottomNav";
import Avatar from "components/UI/Avatar";
import { useHasUnclaimedMilestone } from "feature/aiSummary/hooks/useHasUnclaimedMilestone";
import { NotificationsBell } from "feature/notifications/components/NotificationsBell";
import {
  selectCurrentUserStats,
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
  Calendar,
  Heart,
  Home,
  ListChecks,
  LogOut,
  Map,
  Medal,
  MessageSquarePlus,
  Milestone,
  Music,
  Music2,
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
}: {
  href: string;
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  showBadge?: boolean;
}) => {
  const { createRipple, ripple } = useRipple();
  return (
    <Link
      href={href}
      onClick={(e) => {
        createRipple(e);
        onClick?.();
      }}
      className={`relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium border transition-all duration-200 active:scale-[0.98] ${
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
  const hasUnclaimedMilestone = useHasUnclaimedMilestone();

  const getActiveProfileSection = () => {
    const { pathname } = router;
    if (pathname === "/dashboard" || pathname === "/profile") return "home";
    if (pathname.startsWith("/timer")) return "practice";
    if (pathname.startsWith("/songs")) return "songs";
    if (pathname.startsWith("/profile/activity")) return "progress";
    if (pathname.startsWith("/seasons")) return "seasons";
    
    // Secondary matches
    if (pathname === "/summary") return "summary";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/plans")) return "plans";
    if (pathname.startsWith("/favorites")) return "favorites";
    if (pathname.startsWith("/arsenal")) return "arsenal";
    if (pathname.startsWith("/recordings")) return "recordings";
    if (pathname.startsWith("/scoring")) return "scoring";
    if (pathname.startsWith("/my-exercises")) return "my-exercises";
    if (pathname.startsWith("/tab-editor")) return "my-exercises";
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
    { id: "practice", name: "Practice", href: "/timer", icon: <Timer size={18} /> },
    { id: "songs", name: "Songs", href: "/songs", icon: <Music size={18} /> },
    { id: "progress", name: "Progress", href: "/profile/activity", icon: <Activity size={18} /> },
    { id: "seasons", name: "Seasons", href: "/seasons", icon: <Calendar size={18} /> },
    { id: "leaderboard", name: "Leaderboard", href: "/leaderboard", icon: <Trophy size={18} /> },
  ];

  const toolsNavigation = [
    { id: "plans", name: "My Plans", href: "/plans", icon: <ListChecks size={16} /> },
    { id: "my-exercises", name: "My Exercises", href: "/my-exercises", icon: <Music2 size={16} /> },
    { id: "favorites", name: "Favorites", href: "/favorites", icon: <Heart size={16} /> },
    { id: "arsenal", name: "Guitar Arsenal", href: "/arsenal", icon: <Swords size={16} /> },
    { id: "summary", name: "Milestones", href: "/summary", icon: <Milestone size={16} /> },
  ];

  const otherNavigation = [
    { id: "scoring", name: "How Points Work", href: "/scoring", icon: <Medal size={16} /> },
    { id: "settings", name: "Settings", href: "/settings", icon: <Settings size={16} /> },
  ];

  const renderNavLinks = (
    items: { id: string; name: string; href: string; icon: React.ReactNode }[],
    onClick?: () => void
  ) =>
    items.map(({ id, name, href, icon }) => (
      <SidebarNavLink
        key={id}
        href={href}
        name={name}
        icon={icon}
        isActive={isLinkActive(id, href)}
        onClick={onClick}
        showBadge={id === "summary" && hasUnclaimedMilestone}
      />
    ));

  const userProfileSection = (mobile?: boolean) => {
    if (!userStats || !userName) return null;

    if (mobile) {
      return (
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar
              avatarURL={userAvatar}
              name={userName}
              lvl={userStats.lvl}
              selectedFrame={userInfo?.selectedFrame}
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
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar
            avatarURL={userAvatar}
            name={userName}
            lvl={userStats.lvl}
            selectedFrame={userInfo?.selectedFrame}
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
      </div>
    );
  };

  const navContent = (mobile?: boolean) => (
    <nav
      className={`flex flex-1 flex-col overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent ${
        mobile ? "pb-20" : ""
      }`}>
      <div className="space-y-6">
        <div>
          <div className="space-y-1">{renderNavLinks(mainNavigation, mobile ? handleLinkClick : undefined)}</div>
        </div>

        <Separator className="bg-white/10" />

        <div>
          <div className="space-y-1">{renderNavLinks(toolsNavigation, mobile ? handleLinkClick : undefined)}</div>
        </div>

        <Separator className="bg-white/10" />

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
          <p className="text-sm font-semibold text-amber-300">Help build Riff Quest</p>
          <p className="mt-0.5 text-xs leading-snug text-amber-400/60">
            See what your support unlocks
          </p>
        </div>
      </Link>

      {mobile && (
        <>
          <Separator className="my-6 bg-white/10" />
          <button
            onClick={() => {
              handleLinkClick();
              dispatch(logUserOff());
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 mb-12">
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
            <div className="flex h-9 w-9 items-center justify-center">
              <Image src="/images/logolight.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Riff Quest</h2>
            </div>
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
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center">
                    <Image src="/images/logolight.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Riff Quest</h2>
                  </div>
                </div>
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
