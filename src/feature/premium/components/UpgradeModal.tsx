import { Check, X } from "lucide-react";
import { useState } from "react";

// ─── Plan definitions ──────────────────────────────────────────────────────────

const FEATURES: { label: string; pro: boolean; master: boolean }[] = [
  { label: "Real-time Note Detection",  pro: true,  master: true  },
  { label: "Practice Plan Creator",     pro: true,  master: true  },
  { label: "Practice Calendar",         pro: true,  master: true  },
  { label: "Guitar Pro File Support",   pro: true,  master: true  },
  { label: "Full Exercise Library",     pro: true,  master: true  },
  { label: "Special Ranks",            pro: true,  master: true  },
  { label: "Skill Roadmaps",           pro: false, master: true  },
  { label: "Daily Practice Insights",  pro: false, master: true  },
  { label: "Weekly Progress Summary",  pro: false, master: true  },
  { label: "Goal-based Analytics",     pro: false, master: true  },
];

const PRICING = {
  pro:    { monthly: "$2.99", yearly: "$24.99" },
  master: { monthly: "$4.99", yearly: "$39.99" },
};

// ─── Shared content ────────────────────────────────────────────────────────────

export function UpgradeContent() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="p-6 sm:p-8 relative overflow-hidden">
      {/* Cyan gradient glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-cyan-500/10 blur-[80px] rounded-full" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      {/* Header + toggle */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">Pricing</p>
          <h2 className="text-2xl font-bold text-white">Choose your plan</h2>
        </div>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <span className={`text-sm font-medium transition-colors ${billing === "monthly" ? "text-white" : "text-zinc-500"}`}>
            Monthly
          </span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            className={`relative h-6 w-11 rounded-full transition-colors ${billing === "yearly" ? "bg-orange-500" : "bg-zinc-700"}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${billing === "yearly" ? "translate-x-5" : "translate-x-0"}`} />
          </button>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-medium transition-colors ${billing === "yearly" ? "text-white" : "text-zinc-500"}`}>
              Yearly
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-orange-400 border border-orange-400/30 rounded px-1.5 py-0.5">
              −30%
            </span>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-zinc-800 rounded-xl overflow-hidden mb-4 ring-1 ring-cyan-500/20">

        {/* Practice Pro */}
        <div className="bg-zinc-900 p-5 flex flex-col">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">🎸 Practice Pro</p>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="text-4xl font-bold text-white tracking-tight">
                {billing === "monthly" ? PRICING.pro.monthly : PRICING.pro.yearly}
              </span>
              <span className="text-zinc-500 text-sm mb-1">
                {billing === "monthly" ? "/ mo" : "/ yr"}
              </span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed mt-2">
              Essential tools to organize and improve your daily guitar practice.
            </p>
          </div>

          <div className="h-px bg-zinc-800 mb-4" />

          <ul className="flex flex-col gap-2.5 flex-1 mb-5">
            {FEATURES.filter(f => f.pro).map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check size={14} className="text-orange-400 shrink-0" />
                <span className="text-sm text-zinc-300">{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              {billing === "yearly" ? "Billed yearly" : "Billed monthly"}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 border border-zinc-700 rounded-lg px-4 py-2">
              Coming Soon
            </span>
          </div>
        </div>

        {/* Practice Master */}
        <div className="bg-zinc-900 p-5 flex flex-col relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />

          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">🏆 Practice Master</p>
              <span className="text-[10px] font-bold uppercase tracking-widest border border-white/20 text-white/60 rounded px-1.5 py-0.5">
                Popular
              </span>
            </div>
            <div className="flex items-end gap-1.5 mb-1">
              <span className="text-4xl font-bold text-white tracking-tight">
                {billing === "monthly" ? PRICING.master.monthly : PRICING.master.yearly}
              </span>
              <span className="text-zinc-500 text-sm mb-1">
                {billing === "monthly" ? "/ mo" : "/ yr"}
              </span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed mt-2">
              Everything in Practice Pro, plus advanced tools to reach your goals faster.
            </p>
          </div>

          <div className="h-px bg-zinc-800 mb-4" />

          <ul className="flex flex-col gap-2.5 flex-1 mb-5">
            {FEATURES.filter(f => f.pro).map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check size={14} className="text-orange-400 shrink-0" />
                <span className="text-sm text-zinc-300">{f.label}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 pt-1">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 shrink-0">Master only</span>
              <div className="h-px flex-1 bg-zinc-800" />
            </li>
            {FEATURES.filter(f => !f.pro).map((f, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <Check size={14} className="text-orange-400 shrink-0" />
                <span className="text-sm text-white font-medium">{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600">
              {billing === "yearly" ? "Billed yearly" : "Billed monthly"}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 border border-zinc-600 rounded-lg px-4 py-2">
              Coming Soon
            </span>
          </div>
        </div>

      </div>

      <p className="text-center text-[10px] text-zinc-700 uppercase tracking-widest font-semibold">
        Cancel Anytime · Secure Payment via Stripe · Instant Access
      </p>
    </div>
  );
}

// ─── Standalone modal ──────────────────────────────────────────────────────────

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-800 hover:text-zinc-300"
        >
          <X size={14} />
        </button>
        <UpgradeContent />
      </div>
    </div>
  );
}
