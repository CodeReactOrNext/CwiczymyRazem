import { Button } from "assets/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { FeedbackModal } from "components/FeedbackBubble";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MobileBottomNav } from "components/MobileBottomNav/MobileBottomNav";
import Avatar from "components/UI/Avatar";
import { DESKTOP_APP_RELEASES_URL } from "constants/desktopApp";
import { useHasUnclaimedMilestone } from "feature/aiSummary/hooks/useHasUnclaimedMilestone";
import { NotificationsBell } from "feature/notifications/components/NotificationsBell";
import { SupportModal } from "feature/support/components/SupportModal";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserInfo,
  selectUserName,
} from "feature/user/store/userSlice";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { AnimatePresence, motion } from "framer-motion";
import { useAppVersion } from "hooks/useAppVersion";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useFeedbackPrompt } from "hooks/useFeedbackPrompt";
import { useRipple } from "hooks/useRipple";
import { useSupportPrompt } from "hooks/useSupportPrompt";
import {
  BookOpen,
  Brain,
  ChevronDown,
  ClipboardList,
  Clock,
  Download,
  Dumbbell,
  FilePlus2,
  Flame,
  Home,
  LayoutDashboard,
  Library,
  ListChecks,
  ListMusic,
  LogOut,
  Mic2,
  Milestone,
  Music2,
  NotebookPen,
  PlusCircle,
  Route,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  Swords,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaArrowTrendUp, FaDiscord } from "react-icons/fa6";
import { PiCassetteTapeLight, PiMagicWandDuotone } from "react-icons/pi";
import { SiGuitarpro } from "react-icons/si";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NavPagesTypes } from "types/layout.types";


