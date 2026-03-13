import { cn } from "assets/lib/utils";
import { auth } from "utils/firebase/client/firebase.utils";
import {
  BookOpen,
  CalendarDays,
  Check,
  FileMusic,
  Loader2,
  Map,
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

// ─── Checkout helper ───────────────────────────────────────────────────────────

async function startCheckout(plan: "monthly" | "yearly") {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be logged in");
  const idToken = await user.getIdToken();
  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, plan }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Checkout failed");
  window.location.href = data.url;
}

// ─── Shared content ───────────────────────────────────────────────────────────

export function UpgradeContent() {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    setLoading(plan);
    try {
      await startCheckout(plan);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
      setLoading(null);
    }
  };

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
          Upgrade to Premium
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm text-zinc-500">
          Unlock all features and take your practice to the next level.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
        {/* Monthly */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 text-left">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Monthly</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">$4.99<span className="text-sm font-normal text-zinc-500">/mo</span></p>
          </div>
          <button
            onClick={() => handleCheckout("monthly")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading === "monthly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started"}
          </button>
        </div>

        {/* Yearly */}
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-left relative">
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
            Save 18%
          </span>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Yearly</p>
            <p className="mt-1 text-2xl font-bold text-zinc-100">$49<span className="text-sm font-normal text-zinc-500">/yr</span></p>
            <p className="text-xs text-zinc-500">≈ $4.08/mo</p>
          </div>
          <button
            onClick={() => handleCheckout("yearly")}
            disabled={loading !== null}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading === "yearly" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get started"}
          </button>
        </div>
      </div>

      {/* Bullets */}
      <ul className="flex flex-col gap-1.5 w-full mt-1">
        {BULLETS.map((b, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-zinc-500">
            <Check size={12} className="text-emerald-500 shrink-0" />
            {b}
          </li>
        ))}
      </ul>

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
