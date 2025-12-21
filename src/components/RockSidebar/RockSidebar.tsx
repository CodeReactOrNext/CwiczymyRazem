import { motion, AnimatePresence } from "framer-motion";
import { Button } from "assets/components/ui/button";
import { Badge } from "assets/components/ui/badge";
import { Separator } from "assets/components/ui/separator";
import Image from "next/image";
import {
  User,
  Music,
  Trophy,
  Timer,
  FileText,
  X,
  Menu,
  Guitar,
  LayoutDashboard,
  Activity,
  Brain,
  Dumbbell,
  Settings,
  Calendar,
  Home,
  Code,
  LayoutGrid,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";
import {
  selectCurrentUserStats,
  selectUserName,
  selectUserAvatar,
} from "feature/user/store/userSlice";
import { IMG_RANKS_NUMBER } from "constants/gameSettings";

import Avatar from "components/UI/Avatar";
import { NavPagesTypes } from "types/layout.types";

export interface SidebarLinkInterface {
  id: NavPagesTypes;
  name: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

interface RockSidebarProps {
  links: SidebarLinkInterface[];
  pageId: NavPagesTypes;
}

export const RockSidebar = ({ links, pageId }: RockSidebarProps) => {
  const { t } = useTranslation("common");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const router = useRouter();

  // User data
  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

  // Get rank image path
  const getRankImgPath = (lvl: number) => {
    if (lvl >= IMG_RANKS_NUMBER) {
      return IMG_RANKS_NUMBER;
    }
    return lvl;
  };

  // Get current route to determine active profile section
  const getActiveProfileSection = () => {
    if (router.pathname === "/profile") return "overview";
    if (router.pathname === "/profile/activity") return "activity";
    if (router.pathname === "/profile/skills") return "skills";
    if (router.pathname === "/profile/exercises") return "exercises";
    if (router.pathname.startsWith("/songs")) {
      const view = router.query.view;
      if (view === "library") return "library";
      if (view === "management") return "my_songs";
      return "songs";
    }
    return null;
  };

  const activeProfileSection = getActiveProfileSection();

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
      id: "timer" as NavPagesTypes,
      name: "Practice",
      href: "/timer",
      icon: <Timer size={18} />,
    },
    {
      id: "report" as NavPagesTypes,
      name: "Reports",
      href: "/report",
      icon: <FileText size={18} />,
    },
  ];

  // Profile subsections
  const profileSections = [
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
      id: "exercises",
      name: "Exercises",
      href: "/profile/exercises",
      icon: <Dumbbell size={16} />,
    },
  ];

  // Songs Section
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
  ];

  // Other sections
  const otherSections = [
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
    {
      id: "settings" as NavPagesTypes,
      name: "Settings",
      href: "/settings",
      icon: <Settings size={16} />,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      <Button
        variant='outline'
        size='icon'
        onClick={() => setIsMobileOpen(true)}
        className='fixed left-4 top-4 z-[60] border-white/20 bg-card text-white backdrop-blur-sm hover:bg-zinc-800 lg:hidden'>
        <Menu size={18} />
      </Button>

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
          </div>
        </div>

        {/* User Profile Section */}
        {userStats && userName && (
          <div className='border-b border-white/10 p-4'>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <div className='rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 p-1'>
                  <Avatar
                    avatarURL={userAvatar}
                    name={userName}
                    lvl={userStats.lvl}
                  />
                </div>
              </div>

              <div className='min-w-0 flex-1'>
                <span className='truncate text-sm font-semibold text-white'>
                  {userName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className='flex-1 space-y-6 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent'>
          {/* Main Navigation */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Main
            </div>
            <div className='space-y-1'>
              {mainNavigation.map(({ id, name, href, icon }) => {
                const isActive = id === pageId;
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

          {/* Profile Section */}
          <div>
            <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Profile
            </div>
            <div className='space-y-1'>
              {profileSections.map(({ id, name, href, icon }) => {
                const isActiveSection = activeProfileSection === id;
                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActiveSection
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    }`}>
                    <span
                      className={
                        isActiveSection ? "text-cyan-400" : "text-zinc-500"
                      }>
                      {icon}
                    </span>
                    <span>{name}</span>
                    {isActiveSection && (
                      <div className='ml-auto h-2 w-2 rounded-full bg-cyan-400'></div>
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
                const isActiveSection = activeProfileSection === id;
                return (
                  <Link
                    key={id}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActiveSection
                        ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                        : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                    }`}>
                    <span
                      className={
                        isActiveSection ? "text-cyan-400" : "text-zinc-500"
                      }>
                      {icon}
                    </span>
                    <span>{name}</span>
                    {isActiveSection && (
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
                const isActive = id === pageId;
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
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => setIsMobileOpen(false)}
                  className='text-zinc-400 hover:bg-white/10 hover:text-white'>
                  <X size={16} />
                </Button>
              </div>

              {/* User Profile Section - Mobile */}
              {userStats && userName && (
                <div className='border-b border-white/10 p-4'>
                  <div className='flex items-center gap-3'>
                    <div className='relative'>
                      <div className='rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 p-1'>
                        <Avatar
                          avatarURL={userAvatar}
                          name={userName}
                          lvl={userStats.lvl}
                        />
                      </div>
                    </div>

                    <div className='min-w-0 flex-1'>
                      <span className='truncate text-sm font-semibold text-white'>
                        {userName}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation - Mobile */}
              <nav className='flex-1 space-y-6 overflow-y-auto p-4 min-h-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent'>
                {/* Main Navigation */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Main
                  </div>
                  <div className='space-y-1'>
                    {mainNavigation.map(({ id, name, href, icon }) => {
                      const isActive = id === pageId;
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

                {/* Profile Section */}
                <div>
                  <div className='mb-3 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Profile
                  </div>
                  <div className='space-y-1'>
                    {profileSections.map(({ id, name, href, icon }) => {
                      const isActiveSection =
                        activeProfileSection === id ||
                        (id === "library" && activeProfileSection === "library") ||
                        (id === "my_songs" && activeProfileSection === "my_songs");
                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActiveSection
                              ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}>
                          <span
                            className={
                              isActiveSection
                                ? "text-cyan-400"
                                : "text-zinc-500"
                            }>
                            {icon}
                          </span>
                          <span>{name}</span>
                          {isActiveSection && (
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
                      const isActiveSection = activeProfileSection === id;
                      return (
                        <Link
                          key={id}
                          href={href}
                          onClick={handleLinkClick}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActiveSection
                              ? "border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 shadow-sm"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                          }`}>
                          <span
                            className={
                              isActiveSection
                                ? "text-cyan-400"
                                : "text-zinc-500"
                            }>
                            {icon}
                          </span>
                          <span>{name}</span>
                          {isActiveSection && (
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
                      const isActive = id === pageId;
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
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default RockSidebar;
