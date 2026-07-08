import { Ripple } from "components/Ripple/Ripple";
import { HeroPattern } from "components/UI/HeroBanner";
import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserInfo } from "feature/user/store/userSlice";
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Compass,
  Dumbbell,
  History,
  Layers,
  ListChecks,
  Lock,
  Map,
  Music,
  Route,
  Sparkles,
  Users,
} from "lucide-react";
import { useRipple } from "hooks/useRipple";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaClock, FaGuitar } from "react-icons/fa";
import { SiGuitarpro } from "react-icons/si";
import { GiAudioCassette } from "react-icons/gi";
import { PiCassetteTapeLight, PiTreeView, PiMagicWandDuotone } from "react-icons/pi";
import { useAppSelector } from "store/hooks";

const colorMap = {
  sky:     { iconBg: "bg-gradient-to-br from-sky-500/20 to-sky-500/5",     iconBorder: "border border-white/5 border-t-sky-500/40 border-l-sky-500/20", iconText: "text-sky-400",     blur: "bg-sky-500/5",     ring: "group-hover:ring-sky-500/30"     },
  amber:   { iconBg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",   iconBorder: "border border-white/5 border-t-amber-500/40 border-l-amber-500/20", iconText: "text-amber-400",   blur: "bg-amber-500/5",   ring: "group-hover:ring-amber-500/30"   },
  rose:    { iconBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",    iconBorder: "border border-white/5 border-t-rose-500/40 border-l-rose-500/20", iconText: "text-rose-400",    blur: "bg-rose-500/5",    ring: "group-hover:ring-rose-500/30"    },
  emerald: { iconBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5", iconBorder: "border border-white/5 border-t-emerald-500/40 border-l-emerald-500/20", iconText: "text-emerald-400", blur: "bg-emerald-500/5", ring: "group-hover:ring-emerald-500/30" },
  cyan:    { iconBg: "bg-gradient-to-br from-cyan-500/20 to-cyan-500/5",    iconBorder: "border border-white/5 border-t-cyan-500/40 border-l-cyan-500/20", iconText: "text-cyan-400",    blur: "bg-cyan-500/5",    ring: "group-hover:ring-cyan-500/30"    },
  violet:  { iconBg: "bg-gradient-to-br from-violet-500/20 to-violet-500/5",  iconBorder: "border border-white/5 border-t-violet-500/40 border-l-violet-500/20", iconText: "text-violet-400",  blur: "bg-violet-500/5",  ring: "group-hover:ring-violet-500/30"  },
  indigo:  { iconBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",  iconBorder: "border border-white/5 border-t-indigo-500/40 border-l-indigo-500/20", iconText: "text-indigo-400",  blur: "bg-indigo-500/5",  ring: "group-hover:ring-indigo-500/30"  },
} as const;

type ColorKey = keyof typeof colorMap;

interface ModeLink {
  label: string;
  onClick: () => void;
}

interface ModeCardProps {
  Icon: React.ElementType;
  title: string;
  description: string;
  ck: ColorKey;
  loading: boolean;
  locked?: boolean;
  lockLabel?: string;
  hero?: boolean;
  links?: ModeLink[];
  onActivate: () => void;
}

const ModeCard = ({
  Icon,
  title,
  description,
  ck,
  loading,
  locked,
  lockLabel,
  hero,
  links,
  onActivate,
}: ModeCardProps) => {
  const c = colorMap[ck];
  const { createRipple, ripple } = useRipple("bg-white/15");
  const interactive = lockLabel !== "Soon" && !locked;

  return (
    <div
      className={`group relative flex gap-3 overflow-hidden rounded-lg transition-all duration-300 ${
        hero || (links && links.length > 0) ? "items-start" : "items-center"
      } ${
        hero
          ? "bg-white/[0.03] p-[18px] backdrop-blur-md border border-white/[0.02]"
          : "bg-white/[0.02] p-3.5 backdrop-blur-sm"
      } ${
        lockLabel === "Soon"
          ? "cursor-default grayscale opacity-50"
          : locked
            ? "opacity-60 cursor-default"
            : `cursor-pointer ${hero ? "hover:bg-white/[0.08]" : "hover:bg-white/[0.06]"} hover:shadow-2xl hover:shadow-black/20`
      }`}
      onClick={(e) => {
        if (lockLabel === "Soon") return;
        if (interactive || locked) createRipple(e);
        if (!loading) onActivate();
      }}
      tabIndex={0}
      role="button"
    >
      {ripple}
      <div className={`flex flex-shrink-0 items-center justify-center rounded-lg ${c.iconBg} ${c.iconBorder} ${hero ? "h-14 w-14 transition-all duration-500" : "h-12 w-12 transition-all duration-300"} group-hover:scale-105 shadow-lg`}>
        {loading
          ? <div className={`${hero ? "h-7 w-7" : "h-6 w-6"} animate-spin rounded-full border-[3px] border-white border-t-transparent`} />
          : <Icon className={`${hero ? "h-7 w-7 drop-shadow-md" : "h-6 w-6"} ${c.iconText} transition-colors duration-300`} />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className={hero ? "truncate text-[16px] font-black text-white tracking-wide" : "truncate text-[14px] font-bold text-zinc-100 group-hover:text-white transition-colors"}>{title}</h3>
          {locked && (
            <div className={`flex items-center gap-1 rounded-full bg-amber-500/10 ${hero ? "px-2.5" : "px-2"} py-0.5 ring-1 ring-amber-500/20`}>
              <Lock className="h-2.5 w-2.5 text-amber-500/80" />
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">{lockLabel}</span>
            </div>
          )}
        </div>
        <p className={hero ? "text-[13px] text-zinc-400 font-medium leading-relaxed" : "truncate text-[12px] text-zinc-500 group-hover:text-zinc-400 transition-colors"}>{description}</p>
        {links && links.length > 0 && (
          <div className="relative z-10 mt-3 flex flex-col gap-0.5">
            {links.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  link.onClick();
                }}
                className="group/link relative flex min-h-[40px] items-center justify-between overflow-hidden rounded-lg px-3 py-2.5 text-left text-[12px] font-semibold text-zinc-400 transition-all duration-200 hover:bg-white/[0.06] hover:text-white active:scale-[0.98] active:bg-white/[0.1]"
              >
                <Ripple className="bg-white/20" />
                <span>{link.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-zinc-600 transition-all group-hover/link:translate-x-0.5 group-hover/link:text-zinc-300" />
              </button>
            ))}
          </div>
        )}
      </div>
      {!locked && (
        <div className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/0 transition-all duration-300 ${hero ? "ml-2" : ""}`}>
          <ArrowRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-1 group-hover:text-zinc-200" />
        </div>
      )}
    </div>
  );
};

export const PracticeModeSelector = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";
  const isMaster  = userInfo?.role === "master" || userInfo?.role === "admin";

  const [loadingMode, setLoadingMode]       = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasLastSession, setHasLastSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasLastSession(!!localStorage.getItem("cw.lastSession"));
  }, []);

  const nav = (href: string, id: string, locked?: boolean) => {
    if (locked) { setShowUpgradeModal(true); return; }
    setLoadingMode(id);
    router.push(href);
  };

  const listItem = (
    id: string,
    Icon: React.ElementType,
    title: string,
    description: string,
    href: string,
    ck: ColorKey,
    locked?: boolean,
    lockLabel?: string,
  ) => {
    return (
      <ModeCard
        Icon={Icon}
        title={title}
        description={description}
        ck={ck}
        loading={loadingMode === id}
        locked={locked}
        lockLabel={lockLabel}
        onActivate={() => nav(href, id, locked)}
      />
    );
  };

  const heroListItem = (
    id: string,
    Icon: React.ElementType,
    title: string,
    description: string,
    href: string,
    ck: ColorKey,
    locked?: boolean,
    lockLabel?: string,
    links?: { label: string; href: string }[],
  ) => {
    return (
      <ModeCard
        hero
        Icon={Icon}
        title={title}
        description={description}
        ck={ck}
        loading={loadingMode === id}
        locked={locked}
        lockLabel={lockLabel}
        links={links?.map((link) => ({
          label: link.label,
          onClick: () => nav(link.href, `${id}:${link.label}`, locked),
        }))}
        onActivate={() => nav(href, id, locked)}
      />
    );
  };

  return (
    <>
      <div className="relative mb-8 w-full">
        <HeroPattern
          className="opacity-[0.04]"
          maskImage="linear-gradient(to bottom, black 0%, black 20%, transparent 80%)"
        />
        <div className="font-openSans container relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-12">
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Practice</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {hasLastSession && heroListItem("resume", History, "Resume Last", "Continue playing where you left off", "/timer/practice", "indigo")}
                {heroListItem("routine",  ListChecks,    "Practice Routines", "Follow daily guided routine",   "/timer/plans",   "indigo", false, undefined, [
                  { label: "Routines",   href: "/timer/plans?tab=routines" },
                  { label: "Playalongs", href: "/timer/plans?tab=playalongs" },
                  { label: "My Plans",   href: "/timer/plans?tab=my_plans" },
                  { label: "Community",  href: "/timer/plans?tab=community" },
                ])}
                {heroListItem("song",      PiCassetteTapeLight,    "Songs",      "Track practice time for your repertoire", "/timer/song-select",  "indigo", false, undefined, [
                  { label: "Practice", href: "/timer/song-select" },
                  { label: "My Board", href: "/songs?view=board" },
                ])}
                {heroListItem("log",     ClipboardList, "Log Practice", "Manually log a custom practice session",  "/report",         "indigo", false, undefined, [
                  { label: "Manual Log", href: "/report" },
                  { label: "Free Timer", href: "/timer/practice" },
                ])}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-4">Learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("journey",  Route,      "Learning Path", "Step-by-step progress",   "/journey",       "rose")}
                {listItem("roadmap", Map, "Mastery Roadmaps", "Goal-based practice roadmaps", "/ai-coach", "rose", !isMaster, "Master")}
                {listItem("scales", PiTreeView, "Scale Map", "Interactive scale fretboard tree", "/scale-tree", "rose")}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-4">Discover</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("skills",    Brain,    "Skills", "Specific skill focus",         "/profile/skills",     "emerald")}
                {listItem("exercises", Dumbbell, "Exercises",  "Full exercise library",             "/profile/skills?tab=browse",  "emerald")}
                {listItem("community-exercises", Users, "Community Exercises", "Exercises shared by the community", "/profile/skills?tab=community", "emerald")}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-4">Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {listItem("smart", PiMagicWandDuotone, "Auto plan", "Automatically generated session", "/timer/auto", "amber", !isMaster, "Master")}
                {listItem("gp",     SiGuitarpro, "GP file", "Practice GP files", "/gp-tabs", "amber", !isPremium, "Premium")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};

