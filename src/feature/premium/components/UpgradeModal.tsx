import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { selectUserInfo } from "feature/user/store/userSlice";
import { Check, Crown,Loader2, X, Zap } from "lucide-react";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import { auth } from "utils/firebase/client/firebase.utils";

// ─── Plan definitions ──────────────────────────────────────────────────────────

const FEATURES: { label: string; pro: boolean; master: boolean }[] = [
  { label: "Practice Plan Creator",                                 pro: true,  master: true  },
  { label: "Guitar Pro File Support",                               pro: true,  master: true  },
  { label: `${exercisesAgregat.length}+ Exercises to Practice`,    pro: true,  master: true  },
  { label: `${defaultPlans.length} Ready-made Practice Plans`,     pro: true,  master: true  },
  { label: "Auto Practice Generator",                               pro: false, master: true  },
  { label: "AI-guided Practice Sessions",                           pro: false, master: true  },
  { label: "Skill Roadmaps",                                        pro: false, master: true  },
  { label: "Practice Finder",                                        pro: false, master: true  },
  { label: "Daily Practice Insights",                               pro: false, master: true  },
  { label: "Weekly Progress Summary",                               pro: false, master: true  },
  { label: "Goal-based Analytics",                                  pro: false, master: true  },
];

const PRICING = {
  pro:    { monthly: "€1.99", yearly: "€19.99" },
  master: { monthly: "€3.99", yearly: "€39.99" },
};

// ─── Shared content ────────────────────────────────────────────────────────────
  