export interface SidebarLinkInterface {
  id: NavPagesTypes;
  name: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

const DISCORD_INVITE_URL = "https://discord.com/invite/6yJmsZW2Ne";

/** Fixed-size slot so icons of different sizes keep the labels on one line. */
const NAV_ICON_SLOT = "flex h-5 w-5 shrink-0 items-center justify-center";
/** Same width as the chevron slot, so the dot and the arrow share a center. */
const NAV_INDICATOR_SLOT = "flex w-5 shrink-0 items-center justify-center";

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
  muted = false,
  external = false,
}: {
  href: string;
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  showBadge?: boolean;
  tooltip?: string;
  muted?: boolean;
  external?: boolean;
}) => {
  const { createRipple, ripple } = useRipple();
  const link = (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={(e) => {
        createRipple(e);
        onClick?.();
      }}
      className={`relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
        isActive
          ? "bg-cyan-500/10 text-cyan-300 shadow-sm"
          : muted
          ? "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
          : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
      }`}>
      {ripple}
      <span className={`${NAV_ICON_SLOT} ${isActive ? "text-cyan-400" : "text-zinc-600"}`}>
        {icon}
      </span>
      <span className="flex-1">{name}</span>
      {(showBadge || isActive) && (
        <span className={NAV_INDICATOR_SLOT}>
          {showBadge ? (
            <span
              aria-label="Unclaimed reward"
              className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"
            />
          ) : (
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
          )}
        </span>
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

interface SidebarSubLink {
  id: string;
  name: string;
  href: string;
  icon: React.ReactNode;
}

const PRACTICE_SUB_NAV: SidebarSubLink[] = [
  { id: "practice-plans", name: "Practice Routines", href: "/timer/plans", icon: <ListChecks size={16} /> },
  { id: "practice-auto", name: "Auto Plan", href: "/timer/auto", icon: <PiMagicWandDuotone size={16} /> },
  { id: "practice-free-timer", name: "Free Timer", href: "/timer/practice", icon: <Clock size={16} /> },
  { id: "practice-report", name: "Manual Log", href: "/report", icon: <NotebookPen size={16} /> },
  { id: "practice-gp-tabs", name: "Guitar Pro Files", href: "/gp-tabs", icon: <SiGuitarpro size={16} /> },
  { id: "practice-skills", name: "Skills", href: "/profile/skills?tab=skill-tree", icon: <Brain size={16} /> },
  { id: "practice-exercises", name: "Exercises", href: "/profile/skills?tab=browse", icon: <Dumbbell size={16} /> },
  { id: "practice-roadmaps", name: "Mastery Roadmaps", href: "/ai-coach", icon: <ClipboardList size={16} /> },
  { id: "practice-journey", name: "Learning Path", href: "/journey", icon: <Route size={16} /> },
];

const SONGS_SUB_NAV: SidebarSubLink[] = [
  { id: "songs-board", name: "Board", href: "/songs?view=board", icon: <LayoutDashboard size={16} /> },
  { id: "songs-explore", name: "Explore", href: "/songs?view=explore", icon: <Search size={16} /> },
  { id: "songs-playlists", name: "Playlists", href: "/songs?view=playlists", icon: <ListMusic size={16} /> },
];

const LIBRARY_SUB_NAV: SidebarSubLink[] = [
  { id: "library-favorites", name: "Favorites", href: "/favorites", icon: <Star size={16} /> },
  { id: "library-plans", name: "My Plans", href: "/plans", icon: <ClipboardList size={16} /> },
  { id: "library-exercises", name: "My Exercises", href: "/my-exercises", icon: <Music2 size={16} /> },
  { id: "library-create-plan", name: "Create Plan", href: "/plans/create", icon: <PlusCircle size={16} /> },
  { id: "library-create-exercise", name: "Create Exercise", href: "/tab-editor", icon: <FilePlus2 size={16} /> },
];

/** Views a page falls back to when its query param is absent (bare /songs renders Board). */
const DEFAULT_QUERY_BY_PATH: Record<string, Record<string, string>> = {
  "/songs": { view: "board" },
  "/profile/skills": { tab: "skill-tree" },
};

const SidebarExpandableNavLink = ({
  href,
  name,
  icon,
  isActive,
  isExpanded,
  onToggle,
  onLinkClick,
  subLinks,
  isSubLinkActive,
}: {
  href: string;
  name: string;
  icon: React.ReactNode;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onLinkClick?: () => void;
  subLinks: SidebarSubLink[];
  isSubLinkActive: (href: string) => boolean;
}) => {
  const { createRipple, ripple } = useRipple();

  return (
    <div>
      <div
        className={`relative flex items-center overflow-hidden rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? "bg-cyan-500/10 text-cyan-300 shadow-sm"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
        }`}>
        <Link
          href={href}
          onClick={(e) => {
            createRipple(e);
            onLinkClick?.();
          }}
          className="relative flex flex-1 items-center gap-3 overflow-hidden px-3 py-2.5 active:scale-[0.98]">
          {ripple}
          <span className={`${NAV_ICON_SLOT} ${isActive ? "text-cyan-400" : "text-zinc-600"}`}>
            {icon}
          </span>
          <span className="flex-1">{name}</span>
        </Link>
        <button
          type="button"
          aria-label={isExpanded ? `Collapse ${name}` : `Expand ${name}`}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          className="flex items-center px-3 py-2.5 text-zinc-600 transition-colors duration-200 hover:text-zinc-300">
          <span className={NAV_INDICATOR_SLOT}>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden">
            <div className="mt-1 space-y-0.5 rounded-lg bg-black/20 p-1">
              {subLinks.map((subLink) => (
                <SidebarNavLink
                  key={subLink.id}
                  href={subLink.href}
                  name={subLink.name}
                  icon={subLink.icon}
                  isActive={isSubLinkActive(subLink.href)}
                  onClick={onLinkClick}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RockSidebar = ({ pageId }: RockSidebarProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { show: showFeedbackPrompt, markAsDismissed, markAsSent } = useFeedbackPrompt();
  const {
    show: showSupportPrompt,
    markAsDismissed: markSupportAsDismissed,
    markAsDonate: markSupportAsDonate,
  } = useSupportPrompt();
  const { isElectron } = useElectronWindowControls();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Surfacing it next to the logo makes a stale desktop install (see
  // useUpdateRequiredGate) obvious at a glance instead of hidden.
  const appVersion = useAppVersion();

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
    if (pathname === "/report") return "practice";
    if (pathname.startsWith("/gp-tabs")) return "practice";
    if (pathname.startsWith("/profile/skills")) return "practice";
    if (pathname === "/ai-coach") return "practice";
    if (pathname === "/journey") return "practice";
    if (pathname.startsWith("/songs")) return "songs";
    if (pathname.startsWith("/profile/activity")) return "progress";
    if (pathname.startsWith("/practice-log")) return "progress";
    if (pathname === "/summary") return "summary";
    if (pathname.startsWith("/leaderboard")) return "leaderboard";
    if (pathname.startsWith("/seasons")) return "leaderboard";
    if (pathname.startsWith("/challenges")) return "challenges";
    if (pathname.startsWith("/arsenal")) return "arsenal";
    if (pathname.startsWith("/tone-studio")) return "tone-studio";
    if (pathname.startsWith("/plans")) return "library";
    if (pathname.startsWith("/my-exercises")) return "library";
    if (pathname.startsWith("/tab-editor")) return "library";
    if (pathname.startsWith("/favorites")) return "library";
    if (pathname.startsWith("/recordings")) return "recordings";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/roadmap")) return "roadmap";
    if (pathname.startsWith("/wiki")) return "wiki";
    return null;
  };

  const activeId = getActiveProfileSection();

  // A section auto-expands while you are inside it; a manual toggle overrides that until
  // you navigate into the section again.
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({});
  const [lastActiveId, setLastActiveId] = useState(activeId);

  if (activeId !== lastActiveId) {
    setLastActiveId(activeId);
    if (activeId) {
      setExpandedOverride((prev) => {
        if (!(activeId in prev)) return prev;
        const next = { ...prev };
        delete next[activeId];
        return next;
      });
    }
  }

  const isSectionExpanded = (id: string) => expandedOverride[id] ?? activeId === id;

  const toggleSection = (id: string) =>
    setExpandedOverride((prev) => ({ ...prev, [id]: !isSectionExpanded(id) }));

  const isSubLinkActive = (href: string) => {
    const [path, query] = href.split("?");
    if (router.pathname !== path) return false;
    if (!query) return true;
    const params = new URLSearchParams(query);
    return Array.from(params.entries()).every(
      ([key, value]) => (router.query[key] ?? DEFAULT_QUERY_BY_PATH[path]?.[key]) === value
    );
  };

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
    {
      id: "practice",
      name: "Practice",
      href: "/timer",
      icon: <Timer size={18} />,
      children: PRACTICE_SUB_NAV,
    },
    {
      id: "songs",
      name: "Songs",
      href: "/songs",
      icon: <PiCassetteTapeLight size={18} />,
      children: SONGS_SUB_NAV,
    },
    { id: "progress", name: "Progress", href: "/profile/activity", icon: <FaArrowTrendUp size={18} /> },
    {
      id: "summary",
      name: "Milestones",
      href: "/summary",
      icon: <Milestone size={18} />,
      tooltip: "Weekly rewards for hitting practice goals",
    },
    {
      id: "challenges",
      name: "Challenges",
      href: "/challenges",
      icon: <Flame size={18} />,
      tooltip: "Five community-voted songs to record every month",
    },
    { id: "leaderboard", name: "Rankings", href: "/seasons", icon: <Trophy size={18} /> },
    { id: "arsenal", name: "Arsenal", href: "/arsenal", icon: <Swords size={18} /> },
    // Electron-only (window.nativeAmp) — does nothing on the web build.
    ...(isElectron
      ? [{ id: "tone-studio", name: "Tone Studio", href: "/tone-studio", icon: <SlidersHorizontal size={18} /> }]
      : []),
  ];

  const libraryNavigation = [
    {
      id: "library",
      name: "My Stuff",
      href: "/favorites",
      icon: <Library size={18} />,
      children: LIBRARY_SUB_NAV,
    },
  ];

  const utilityNavigation = [
    { id: "recordings", name: "Recordings", href: "/recordings", icon: <Mic2 size={18} />, muted: true },
    { id: "wiki", name: "Knowledge Base", href: "/wiki", icon: <BookOpen size={18} />, muted: true, tooltip: "How every part of the app works, in plain language" },
    { id: "settings", name: "Settings", href: "/settings", icon: <Settings size={18} />, muted: true },
    {
      id: "discord",
      name: "Discord",
      href: DISCORD_INVITE_URL,
      icon: <FaDiscord size={18} />,
      muted: true,
      external: true,
      tooltip: "Join the community server",
    },
  ];

  const renderNavLinks = (
    items: {
      id: string;
      name: string;
      href: string;
      icon: React.ReactNode;
      tooltip?: string;
      muted?: boolean;
      external?: boolean;
      children?: SidebarSubLink[];
    }[],
    onClick?: () => void
  ) =>
    items.map(({ id, name, href, icon, tooltip, muted, external, children }) => {
      if (children) {
        return (
          <SidebarExpandableNavLink
            key={id}
            href={href}
            name={name}
            icon={icon}
            isActive={isLinkActive(id, href)}
            isExpanded={isSectionExpanded(id)}
            onToggle={() => toggleSection(id)}
            onLinkClick={onClick}
            subLinks={children}
            isSubLinkActive={isSubLinkActive}
          />
        );
      }

      return (
        <SidebarNavLink
          key={id}
          href={href}
          name={name}
          icon={icon}
          isActive={isLinkActive(id, href)}
          onClick={onClick}
          showBadge={id === "summary" && hasUnclaimedMilestone}
          tooltip={tooltip}
          muted={muted}
          external={external}
        />
      );
    });

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
          {renderNavLinks(utilityNavigation, mobile ? handleLinkClick : undefined)}
        </div>
      </div>

      <div className="hidden lg:block lg:flex-1" />

      {!isElectron && !mobile && (
        <a
          href={DESKTOP_APP_RELEASES_URL}
          target="_blank"
          rel="noreferrer"
          className="relative -mx-4 -mb-4 mt-10 flex items-center gap-3 overflow-hidden bg-orange-500/10 px-7 py-4 transition-all duration-200 active:scale-[0.98] hover:bg-orange-500/15">
          <GuitarPatternBackground opacity={0.14} scale={0.5} color="#fb923c" />
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
            <Download size={18} />
          </span>
          <div className="relative min-w-0 flex-1">
            <p className="text-sm font-semibold text-orange-300">Get the desktop app</p>
          </div>
        </a>
      )}

      {mobile && (
        <>
          <button
            onClick={() => {
              handleLinkClick();
              dispatch(logUserOff());
            }}
            className="mt-8 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 mb-12">
            <span className={`${NAV_ICON_SLOT} text-zinc-600`}>
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
              <div className="flex flex-col">
                <h2 className="text-sm font-semibold text-white">Riff Quest</h2>
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600">
                  <span className="text-amber-500/80">beta</span>
                  {appVersion && <span>v{appVersion}</span>}
                </span>
              </div>
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
              className={`fixed left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-zinc-900/95 backdrop-blur-xl lg:hidden ${
                isElectron ? "top-10 h-[calc(100dvh-2.5rem)]" : "top-0 h-[100dvh]"
              }`}>
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center">
                    <Image src="/images/logolight.svg" alt="Logo" width={32} height={32} className="h-8 w-8" />
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-sm font-semibold text-white">Riff Quest</h2>
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-zinc-600">
                      <span className="text-amber-500/80">beta</span>
                      {appVersion && <span>v{appVersion}</span>}
                    </span>
                  </div>
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

      <FeedbackModal
        variant="prompt"
        isOpen={showFeedbackPrompt}
        onClose={markAsDismissed}
        onSent={markAsSent}
      />

      <SupportModal
        isOpen={showSupportPrompt}
        onClose={markSupportAsDismissed}
        onDonate={markSupportAsDonate}
      />
    </>
  );
};

export default RockSidebar;
