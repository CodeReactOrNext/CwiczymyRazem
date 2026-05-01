import { UpgradeModal } from "feature/premium/components/UpgradeModal";
import { selectUserInfo } from "feature/user/store/userSlice";
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Dumbbell,
  History,
  ListChecks,
  Lock,
  Map,
  Music,
  Route,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { FaClock, FaGuitar, FaList } from "react-icons/fa";
import { useAppSelector } from "store/hooks";

const colorMap = {
  sky:     { iconBg: "bg-sky-800/30",     iconText: "text-sky-400/90",     blur: "bg-sky-700/15",     ring: "hover:ring-sky-700/30"     },
  amber:   { iconBg: "bg-amber-800/30",   iconText: "text-amber-400/90",   blur: "bg-amber-700/15",   ring: "hover:ring-amber-700/30"   },
  rose:    { iconBg: "bg-rose-800/30",    iconText: "text-rose-400/90",    blur: "bg-rose-700/15",    ring: "hover:ring-rose-700/30"    },
  emerald: { iconBg: "bg-emerald-800/30", iconText: "text-emerald-400/90", blur: "bg-emerald-700/15", ring: "hover:ring-emerald-700/30" },
  cyan:    { iconBg: "bg-cyan-800/30",    iconText: "text-cyan-400/90",    blur: "bg-cyan-700/15",    ring: "hover:ring-cyan-700/30"    },
  violet:  { iconBg: "bg-violet-800/30",  iconText: "text-violet-400/90",  blur: "bg-violet-700/15",  ring: "hover:ring-violet-700/30"  },
  indigo:  { iconBg: "bg-indigo-800/30",  iconText: "text-indigo-400/90",  blur: "bg-indigo-700/15",  ring: "hover:ring-indigo-700/30"  },
} as const;

type ColorKey = keyof typeof colorMap;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{children}</span>
    <div className="h-px flex-1 bg-white/5" />
  </div>
);

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

  const card = (
    id: string,
    Icon: React.ElementType,
    title: string,
    description: string,
    href: string,
    ck: ColorKey,
    locked?: boolean,
    lockLabel?: string,
  ) => {
    const c = colorMap[ck];
    const loading = loadingMode === id;
    return (
      <div
        className={`relative flex flex-col overflow-hidden rounded-xl border border-second-400/10 bg-gradient-to-br from-second-500 via-second-500/95 to-second-600 p-4 sm:p-5 shadow-md transition-all duration-300 ${locked ? "cursor-default opacity-70" : `cursor-pointer hover:ring-2 hover:shadow-lg ${c.ring}`}`}
        onClick={() => !loading && nav(href, id, locked)}
        tabIndex={0}
        role="button"
        aria-label={title}
        onKeyDown={(e) => e.key === "Enter" && !loading && nav(href, id, locked)}
      >
        <div className={`${c.blur} pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-2xl`} />

        {locked && lockLabel && (
          <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 ring-1 ring-amber-500/30">
            <Lock className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{lockLabel}</span>
          </div>
        )}

        <div className="relative z-10 flex items-start gap-3">
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${c.iconBg} backdrop-blur-sm`}>
            {loading
              ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : <Icon className={`h-4 w-4 ${c.iconText}`} />
            }
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{description}</p>
          </div>
        </div>
      </div>
    );
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
    const c = colorMap[ck];
    const loading = loadingMode === id;
    return (
      <div
        className={`group relative flex items-center gap-4 rounded-xl border border-transparent p-3 transition-all duration-200 ${locked ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-white/[0.03] hover:border-white/5"}`}
        onClick={() => !loading && nav(href, id, locked)}
        onKeyDown={(e) => e.key === "Enter" && !loading && nav(href, id, locked)}
        tabIndex={0}
        role="button"
      >
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${c.iconBg} backdrop-blur-sm transition-all duration-300 group-hover:scale-105`}>
          {loading
            ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : <Icon className={`h-5 w-5 ${c.iconText}`} />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">{title}</h3>
            {locked && (
              <div className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 ring-1 ring-amber-500/20">
                <Lock className="h-2.5 w-2.5 text-amber-500/80" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/80">{lockLabel}</span>
              </div>
            )}
          </div>
          <p className="truncate text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{description}</p>
        </div>
        {!locked && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/0 transition-all group-hover:bg-white/5">
            <ArrowRight className="h-4 w-4 text-zinc-700 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-400" />
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mb-8 w-full">
        <div className="font-openSans container mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8">
          <div className="space-y-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {card("routine",  FaList,     "Daily Routine", "Follow your guided routine",   "/timer/plans",   "indigo")}
              {card("song",      Music,    "Songs",      "Practice songs from library", "/timer/song-select",  "rose")}
              {card("log",     ClipboardList, "Log Practice", "Manually log your session",  "/report",         "emerald")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 pt-4">
              {/* Left Column: Tools & Session Modes */}
              <div className="space-y-1">
                {listItem("smart", Sparkles, "Auto plan", "Automatically generated session", "/timer/auto", "violet", !isMaster, "Master")}
                {listItem("roadmap", Map, "Roadmaps", "AI-powered learning paths", "/ai-coach", "cyan", !isMaster, "Master")}
                {listItem("finder", Sparkles, "Practice Finder", "AI suggestions", "/practice-finder", "rose", !isMaster, "Master")}
                {listItem("timer",  FaClock,  "Free Timer", "Practice with a timer", "/timer/practice", "sky")}
                {hasLastSession && listItem("resume", History, "Resume Last", "Continue playing", "/timer/practice", "cyan")}
              </div>

              {/* Right Column: Development & Content */}
              <div className="space-y-1">
                {listItem("journey",  Route,      "Learning Path", "Step-by-step progress",   "/journey",       "amber")}
                {listItem("skills",    Brain,    "Skills", "Specific skill focus",         "/profile/skills",     "rose")}
                {listItem("exercises", Dumbbell, "Exercises",  "Full exercise library",             "/profile/skills?tab=browse",  "indigo")}
                {listItem("gp",     FaGuitar, "GP file", "Practice GP files", "/gp-tabs", "amber", !isPremium, "Premium")}
              </div>
            </div>

          </div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </>
  );
};




