import Head from "next/head";
import Link from "next/link";
import { CheckCircle2, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";

const PLAN_FEATURES: Record<"pro" | "master", string[]> = {
  pro: [
    "Real-time Note Detection",
    "Practice Plan Creator",
    "Practice Calendar & history",
    "Guitar Pro File Support",
    "Full Exercise Library",
    "Special Ranks",
  ],
  master: [
    "Everything in Practice Pro",
    "Skill Roadmaps",
    "Daily Practice Insights",
    "Weekly Progress Summary",
    "Goal-based Analytics",
  ],
};

export default function PremiumSuccessPage() {
  const userId = useAppSelector(selectUserAuth);
  const [confirmed, setConfirmed] = useState(false);
  const [plan, setPlan] = useState<"pro" | "master">("pro");

  // Poll Firestore until role is pro or master (webhook may be slightly delayed)
  useEffect(() => {
    if (!userId) return;

    let attempts = 0;
    const MAX = 12; // 12 × 2s = 24s max wait

    const poll = async () => {
      try {
        const snap = await getDoc(doc(db, "users", userId));
        const role = snap.data()?.role;
        if (role === "pro" || role === "master") {
          setPlan(role);
          setConfirmed(true);
          return;
        }
      } catch {}

      attempts++;
      if (attempts < MAX) setTimeout(poll, 2000);
      else setConfirmed(true); // show success anyway after timeout
    };

    poll();
  }, [userId]);

  return (
    <>
      <Head>
        <title>Premium activated | Riff Quest</title>
      </Head>

      <div className="min-h-screen bg-[#020202] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center space-y-8">

          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="relative h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                {confirmed
                  ? <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  : <Loader2 className="h-10 w-10 text-emerald-400 animate-spin" />
                }
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-white italic">
              {confirmed
                ? <>Welcome to <span className="text-emerald-400">{plan === "master" ? "Practice Master!" : "Practice Pro!"}</span></>
                : <span className="text-zinc-300">Activating your account...</span>
              }
            </h1>
            <p className="text-zinc-400">
              {confirmed
                ? "Your payment was confirmed. Your features are now unlocked."
                : "Just a moment — we're confirming your payment."
              }
            </p>
          </div>

          {confirmed && (
            <>
              {/* Features unlocked */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Unlocked features
                </div>
                {PLAN_FEATURES[plan].map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition-colors"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>

              <p className="text-xs text-zinc-600">
                You can manage your subscription in{" "}
                <Link href="/settings" className="text-zinc-400 hover:text-white underline">
                  settings
                </Link>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
