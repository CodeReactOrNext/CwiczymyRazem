import { motion, AnimatePresence } from "framer-motion";
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

import type { NavPagesTypes } from "wrappers/AuthLayoutWrapper";

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

  // Get current route to determine active profile section
  const getActiveProfileSection = () => {
    if (router.pathname === "/profile") return "overview";
    if (router.pathname === "/profile/activity") return "activity";
    if (router.pathname === "/profile/skills") return "skills";
    if (router.pathname === "/profile/exercises") return "exercises";
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
      name: "Profil",
      href: "/profile",
      icon: <User size={18} />,
    },
    {
      id: "timer" as NavPagesTypes,
      name: "Ćwicz",
      href: "/timer",
      icon: <Timer size={18} />,
    },
    {
      id: "report" as NavPagesTypes,
      name: "Raporty",
      href: "/report",
      icon: <FileText size={18} />,
    },
  ];

  // Profile subsections
  const profileSections = [
    {
      id: "overview",
      name: "Przegląd",
      href: "/profile",
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: "activity",
      name: "Aktywność",
      href: "/profile/activity",
      icon: <Activity size={16} />,
    },
    {
      id: "skills",
      name: "Umiejętności",
      href: "/profile/skills",
      icon: <Brain size={16} />,
    },
    {
      id: "exercises",
      name: "Ćwiczenia",
      href: "/profile/exercises",
      icon: <Dumbbell size={16} />,
    },
    {
      id: "songs" as NavPagesTypes,
      name: "Utwory",
      href: "/songs",
      icon: <Music size={16} />,
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
      name: "Sezony",
      href: "/seasons",
      icon: <Calendar size={16} />,
    },
    {
      id: "settings" as NavPagesTypes,
      name: "Ustawienia",
      href: "/settings",
      icon: <Settings size={16} />,
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button - Minimalist */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className='fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900/90 backdrop-blur-sm transition-all duration-200 hover:bg-zinc-800 lg:hidden'>
        <Menu size={18} className='text-white/80' />
      </button>

      {/* Desktop Sidebar - Clean & Minimal */}
      <aside className='hidden h-full border-r border-zinc-800 bg-zinc-900 lg:flex lg:w-64 lg:flex-col'>
        {/* Logo Section - Simplified */}
        <div className='border-b border-zinc-800 p-5'>
          <div className='flex items-center gap-3'>
            <Guitar size={18} className='text-white/60' />
            <span className='text-base font-medium text-white'>
              Ćwiczymy Razem
            </span>
          </div>
        </div>

        {/* User Profile Section */}
        {userStats && userName && (
          <div className='border-b border-zinc-800 p-4'>
            <div className='flex items-center gap-3'>
              {/* Avatar */}
              <div className='flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600/20 to-red-500/20'>
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className='h-8 w-8 rounded-md object-cover'
                  />
                ) : (
                  <User size={16} className='text-red-400' />
                )}
              </div>

              {/* User Info */}
              <div className='min-w-0 flex-1'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm font-medium text-white'>
                    {userName}
                  </span>
                  <Guitar size={12} className='flex-shrink-0 text-red-400' />
                </div>
                <div className='flex items-center gap-1 text-xs text-zinc-400'>
                  <span>Level {userStats.lvl || 100}</span>
                  <span>•</span>
                  <span>{userStats.points || 2659} practiced</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className='flex-1 p-4'>
          {/* Main Navigation */}
          <div className='mb-6'>
            <ul className='space-y-1'>
              {mainNavigation.map(({ id, name, href, icon }) => {
                const isActive = id === pageId;
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                      }`}>
                      {icon}
                      <span>{name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Separator */}
          <div className='mb-4 h-px bg-zinc-800'></div>

          {/* Profile Section */}
          <div className='mb-6'>
            <div className='mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Profil
            </div>
            <ul className='space-y-1'>
              {profileSections.map(({ id, name, href, icon }) => {
                const isActiveSection =
                  activeProfileSection === id ||
                  (id === "songs" && pageId === "songs");
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        isActiveSection
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                      }`}>
                      {icon}
                      <span>{name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Separator */}
          <div className='mb-4 h-px bg-zinc-800'></div>

          {/* Other Section */}
          <div>
            <div className='mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
              Inne
            </div>
            <ul className='space-y-1'>
              {otherSections.map(({ id, name, href, icon }) => {
                const isActive = id === pageId;
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                        isActive
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                      }`}>
                      {icon}
                      <span>{name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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
              className='fixed inset-0 z-40 bg-black/50 lg:hidden'
            />

            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className='fixed left-0 top-0 z-50 h-full w-72 border-r border-zinc-800 bg-zinc-900 lg:hidden'>
              {/* Header */}
              <div className='flex items-center justify-between border-b border-zinc-800 p-4'>
                <div className='flex items-center gap-2'>
                  <Guitar size={16} className='text-white/60' />
                  <span className='text-sm font-medium text-white'>
                    Ćwiczymy Razem
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className='flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white'>
                  <X size={16} />
                </button>
              </div>

              {/* User Profile Section - Mobile */}
              {userStats && userName && (
                <div className='border-b border-zinc-800 p-4'>
                  <div className='flex items-center gap-3'>
                    {/* Avatar */}
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-gradient-to-br from-red-600/20 to-red-500/20'>
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt={userName}
                          className='h-8 w-8 rounded-md object-cover'
                        />
                      ) : (
                        <User size={16} className='text-red-400' />
                      )}
                    </div>

                    {/* User Info */}
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate text-sm font-medium text-white'>
                          {userName}
                        </span>
                        <Guitar
                          size={12}
                          className='flex-shrink-0 text-red-400'
                        />
                      </div>
                      <div className='flex items-center gap-1 text-xs text-zinc-400'>
                        <span>Level {userStats.lvl || 100}</span>
                        <span>•</span>
                        <span>{userStats.points || 2659} practiced</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className='flex-1 p-4'>
                {/* Main Navigation */}
                <div className='mb-6'>
                  <ul className='space-y-1'>
                    {mainNavigation.map(({ id, name, href, icon }) => {
                      const isActive = id === pageId;
                      return (
                        <li key={id}>
                          <Link
                            href={href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                              isActive
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                            }`}>
                            {icon}
                            <span>{name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Separator */}
                <div className='mb-4 h-px bg-zinc-800'></div>

                {/* Profile Section */}
                <div className='mb-6'>
                  <div className='mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Profil
                  </div>
                  <ul className='space-y-1'>
                    {profileSections.map(({ id, name, href, icon }) => {
                      const isActiveSection =
                        activeProfileSection === id ||
                        (id === "songs" && pageId === "songs");
                      return (
                        <li key={id}>
                          <Link
                            href={href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                              isActiveSection
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                            }`}>
                            {icon}
                            <span>{name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Separator */}
                <div className='mb-4 h-px bg-zinc-800'></div>

                {/* Other Section */}
                <div>
                  <div className='mb-2 px-2 text-xs font-medium uppercase tracking-wide text-zinc-500'>
                    Inne
                  </div>
                  <ul className='space-y-1'>
                    {otherSections.map(({ id, name, href, icon }) => {
                      const isActive = id === pageId;
                      return (
                        <li key={id}>
                          <Link
                            href={href}
                            onClick={handleLinkClick}
                            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                              isActive
                                ? "bg-zinc-800 text-white"
                                : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300"
                            }`}>
                            {icon}
                            <span>{name}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
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
