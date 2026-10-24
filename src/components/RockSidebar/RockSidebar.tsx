import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { FeedbackModal } from "components/FeedbackBubble";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { MobileBottomNav } from "components/MobileBottomNav/MobileBottomNav";
import { ResetClock } from "components/ResetClock/ResetClock";
import {
  MobileMoreSheet,
  type MoreSheetGroup,
  type MoreSheetItem,
} from "components/RockSidebar/MobileMoreSheet";
import Avatar from "components/UI/Avatar";
import { DISCORD_INVITE_URL } from "constants/community";
import { DESKTOP_APP_RELEASES_URL } from "constants/desktopApp";
import { useHasUnclaimedMilestone } from "feature/aiSummary/hooks/useHasUnclaimedMilestone";
import { isFeatureUnlocked } from "feature/levelGate/data/featureUnlocks";
import { CommunityIconButton } from "feature/logsBox/components/CommunityIconButton";
import { NotificationsBell } from "feature/notifications/components/NotificationsBell";
import { userProfileQuery } from "feature/profile/hooks/userProfileQuery";
import { EmailConsentModal } from "feature/settings/components/EmailConsentModal";
import { SupportModal } from "feature/support/components/SupportModal";
import { useSupportTeam } from "feature/supportTeam/hooks/useSupportTeam";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { AnimatePresence, motion } from "framer-motion";
import { useAppVersion } from "hooks/useAppVersion";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useEmailConsentPrompt } from "hooks/useEmailConsentPrompt";
import { useFeedbackPrompt } from "hooks/useFeedbackPrompt";
import { useRipple } from "hooks/useRipple";
import { useSupportPrompt } from "hooks/useSupportPrompt";
import { useTranslation } from "hooks/useTranslation";
import {
  BookOpen,
  CassetteTape,
  ChevronDown,
  Download,
  Flame,
  Heart,
  Home,
  Library,
  LogOut,
  Mic2,
  Route,
  Settings,
  Shield,
  SlidersHorizontal,
  Swords,
  Timer,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaDiscord } from "react-icons/fa6";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NavPagesTypes } from "types/layout.types";

