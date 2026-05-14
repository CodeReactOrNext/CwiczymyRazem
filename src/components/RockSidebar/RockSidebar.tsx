import { Button } from "assets/components/ui/button";
import { Separator } from "assets/components/ui/separator";
import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";
import { FeedbackModal } from "components/FeedbackBubble";
import { MobileBottomNav } from "components/MobileBottomNav/MobileBottomNav";
import Avatar from "components/UI/Avatar";
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
import { useTranslation } from "hooks/useTranslation";
import {
  Activity,
  BarChart2,
  Calendar,
  Home,
  ListChecks,
  LogOut,
  MessageSquarePlus,
  Music,
  Settings,
  Swords,
  Timer,
  Trophy,
  Video,
  X,
} from "lucide-react";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NavPagesTypes } from "types/layout.types";

import { CommunityModal } from "./CommunityModal";

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

const RockSidebar = ({ pageId }: RockSidebarProps) => {
  const { t } = useTranslation("common");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const { show: showFeedbackPrompt, markAsDismissed, markAsSent } = useFeedbackPrompt();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const userInfo = useAppSelector(selectUserInfo);

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
    if (pathname.startsWith("/arsenal")) return "arsenal";
    if (pathname.startsWith("/recordings")) return "recordings";
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
    { id: "songs", name: "Songs", href: "/songs?view=management", icon: <Music size={18} /> },
    { id: "progress", name: "Progress", href: "/profile/activity", icon: <Activity size={18} /> },
    { id: "seasons", name: "Seasons", href: "/seasons", icon: <Calendar size={18} /> },
    { id: "leaderboard", name: "Leaderboard", href: "/leaderboard", icon: <Trophy size={18} /> },
  ];

  const toolsNavigation = [
    { id: "plans", name: "My Plans", href: "/plans", icon: <ListChecks size={16} /> },
    { id: "arsenal", name: "Guitar Arsenal", href: "/arsenal", icon: <Swords size={16} /> },
    { id: "summary", name: "Summary", href: "/summary", icon: <BarChart2 size={16} /> },
  ];

  const otherNavigation = [
    { id: "recordings", name: "Recordings", href: "/recordings", icon: <Video size={16} /> },
    { id: "settings", name: "Settings", href: "/settings", icon: <Settings size={16} /> },
  ];

  const renderNavLinks = (
    items: { id: string; name: string; href: string; icon: React.ReactNode }[],
    onClick?: () => void
  ) =>
    items.map(({ id, name, href, icon }) => {
      const isActive = isLinkActive(id, href);
      return (
        <Link
          key={id}
          href={href}
          onClick={onClick}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium border transition-all duration-200 ${
            isActive
              ? "border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
              : "border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
          }`}>
          <span className={isActive ? "text-cyan-400" : "text-zinc-500"}>{icon}</span>
          <span className="flex-1">{name}</span>
          {isActive && <div className="h-2 w-2 rounded-full bg-cyan-400" />}
        </Link>
      );
    });

  const renderSectionLabel = (label: string) => (
    <div className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
      {label}
    </div>
  );

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
              <div className="mt-2 flex items-center gap-2">
                <Link
                  href="/settings"
                  onClick={handleLinkClick}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                  title={t("button.edit")}>
                  <Settings size={14} />
                </Link>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                  <CopyLinkProfile mode="icon" />
                </div>
              </div>
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
      className={`flex-1 space-y-6 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent ${
        mobile ? "pb-20" : ""
      }`}>
      <div>
        {renderSectionLabel("Navigation")}
        <div className="space-y-1">{renderNavLinks(mainNavigation, mobile ? handleLinkClick : undefined)}</div>
      </div>

      <Separator className="bg-white/10" />

      <div>
        {renderSectionLabel("Tools")}
        <div className="space-y-1">{renderNavLinks(toolsNavigation, mobile ? handleLinkClick : undefined)}</div>
      </div>

      <Separator className="bg-white/10" />

      <div>
        {renderSectionLabel("Other")}
        <div className="space-y-1">{renderNavLinks(otherNavigation, mobile ? handleLinkClick : undefined)}</div>
      </div>

      <Separator className="bg-white/10" />

      <div>
        {renderSectionLabel("Community")}
        <div className="space-y-1">
          <button
            onClick={() => {
              if (mobile) handleLinkClick();
              setIsFeedbackOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-sm font-medium transition-all duration-200 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300">
            <span className="text-cyan-500">
              <MessageSquarePlus size={16} />
            </span>
            <span>Send Feedback</span>
          </button>

          <a
            href="https://discord.gg/6yJmsZW2Ne"
            target="_blank"
            rel="noopener noreferrer"
            onClick={mobile ? handleLinkClick : undefined}
            className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300">
            <span className="text-zinc-500">
              <FaDiscord size={16} />
            </span>
            <span>{t("nav.discord")}</span>
          </a>

          <button
            onClick={() => {
              if (mobile) handleLinkClick();
              setIsCommunityModalOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300">
            <span className="text-rose-500">
              <Heart size={16} fill="currentColor" />
            </span>
            <span>Grow Riff Quest</span>
          </button>
        </div>
      </div>

      {mobile && (
        <>
          <Separator className="bg-white/10" />
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
      <aside className="hidden h-full border-r border-white/10 bg-card backdrop-blur-xl lg:flex lg:w-64 lg:flex-col">
        <div className="border-b border-white/10 p-4">
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

      <CommunityModal isOpen={isCommunityModalOpen} onClose={() => setIsCommunityModalOpen(false)} />
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
