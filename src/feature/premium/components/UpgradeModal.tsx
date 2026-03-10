import { cn } from "assets/lib/utils";
import {
  BookOpen,
  CalendarDays,
  FileMusic,
  Map,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";

// ─── Feature list ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <FileMusic size={15} />,
    title: "Tablature Viewer",
    desc: "Open .gp5, .gpx & .gp files and practice with an interactive score — playback, tempo control, loop sections. Save them to your profile for quick access.",
    iconBg: "bg-cyan-500/10",
    iconText: "text-cyan-400",
    accent: "border-cyan-500/20",
  },
  {
    icon: <CalendarDays size={15} />,
    title: "Daily & Weekly AI Ratings",
    desc: "Get AI-powered scores and feedback on every practice session — daily highlights and weekly progress reports.",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-400",
    accent: "border-emerald-500/20",
  },
  {
    icon: <Map size={15} />,
    title: "Roadmap",
    desc: "Generate a personalized guitar learning roadmap tailored to your goals and current skill level.",
    iconBg: "bg-violet-500/10",
    iconText: "text-violet-400",
    accent: "border-violet-500/20",
  },
  {
    icon: <BookOpen size={15} />,
    title: "Premium Exercises & Plans",
    desc: "Unlock exclusive exercise packs and structured training plans built by professional guitarists.",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-400",
    accent: "border-amber-500/20",
  },
  {
    icon: <Star size={15} />,
    title: "Session Rating",
    desc: "Receive an AI score and actionable tips after each exercise session to improve faster.",
    iconBg: "bg-rose-500/10",
    iconText: "text-rose-400",
    accent: "border-rose-500/20",
  },
  {
    icon: <Zap size={15} />,
    title: "Arcade Mode",
    desc: "Play along to tabs and earn points in real time — your microphone listens and scores every note you hit.",
    iconBg: "bg-orange-500/10",
    iconText: "text-orange-400",
    accent: "border-orange-500/20",
  },
];

const BULLETS = [
  "Cancel anytime — no long-term commitment",
  "Secure payment via Stripe",
  "Instant access after payment",
];

// ─── Shared content ───────────────────────────────────────────────────────────

export function UpgradeContent() {
  return (
    <div className="flex flex-col items-center gap-4 p-8 sm:p-12 text-center">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/5" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 ring-1 ring-white/10">
          <Sparkles className="h-6 w-6 text-emerald-400" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">
          Premium — Coming Soon
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
          We&apos;re working on premium plans. Stay tuned for updates!
        </p>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-zinc-900/60 p-3.5",
              f.accent
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                f.iconBg,
                f.iconText
              )}
            >
              {f.icon}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold leading-tight text-zinc-200">
                {f.title}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-zinc-500">
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Standalone modal ─────────────────────────────────────────────────────────

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
        <UpgradeContent />
      </div>
    </div>
  );
}