export interface SidebarLinkInterface {
  id: NavPagesTypes;
  name: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
}

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
  const { t } = useTranslation("nav");
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
      className={`relative flex min-h-11 items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-sm font-medium transition-all duration-base active:scale-[0.98] ${
        isActive
          ? "bg-cyan-500/10 text-cyan-300 shadow-sm"
          : muted
            ? "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            : "text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
      }`}>
      {ripple}
      <span
        className={`${NAV_ICON_SLOT} ${isActive ? "text-cyan-400" : "text-zinc-600"}`}>
        {icon}
      </span>
      <span className='flex-1'>{name}</span>
      {(showBadge || isActive) && (
        <span className={NAV_INDICATOR_SLOT}>
          {showBadge ? (
            <span
              aria-label={t("unclaimed_reward")}
              className='h-2 w-2 animate-pulse rounded-full bg-amber-500'
            />
          ) : (
            <span className='h-2 w-2 rounded-full bg-cyan-400' />
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
        <TooltipContent side='right' className='max-w-[200px]'>
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
  tooltip?: string;
}

// Community is the one section without a tab bar of its own, so it is the only
// one that still folds out here. Practice, Songs, Library and Progress land on
// a page that already lists its sub-pages — repeating them here only made the
// sidebar longer.
const COMMUNITY_SUB_NAV: SidebarSubLink[] = [
  {
    id: "community-rankings",
    name: "rankings",
    href: "/seasons",
    icon: <Trophy size={16} />,
  },
  {
    id: "community-challenges",
    name: "challenges",
    href: "/challenges",
    icon: <Flame size={16} />,
    tooltip: "challenges_tooltip",
  },
  {
    id: "community-duels",
    name: "duels",
    href: "/duels",
    icon: <Swords size={16} />,
    tooltip: "duels_tooltip",
  },
  {
    id: "community-recordings",
    name: "recordings",
    href: "/recordings",
    icon: <Mic2 size={16} />,
    tooltip: "recordings_tooltip",
  },
  {
    id: "community-guilds",
    name: "guilds",
    href: "/guilds",
    icon: <Shield size={16} />,
    tooltip: "guilds_tooltip",
  },
];

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
  showBadge = false,
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
  showBadge?: boolean;
}) => {
  const { t } = useTranslation("nav");
  const { createRipple, ripple } = useRipple();

  return (
    <div>
      <div
        className={`relative flex items-center overflow-hidden rounded-lg text-sm font-medium transition-all duration-base ${
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
          className='relative flex min-h-11 flex-1 items-center gap-3 overflow-hidden px-3 py-2 active:scale-[0.98]'>
          {ripple}
          <span
            className={`${NAV_ICON_SLOT} ${isActive ? "text-cyan-400" : "text-zinc-600"}`}>
            {icon}
          </span>
          <span className='flex-1'>{name}</span>
          {showBadge && !isExpanded && (
            <span className={NAV_INDICATOR_SLOT}>
              <span
                aria-label={t("unclaimed_reward")}
                className='h-2 w-2 animate-pulse rounded-full bg-amber-500'
              />
            </span>
          )}
        </Link>
        <button
          type='button'
          aria-label={
            isExpanded
              ? t("collapse_section", { name })
              : t("expand_section", { name })
          }
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.preventDefault();
            onToggle();
          }}
          className='flex min-h-11 min-w-11 items-center justify-center px-3 text-zinc-400 transition-colors duration-base hover:text-zinc-200'>
          <span className={NAV_INDICATOR_SLOT}>
            <ChevronDown
              size={16}
              className={`transition-transform duration-base ${isExpanded ? "rotate-180" : ""}`}
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
            className='overflow-hidden'>
            <div className='mt-1 space-y-0.5 rounded-lg bg-black/20 p-1'>
              {subLinks.map((subLink) => (
                <SidebarNavLink
                  key={subLink.id}
                  href={subLink.href}
                  name={t(subLink.name)}
                  icon={subLink.icon}
                  isActive={isSubLinkActive(subLink.href)}
                  onClick={onLinkClick}
                  tooltip={subLink.tooltip && t(subLink.tooltip)}
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
  const {
    show: showFeedbackPrompt,
    markAsDismissed,
    markAsSent,
  } = useFeedbackPrompt();
  const {
    show: showSupportPrompt,
    markAsDismissed: markSupportAsDismissed,
    markAsDonate: markSupportAsDonate,
  } = useSupportPrompt();
  const emailConsentPrompt = useEmailConsentPrompt();
  const { isElectron } = useElectronWindowControls();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t } = useTranslation("nav");

  // Surfacing it next to the logo makes a stale desktop install (see
  // useUpdateRequiredGate) obvious at a glance instead of hidden.
  const appVersion = useAppVersion();

  const userStats = useAppSelector(selectCurrentUserStats);
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const userAuth = useAppSelector(selectUserAuth);
  const hasUnclaimedMilestone = useHasUnclaimedMilestone();
  const queryClient = useQueryClient();

  // The profile page reads its document on mount; starting that read on hover
  // usually has it in the cache by the time the click lands.
  const prefetchOwnProfile = () => {
    if (userAuth) void queryClient.prefetchQuery(userProfileQuery(userAuth));
  };

  // A page that is still level-locked stays out of the nav instead of showing
  // up with a padlock — a new account sees what it can open today. False until
  // the stats land, so the entry never flashes in for a low-level account.
  const showGuilds = !!userStats && isFeatureUnlocked("guilds", userStats.lvl);

  // The panel is a perk, so the entry only exists for people who funded it.
  const { isSupport } = useSupportTeam();
  const isSupporter = isSupport(userAuth);

  const getActiveProfileSection = () => {
    const { pathname } = router;
    if (pathname === "/dashboard" || pathname === "/profile") return "home";
    if (pathname.startsWith("/timer")) return "practice";
    if (pathname === "/report") return "practice";
    if (pathname.startsWith("/gp-tabs")) return "practice";
    if (pathname.startsWith("/profile/skills")) return "practice";
    if (pathname === "/ai-coach") return "practice";
    if (pathname.startsWith("/scale-tree")) return "practice";
    if (pathname.startsWith("/bosses")) return "practice";
    if (pathname === "/journey") return "journey";
    if (pathname.startsWith("/songs")) return "songs";
    if (pathname.startsWith("/profile/activity")) return "progress";
    if (pathname.startsWith("/profile/achievements")) return "progress";
    if (pathname.startsWith("/practice-log")) return "progress";
    if (pathname.startsWith("/goals")) return "progress";
    if (pathname === "/summary") return "progress";
    if (pathname.startsWith("/challenges")) return "community";
    if (pathname.startsWith("/duels")) return "community";
    if (pathname.startsWith("/leaderboard")) return "community";
    if (pathname.startsWith("/seasons")) return "community";
    if (pathname.startsWith("/guilds")) return "community";
    if (pathname.startsWith("/arsenal")) return "arsenal";
    if (pathname.startsWith("/tone-studio")) return "tone-studio";
    if (pathname.startsWith("/plans")) return "library";
    if (pathname.startsWith("/my-exercises")) return "library";
    if (pathname.startsWith("/my-roadmaps")) return "library";
    if (pathname.startsWith("/tab-editor")) return "library";
    if (pathname.startsWith("/favorites")) return "library";
    if (pathname.startsWith("/rotation")) return "library";
    if (pathname.startsWith("/recordings")) return "community";
    if (pathname.startsWith("/settings")) return "settings";
    if (pathname.startsWith("/roadmap")) return "roadmap";
    if (pathname.startsWith("/supporter")) return "supporter";
    if (pathname.startsWith("/wiki")) return "wiki";
    return null;
  };

  const activeId = getActiveProfileSection();

  // A section auto-expands while you are inside it; a manual toggle overrides that until
  // you navigate into the section again.
  const [expandedOverride, setExpandedOverride] = useState<
    Record<string, boolean>
  >({});
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

  const isSectionExpanded = (id: string) =>
    expandedOverride[id] ?? activeId === id;

  const toggleSection = (id: string) =>
    setExpandedOverride((prev) => ({ ...prev, [id]: !isSectionExpanded(id) }));

  const isSubLinkActive = (href: string) => router.pathname === href;

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
    { id: "home", name: t("home"), href: "/dashboard", icon: <Home size={18} /> },
    {
      id: "practice",
      name: t("practice"),
      href: "/timer",
      icon: <Timer size={18} />,
    },
    // Its own entry rather than one of the practice modes: it is the guided
    // start, and the page new accounts open most after the dashboard.
    {
      id: "journey",
      name: t("learning_path"),
      href: "/journey",
      icon: <Route size={18} />,
    },
    {
      id: "songs",
      name: t("songs"),
      href: "/songs",
      icon: <CassetteTape size={18} />,
    },
    {
      id: "progress",
      name: t("progress"),
      href: "/profile/activity",
      icon: <TrendingUp size={18} />,
      showBadge: hasUnclaimedMilestone,
    },
    {
      id: "library",
      name: t("my_stuff"),
      href: "/favorites",
      icon: <Library size={18} />,
    },
    {
      id: "community",
      name: t("community"),
      href: "/seasons",
      icon: <Users size={18} />,
      children: showGuilds
        ? COMMUNITY_SUB_NAV
        : COMMUNITY_SUB_NAV.filter((link) => link.href !== "/guilds"),
    },
    {
      id: "arsenal",
      name: t("arsenal"),
      href: "/arsenal",
      icon: <Swords size={18} />,
    },
    // Electron-only (window.nativeAmp) — does nothing on the web build.
    ...(isElectron
      ? [
          {
            id: "tone-studio",
            name: t("tone_studio"),
            href: "/tone-studio",
            icon: <SlidersHorizontal size={18} />,
          },
        ]
      : []),
  ];

  const utilityNavigation = [
    // Shown to everyone: without the badge the page explains what supporting
    // buys and how to get it, and hiding the entry left that page unreachable
    // by the only people it was written for.
    {
      id: "supporter",
      name: isSupporter ? t("supporter") : t("support"),
      href: "/supporter",
      icon: <Heart size={18} />,
      muted: true,
      tooltip: isSupporter ? t("supporter_tooltip") : t("support_tooltip"),
    },
    {
      id: "wiki",
      name: t("knowledge_base"),
      href: "/wiki",
      icon: <BookOpen size={18} />,
      muted: true,
      tooltip: t("knowledge_base_tooltip"),
    },
    {
      id: "settings",
      name: t("settings"),
      href: "/settings",
      icon: <Settings size={18} />,
      muted: true,
    },
    {
      id: "discord",
      name: t("discord"),
      href: DISCORD_INVITE_URL,
      icon: <FaDiscord size={18} />,
      muted: true,
      external: true,
      tooltip: t("discord_tooltip"),
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
      showBadge?: boolean;
      children?: SidebarSubLink[];
    }[],
    onClick?: () => void,
  ) =>
    items.map(
      ({
        id,
        name,
        href,
        icon,
        tooltip,
        muted,
        external,
        showBadge,
        children,
      }) => {
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
              showBadge={showBadge}
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
            showBadge={showBadge}
            tooltip={tooltip}
            muted={muted}
            external={external}
          />
        );
      },
    );

  const userProfileSection = () => {
    if (!userStats || !userName) return null;

    return (
      <Link
        href={`/user/${userAuth}`}
        onMouseEnter={prefetchOwnProfile}
        onFocus={prefetchOwnProfile}
        className='block rounded-lg p-4 transition-colors duration-base hover:bg-white/5'>
        <div className='flex items-center gap-3'>
          <Avatar
            avatarURL={userAvatar}
            name={userName}
            size='md'
          />
          <div className='flex min-w-0 flex-1 flex-col justify-center'>
            <span className='truncate text-[15px] font-bold tracking-wide text-white'>
              {userName}
            </span>
          </div>
        </div>
      </Link>
    );
  };

  const navContent = () => (
    <nav className='flex min-h-0 flex-1 flex-col overflow-y-auto p-4 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5'>
      <div className='space-y-8'>
        <div className='space-y-1'>{renderNavLinks(mainNavigation)}</div>

        <div className='space-y-1'>{renderNavLinks(utilityNavigation)}</div>
      </div>

      <div className='flex-1' />

      {/* Sits below the nav on both layouts: reference, not a destination. Kept
          to one quiet line — the detail is a click away rather than a panel the
          nav has to make room for. */}
      <div className='mt-6'>
        <ResetClock />
      </div>

      {!isElectron && (
        <a
          href={DESKTOP_APP_RELEASES_URL}
          target='_blank'
          rel='noreferrer'
          className='relative -mx-4 -mb-4 mt-10 flex items-center gap-3 overflow-hidden bg-orange-500/10 px-7 py-4 transition-all duration-base hover:bg-orange-500/15 active:scale-[0.98]'>
          <GuitarPatternBackground opacity={0.14} scale={0.5} color='#fb923c' />
          <span className='relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400'>
            <Download size={18} />
          </span>
          <div className='relative min-w-0 flex-1'>
            <p className='text-sm font-semibold text-orange-300'>
              {t("get_desktop_app")}
            </p>
          </div>
        </a>
      )}
    </nav>
  );

  // The bottom bar already carries these four.
  const BOTTOM_TAB_IDS = ["home", "practice", "songs", "progress"];

  const toSheetItem = (item: {
    id: string;
    name: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
  }): MoreSheetItem => ({
    id: item.id,
    name: item.name,
    href: item.href,
    icon: item.icon,
    external: item.external,
    isActive: isLinkActive(item.id, item.href),
  });

  const communitySection = mainNavigation.find(
    (item) => item.id === "community",
  );

  // Everything the four tabs do not reach, so no destination is
  // phone-unreachable.
  const moreSheetGroups: MoreSheetGroup[] = [
    {
      id: "places",
      items: mainNavigation
        .filter((item) => !item.children && !BOTTOM_TAB_IDS.includes(item.id))
        .map(toSheetItem),
    },
    ...(communitySection?.children
      ? [
          {
            id: "community",
            title: communitySection.name,
            items: communitySection.children.map(
              (subLink): MoreSheetItem => ({
                id: subLink.id,
                name: t(subLink.name),
                href: subLink.href,
                icon: subLink.icon,
                isActive: isSubLinkActive(subLink.href),
              }),
            ),
          },
        ]
      : []),
    {
      id: "utility",
      items: utilityNavigation.map(toSheetItem),
    },
  ];

  const moreSheetHeader = (
    <div className='flex items-center gap-2'>
      {userStats && userName ? (
        <Link
          href={`/user/${userAuth}`}
          onClick={handleLinkClick}
          onTouchStart={prefetchOwnProfile}
          className='flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg pr-2 transition-colors duration-base hover:bg-white/5'>
          <Avatar
            avatarURL={userAvatar}
            name={userName}
            size='sm'
          />
          <span className='truncate text-[15px] font-bold tracking-wide text-white'>
            {userName}
          </span>
        </Link>
      ) : (
        <div className='flex-1' />
      )}
      <CommunityIconButton onOpen={handleLinkClick} />
      <NotificationsBell />
    </div>
  );

  const moreSheetFooter = (
    <div className='space-y-1'>
      <ResetClock />
      <button
        type='button'
        onClick={() => {
          handleLinkClick();
          dispatch(logUserOff());
        }}
        className='flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-zinc-400 transition-colors duration-base hover:bg-red-500/10 hover:text-red-400'>
        <span className={NAV_ICON_SLOT}>
          <LogOut size={16} />
        </span>
        <span>{t("sign_out")}</span>
      </button>
    </div>
  );

  return (
    <>
      <MobileBottomNav
        isMenuOpen={isMobileOpen}
        onMenuClick={() => setIsMobileOpen((open) => !open)}
        onNavigate={handleLinkClick}
      />

      {/* Desktop Sidebar */}
      <aside className='hidden h-full bg-card backdrop-blur-xl lg:flex lg:w-64 lg:flex-col'>
        <div className='p-4'>
          <div className='flex items-center gap-3'>
            <Link href='/dashboard' className='flex min-h-11 items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center'>
                <Image
                  src='/images/logolight.svg'
                  alt='Logo'
                  width={32}
                  height={32}
                  className='h-8 w-8'
                />
              </div>
              <div className='flex flex-col'>
                <h2 className='text-sm font-semibold text-white'>Riff Quest</h2>
                <span className='flex items-center gap-1.5 text-xs font-medium text-zinc-400'>
                  <span className='text-amber-500/80'>beta</span>
                  {appVersion && <span>v{appVersion}</span>}
                </span>
              </div>
            </Link>
            <div className='ml-auto flex items-center gap-1.5'>
              <CommunityIconButton />
              <NotificationsBell />
            </div>
          </div>
        </div>

        {userProfileSection()}
        {navContent()}
      </aside>

      <MobileMoreSheet
        open={isMobileOpen}
        onOpenChange={setIsMobileOpen}
        header={moreSheetHeader}
        groups={moreSheetGroups}
        footer={moreSheetFooter}
      />

      <EmailConsentModal
        isOpen={emailConsentPrompt.show}
        isNewAccount={emailConsentPrompt.isNewAccount}
        onAnswer={emailConsentPrompt.answer}
        onClose={emailConsentPrompt.close}
      />

      <FeedbackModal
        variant='prompt'
        isOpen={showFeedbackPrompt && !emailConsentPrompt.blocksOtherPrompts}
        onClose={markAsDismissed}
        onSent={markAsSent}
      />

      <SupportModal
        isOpen={showSupportPrompt && !emailConsentPrompt.blocksOtherPrompts}
        onClose={markSupportAsDismissed}
        onDonate={markSupportAsDonate}
      />
    </>
  );
};

export default RockSidebar;