export function UpgradeContent() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState<"pro" | "master" | "pro-trial" | "master-trial" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const userInfo = useAppSelector(selectUserInfo);
  const isPro = userInfo?.role === "pro";

  async function handleCheckout(plan: "pro" | "master", trial = false) {
    setLoading(trial ? `${plan}-trial` : plan);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const idToken = await user.getIdToken();
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, plan, billing, trial }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(
          data.error === "Trial already used"
            ? "You've already used your free trial."
            : data.error ?? "Something went wrong. Please try again."
        );
        setLoading(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  async function handleUpgrade() {
    setLoading("master");
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        window.location.href = "/login";
        return;
      }
      const idToken = await user.getIdToken();
      const res = await fetch("/api/stripe/upgrade-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, billing }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(null);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="p-6 sm:p-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full opacity-50" />
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

      <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 relative z-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-500/80 mb-2">Membership</p>
          <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            {isPro ? "Upgrade to Master" : "Choose your plan"}
          </h2>
          {isPro && (
            <p className="text-sm text-zinc-400 mt-2">
              You&apos;re currently on <span className="text-orange-400 font-semibold">Practice Pro</span>.
            </p>
          )}
        </div>

        <div className="flex flex-col items-start md:items-end gap-3">
          <div className="flex items-center gap-3 bg-zinc-900/50 p-1.5 rounded-md backdrop-blur-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${billing === "monthly" ? "bg-zinc-800 text-white shadow-lg" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-2 ${billing === "yearly" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Yearly
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold">-30%</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`grid gap-6 relative z-10 ${isPro ? "grid-cols-1 max-w-xl mx-auto" : "grid-cols-1 lg:grid-cols-2"}`}>
        {!isPro && (
          <div className="group relative flex flex-col rounded-md bg-zinc-900/40 p-8 transition-all hover:bg-zinc-900/60">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-orange-500/10 mb-6">
                <Zap size={14} className="text-orange-400" fill="currentColor" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">Practice Pro</span>
              </div>
              
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-semibold text-white tracking-tighter">
                  {billing === "monthly" ? PRICING.pro.monthly : PRICING.pro.yearly}
                </span>
                <span className="text-zinc-500 text-sm font-semibold">
                  {billing === "monthly" ? "/mo" : "/yr"}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-4 leading-relaxed font-medium">
                Essential tools to organize and improve your daily guitar practice.
              </p>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent mb-8" />

            <ul className="flex flex-col gap-4 flex-1 mb-10">
              {FEATURES.filter(f => f.pro).map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded bg-orange-500/10 flex items-center justify-center">
                    <Check size={12} className="text-orange-400" strokeWidth={2} />
                  </div>
                  <span className="text-sm text-zinc-300 font-medium">{f.label}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleCheckout("pro")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-zinc-800 hover:bg-zinc-700 py-4 rounded-md transition-all disabled:opacity-50"
            >
              {loading === "pro" ? <Loader2 size={18} className="animate-spin" /> : <span className="flex items-center gap-2">Get Pro <Zap size={14} fill="currentColor" /></span>}
            </button>
          </div>
        )}

        <div className="relative group flex flex-col rounded-md bg-zinc-900 p-8 shadow-2xl shadow-amber-950/20 overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="bg-amber-500 text-black text-[10px] font-semibold px-3 py-1 rounded uppercase tracking-widest shadow-lg shadow-amber-500/20">
               Best Value
             </div>
          </div>
          
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="mb-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500/10 mb-6">
              <Crown size={14} className="text-amber-500" fill="currentColor" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">Practice Master</span>
            </div>
            
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-semibold text-white tracking-tighter">
                {billing === "monthly" ? PRICING.master.monthly : PRICING.master.yearly}
              </span>
              <span className="text-zinc-500 text-sm font-semibold">
                {billing === "monthly" ? "/mo" : "/yr"}
              </span>
            </div>
            <p className="text-sm text-zinc-300 mt-4 leading-relaxed font-medium">
              {isPro
                ? "Unlock Auto Practice Generator, AI Sessions, Skill Roadmaps and more."
                : "Everything in Practice Pro, plus advanced tools to reach your goals faster."}
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent mb-8 relative z-10" />

          <ul className="flex flex-col gap-4 flex-1 mb-10 relative z-10">
            {isPro ? (
              FEATURES.filter(f => !f.pro).map((f, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center">
                    <Check size={12} className="text-amber-500" strokeWidth={2} />
                  </div>
                  <span className="text-sm text-white font-semibold">{f.label}</span>
                </li>
              ))
            ) : (
              <>
                {FEATURES.filter(f => f.pro).map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded bg-amber-500/10 flex items-center justify-center opacity-60">
                      <Check size={12} className="text-amber-500" strokeWidth={2} />
                    </div>
                    <span className="text-sm text-zinc-400 font-medium">{f.label}</span>
                  </li>
                ))}
                <li className="flex items-center gap-4 py-2">
                  <div className="h-px flex-1 bg-amber-500/10" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-500/60">Master exclusive</span>
                  <div className="h-px flex-1 bg-amber-500/10" />
                </li>
                {FEATURES.filter(f => !f.pro).map((f, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center shadow-sm">
                      <Check size={12} className="text-amber-500" strokeWidth={2} />
                    </div>
                    <span className="text-sm text-white font-semibold">{f.label}</span>
                  </li>
                ))}
              </>
            )}
          </ul>

          <div className="flex flex-col gap-3 relative z-10">
            <button
              onClick={isPro ? handleUpgrade : () => handleCheckout("master")}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-black bg-amber-500 hover:bg-amber-400 py-4 rounded-md transition-all disabled:opacity-50 shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20"
            >
              {loading === "master" ? <Loader2 size={18} className="animate-spin" /> : <span className="flex items-center gap-2">{isPro ? "Upgrade to Master" : "Get Master Access"} <Crown size={14} fill="currentColor" /></span>}
            </button>

          </div>
        </div>
      </div>

      {error && (
        <p className="text-center text-xs text-red-400 mt-6 font-bold uppercase tracking-wider">{error}</p>
      )}
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl rounded-md bg-zinc-950 shadow-[0_0_50px_rgba(0,0,0,0.5)] max-h-[95vh] overflow-y-auto hide-scrollbar">
        {/* Glow effect for the modal itself */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute right-6 top-6 z-50 flex h-10 w-10 items-center justify-center rounded bg-white/5 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <X size={18} />
        </button>
        <UpgradeContent />
      </div>
    </div>
  );
}
