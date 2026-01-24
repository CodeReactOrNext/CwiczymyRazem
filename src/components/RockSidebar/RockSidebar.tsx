import { Button } from "assets/components/ui/button";
import { Separator } from "assets/components/ui/separator";
import { cn } from "assets/lib/utils";
import { CopyLinkProfile } from "components/CopyLinkProfile/CopyLinkProfile";
import { MobileBottomNav } from "components/MobileBottomNav/MobileBottomNav";
import { PWASidebarItem } from "components/PWA/PWASidebarItem";
import Avatar from "components/UI/Avatar";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";
import {
  selectCurrentUserStats,
  selectUserAvatar,
  selectUserInfo,
  selectUserName,
} from "feature/user/store/userSlice";
import { AnimatePresence,motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import {
  Activity,
  BookOpen,
  Brain,
  Calendar,
  Coffee,
  Dumbbell,
  FileText,
  Flame,
  LayoutGrid,
  Music,
  Settings,
  Timer,
  Trophy,
  User,
  X,
  Video,
} from "lucide-react";
import { Heart, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import type { NavPagesTypes } from "types/layout.types";
import { getPointsToLvlUp } from "utils/gameLogic/getPointsToLvlUp";

import { CommunityModal } from "./CommunityModal";
import { NotificationsBell } from "feature/notifications/components/NotificationsBell";

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

export const RockSidebar = ({  pageId }: RockSidebarProps) => {
  const { t } = useTranslation("common");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const router = useRouter();

  // User data
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const userInfo = useAppSelector(selectUserInfo);

 
  // Get current route to determine active profile section
  const getActiveProfileSection = () => {
    const { pathname, query } = router;
    if (pathname === "/dashboard" || pathname === "/profile") return "profile";
    if (pathname.startsWith("/profile/activity")) return "activity";
    if (pathname.startsWith("/profile/skills")) return "skills";
    if (pathname.startsWith("/profile/exercises")) return "exercises";
    if (pathname.startsWith("/songs")) {
      const view = query.view || "library";
      if (view === "library") return "library";
      if (view === "management") return "my_songs";
      return "library";
    }
    if (pathname.startsWith("/timer/challenges")) return "challenges";
    if (pathname === "/timer") return "timer";
    if (pathname.startsWith("/report")) return "report";
    if (pathname.startsWith("/guide")) return "guide";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/seasons")) return "seasons";
    if (pathname.startsWith("/settings")) return "settings";
    return null;
  };

  const activeId = getActiveProfileSection();

  const isLinkActive = (id: string | null, href: string) => {
    // 1. If we have a specific active item identified, strictly match it
    if (activeId) {
        return activeId === id;
    }
    
    // 2. Fallback to pageId passed from layout (for pages without explicit mapping)
    if (id === pageId && pageId !== null) return true;

    // 3. Final fallback: simple path check (avoiding root)
    if (href !== "/" && router.pathname === href) return true;
    
    return false;
  };

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  // Main navigation structure
  const mainNavigation = [
    {
      id: "profile" as NavPagesTypes,
      name: "Profile",
      href: "/dashboard",
      icon: <User size={18} />,
    },
    {
      id: "activity",
      name: "Activity",
      href: "/profile/activity",
      icon: <Activity size={16} />,
    },
    {
      id: "skills",
      name: "Skills",
      href: "/profile/skills",
      icon: <Brain size={16} />,
    },
    {
      id: "leaderboard" as NavPagesTypes,
      name: "Leaderboard",
      href: "/leaderboard",
      icon: <Trophy size={16} />,
    },
    {
      id: "seasons" as NavPagesTypes,
      name: "Seasons",
      href: "/seasons",
      icon: <Calendar size={16} />,
    },
  ];

  const practiceSections = [
    {
      id: "timer" as NavPagesTypes,
      name: "Practice",
      href: "/timer",
      icon: <Timer size={18} />,
    },
    {
      id: "exercises",
      name: "Exercises",
      href: "/profile/exercises",
      icon: <Dumbbell size={16} />,
    },
    {
      id: "challenges" as NavPagesTypes,
      name: "Challenges",
      href: "/timer/challenges",
      icon: <Flame size={18} />,
    },
    {
      id: "report" as NavPagesTypes,
      name: "Reports",
      href: "/report",
      icon: <FileText size={18} />,
    },
  ];

  const songsSections = [
    {
      id: "library" as NavPagesTypes,
      name: "Library",
      href: "/songs?view=library",
      icon: <Music size={16} />,
    },
    {
      id: "my_songs" as NavPagesTypes,
      name: "My Songs",
      href: "/songs?view=management",
      icon: <LayoutGrid size={16} />,
    },
    {
      id: "recordings" as NavPagesTypes,
      name: "Recordings",
      href: "/recordings",
      icon: <Video size={16} />,
    },
  ];

  const otherSections = [
    {
      id: "guide" as NavPagesTypes,
      name: "Guide",
      href: "/guide",
      icon: <BookOpen size={16} />,
    },
    {
      id: "settings" as NavPagesTypes,
      name: "Settings",
      href: "/settings",
      icon: <Settings size={16} />,
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onMenuClick={() => setIsMobileOpen(true)} />

      {/* Desktop Sidebar */}
      <aside className='hidden h-full border-r border-white/10 bg-card backdrop-blur-xl lg:flex lg:w-64 lg:flex-col'>
        {/* Brand Header */}
        <div className='border-b border-white/10 p-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center'>
              <Image
                src='/images/logolight.svg'
                alt='Logo'
                width={32}
                height={32}
                className='h-8 w-8'
              />
            </div>
            <div>
              <h2 className='text-sm font-semibold text-white'>
                Rifff Quest
              </h2>
            </div>
            <div className='ml-auto'>
                <NotificationsBell />
            </div>
          </div>
        </div>

        {/* User Profile Section */}
        {userStats && userName && (() => {
          const currentLvlPoints = getPointsToLvlUp(userStats.lvl - 1);
          const nextLvlPoints = getPointsToLvlUp(userStats.lvl);
          const pointsInCurrentLvl = userStats.points - currentLvlPoints;
          const pointsNeededForNextLvl = nextLvlPoints - currentLvlPoints;
          const progress = Math.min(Math.max((pointsInCurrentLvl / pointsNeededForNextLvl) * 100, 0), 100);

          return (
            <div className='p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      <Avatar
                        avatarURL={userAvatar}
                        name={userName}
                        lvl={userStats.lvl}
                        selectedFrame={userInfo?.selectedFrame}
                        selectedGuitar={userInfo?.selectedGuitar}
                      />
                    </div>


                <div className='min-w-0 flex-1'>
                  <span className='truncate text-sm font-semibold text-white'>
                    {userName}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold text-zinc-400">LVL {userStats.lvl}</span>
                  </div>
                </div>
              </div>

              {/* Enhanced XP Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Progress</span>
                  <span className="text-[10px] font-bold text-cyan-400">{Math.floor(userStats.points)} / {nextLvlPoints} XP</span>
                </div>
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Navigation */}
        <nav className='flex-1 space-y-6 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent'>
          {/* Main Navigation */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Main
            </div>
            <div className='space-y-1'>
              {mainNavigation.map(({ id, name, href, icon }) => {
                const isActive = isLinkActive(id, href);
                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    }`}>
                    <span
                      className={isActive ? "text-cyan-400" : "text-zinc-500"}>
                      {icon}
                    </span>
                    <span className="flex-1">{name}</span>
                    {isActive && (
                      <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator className='bg-white/10' />

          {/* Practice Section */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Practice
            </div>
            <div className='space-y-1'>
              {practiceSections.map(({ id, name, href, icon }) => {
                const isActive = isLinkActive(id, href);
                const isChallenges = id === 'challenges';
                const activeChallengesCount = userStats?.activeChallenges?.length || 0;
                const today = new Date().toISOString().split('T')[0];
                const doneTodayCount = userStats?.activeChallenges?.filter(ac => ac.lastCompletedDate === today).length || 0;

                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    }`}>
                    <span
                      className={isActive ? "text-cyan-400" : "text-zinc-500"}>
                      {icon}
                    </span>
                    <span className="flex-1">{name}</span>
                    
                    {isChallenges && activeChallengesCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded",
                          doneTodayCount === activeChallengesCount ? "bg-emerald-500/20 text-emerald-400" : "bg-main/20 text-main"
                        )}>
                          {doneTodayCount}/{activeChallengesCount}
                        </span>
                      </div>
                    )}

                    {isActive && !isChallenges && (
                      <div className='h-2 w-2 rounded-full bg-cyan-400'></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator className='bg-white/10' />

          {/* Songs Section */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Songs
            </div>
            <div className='space-y-1'>
              {songsSections.map(({ id, name, href, icon }) => {
                const isActive = isLinkActive(id, href);
                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    }`}>
                    <span
                      className={
                        isActive ? "text-cyan-400" : "text-zinc-500"
                      }>
                      {icon}
                    </span>
                    <span>{name}</span>
                    {isActive && (
                      <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator className='bg-white/10' />

          {/* Other Section */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Other
            </div>
            <div className='space-y-1'>
              {otherSections.map(({ id, name, href, icon }) => {
                const isActive = isLinkActive(id, href);
                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    }`}>
                    <span
                      className={isActive ? "text-cyan-400" : "text-zinc-500"}>
                      {icon}
                    </span>
                    <span>{name}</span>
                    {isActive && (
                      <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <Separator className='bg-white/10' />

          {/* Community Section */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Community
            </div>
            <div className='space-y-1'>
              <a
                href='https://buymeacoffee.com/riffquest'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'>
                <span className='text-amber-500'>
                  <Coffee size={16} />
                </span>
                <span>Buy Me a Coffee</span>
              </a>
              <a
                href='https://discord.gg/6yJmsZW2Ne'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'>
                <span className='text-zinc-500'>
                  <FaDiscord size={16} />
                </span>
                <span>{t("nav.discord")}</span>
              </a>
              <button
                onClick={() => setIsCommunityModalOpen(true)}
                className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'>
                <span className='text-rose-500'>
                  <Heart size={16} fill="currentColor" />
                </span>
                <span>Grow Riff Quest</span>
              </button>

            </div>
          </div>

          <PWASidebarItem />
        </nav>
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
              className='fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden'
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className='fixed left-0 top-0 z-50 flex h-[100dvh] w-72 flex-col border-r border-white/10 bg-zinc-900/95 backdrop-blur-xl lg:hidden'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-white/10 p-4'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-9 w-9 items-center justify-center'>
                    <Image
                      src='/images/logolight.svg'
                      alt='Logo'
                      width={32}
                      height={32}
                      className='h-8 w-8'
                    />
                  </div>
                  <div>
                    <h2 className='text-sm font-semibold text-white'>
                      Rifff Quest
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <NotificationsBell />
                    <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => setIsMobileOpen(false)}
                    className='text-zinc-400 hover:bg-white/10 hover:text-white'>
                    <X size={16} />
                    </Button>
                </div>
              </div>

              {/* User Profile Section - Mobile */}
              {userStats && userName && (() => {
                const currentLvlPoints = getPointsToLvlUp(userStats.lvl - 1);
                const nextLvlPoints = getPointsToLvlUp(userStats.lvl);
                const pointsInCurrentLvl = userStats.points - currentLvlPoints;
                const pointsNeededForNextLvl = nextLvlPoints - currentLvlPoints;
                const progress = Math.min(Math.max((pointsInCurrentLvl / pointsNeededForNextLvl) * 100, 0), 100);

                return (
                  <div className='border-b border-white/10 p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='relative'>
                        <Avatar
                          avatarURL={userAvatar}
                          name={userName}
                          lvl={userStats.lvl}
                          selectedFrame={userInfo?.selectedFrame}
                          selectedGuitar={userInfo?.selectedGuitar}
                        />
                      </div>

                      <div className='min-w-0 flex-1'>
                        <span className='truncate text-sm font-semibold text-white'>
                          {userName}
                        </span>
                        <div className='mt-2 flex items-center gap-2'>
                          <Link 
                            href="/settings" 
                            onClick={handleLinkClick}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                            title={t("button.edit")}
                          >
                            <Settings size={14} />
                          </Link>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white">
                            <CopyLinkProfile mode="icon" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar - Mobile */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Level Progress</span>
                        <span className="text-[10px] font-bold text-cyan-400">{Math.floor(userStats.points)} / {nextLvlPoints} XP</span>
                      </div>
                      <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute inset-y-0 left-0 bg-cyan-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Navigation - Mobile */}
              <nav className='flex-1 space-y-6 overflow-y-auto p-4 pb-20 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent'>
                {/* Main Navigation */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Main
                  </div>
                  <div className='space-y-1'>
                    {mainNavigation.map(({ id, name, href, icon }) => {
                      const isActive = isLinkActive(id, href);
                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}>
                          <span
                            className={
                              isActive ? "text-cyan-400" : "text-zinc-500"
                            }>
                            {icon}
                          </span>
                          <span>{name}</span>
                          {isActive && (
                            <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <Separator className='bg-white/10' />

                {/* Practice Section - Mobile */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Practice
                  </div>
                  <div className='space-y-1'>
                    {practiceSections.map(({ id, name, href, icon }) => {
                      const isActive = isLinkActive(id, href);
                      const isChallenges = id === 'challenges';
                      const activeChallengesCount = userStats?.activeChallenges?.length || 0;
                      const today = new Date().toISOString().split('T')[0];
                      const doneTodayCount = userStats?.activeChallenges?.filter(ac => ac.lastCompletedDate === today).length || 0;

                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}>
                          <span
                            className={
                              isActive
                                ? "text-cyan-400"
                                : "text-zinc-500"
                            }>
                            {icon}
                          </span>
                          <span className="flex-1">{name}</span>
                          
                          {isChallenges && activeChallengesCount > 0 && (
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "text-[9px] font-black px-1.5 py-0.5 rounded",
                                doneTodayCount === activeChallengesCount ? "bg-emerald-500/20 text-emerald-400" : "bg-main/20 text-main"
                              )}>
                                {doneTodayCount}/{activeChallengesCount}
                              </span>
                            </div>
                          )}

                          {isActive && !isChallenges && (
                            <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <Separator className='bg-white/10' />

                {/* Songs Section - Mobile */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Songs
                  </div>
                  <div className='space-y-1'>
                    {songsSections.map(({ id, name, href, icon }) => {
                      const isActive = isLinkActive(id, href);
                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}>
                          <span
                            className={
                              isActive
                                ? "text-cyan-400"
                                : "text-zinc-500"
                            }>
                            {icon}
                          </span>
                          <span>{name}</span>
                          {isActive && (
                            <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <Separator className='bg-white/10' />

                {/* Other Section */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Other
                  </div>
                  <div className='space-y-1'>
                    {otherSections.map(({ id, name, href, icon }) => {
                      const isActive = isLinkActive(id, href);
                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}>
                          <span
                            className={
                              isActive ? "text-cyan-400" : "text-zinc-500"
                            }>
                            {icon}
                          </span>
                          <span>{name}</span>
                          {isActive && (
                            <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <Separator className='bg-white/10' />

                {/* Community Section - Mobile */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Community
                  </div>
                  <div className='space-y-1'>
                    <a
                      href='https://buymeacoffee.com/riffquest'
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={handleLinkClick}
                      className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'>
                      <span className='text-amber-500'>
                        <Coffee size={16} />
                      </span>
                      <span>Buy Me a Coffee</span>
                    </a>
                    <a
                      href='https://discord.gg/6yJmsZW2Ne'
                      target='_blank'
                      rel='noopener noreferrer'
                      onClick={handleLinkClick}
                      className='flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'>
                      <span className='text-zinc-500'>
                        <FaDiscord size={16} />
                      </span>
                      <span>{t("nav.discord")}</span>
                    </a>
                    <button
                      onClick={() => {
                        handleLinkClick();
                        setIsCommunityModalOpen(true);
                      }}
                      className='flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-white/5 hover:text-zinc-300'>
                      <span className='text-rose-500'>
                        <Heart size={16} fill="currentColor" />
                      </span>
                      <span>Grow Riff Quest</span>
                    </button>
                  </div>
                </div>

                <PWASidebarItem />
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CommunityModal 
        isOpen={isCommunityModalOpen} 
        onClose={() => setIsCommunityModalOpen(false)} 
      />
    </>
  );
};

export default RockSidebar;
