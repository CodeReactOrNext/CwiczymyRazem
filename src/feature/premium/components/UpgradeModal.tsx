import { cn } from "assets/lib/utils";
import { auth } from "utils/firebase/client/firebase.utils";
import { getIdToken } from "firebase/auth";
import {
  BookOpen,
  CalendarDays,
  Check,
  ExternalLink,
  FileMusic,
  Loader2,
  Map,
  Shield,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("You need to be logged in");
      return;
    }

    setIsLoading(true);
    try {
      const idToken = await getIdToken(user);
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create checkout session");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
      setIsLoading(false);
    }
  };



  return (
    <div className="flex flex-col gap-6 p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative flex items-center justify-center">
          <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/5" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-violet-500/20 ring-1 ring-white/10">
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">
            Upgrade to Premium
          </h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-zinc-500">
            Unlock the full toolkit and accelerate your guitar journey.
          </p>
        </div>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-xl border bg-zinc-900/60 p-3.5 transition-colors",
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
            <div>
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

      {/* Trust bullets */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 px-2">
        {BULLETS.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
              <Check size={10} className="text-emerald-400" />
            </div>
            <span className="text-[11px] font-medium text-zinc-500">{b}</span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-all hover:bg-emerald-500/10">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl transition-all group-hover:bg-emerald-500/20" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Monthly plan</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-black tracking-tight text-zinc-100">€9.99</span>
              <span className="text-sm font-medium text-zinc-500">/ month</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/20">
              <Check size={10} />
              Cancel anytime
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Redirecting to checkout...
            </>
          ) : (
            <>
              <Zap size={14} />
              Get Premium
              <ExternalLink size={12} className="opacity-60" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 pt-1">
          <Shield size={11} className="text-zinc-600" />
          <p className="text-center text-xs text-zinc-600">
            Secure payment · Cancel anytime
          </p>
        </div>
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
