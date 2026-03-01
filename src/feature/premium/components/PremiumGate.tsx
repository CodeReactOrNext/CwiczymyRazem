import { selectUserAuth, selectUserInfo, setUserRole } from "feature/user/store/userSlice";
import { doc, onSnapshot } from "firebase/firestore";
import { CalendarDays, Lock, Map } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";
import { UpgradeContent } from "./UpgradeModal";

// ─── Feature metadata ──────────────────────────────────────────────────────────

const FEATURE_META: Record<
  string,
  { icon: ReactNode; name: string; desc: string }
> = {
  summary: {
    icon: <CalendarDays size={18} className="text-emerald-400" />,
    name: "AI Practice Summary",
    desc: "Get AI-powered analysis of your daily and weekly practice sessions.",
  },
  "ai-coach": {
    icon: <Map size={18} className="text-violet-400" />,
    name: "AI Coach",
    desc: "Generate a personalized guitar learning roadmap tailored to your goals.",
  },
};

// ─── Gate ─────────────────────────────────────────────────────────────────────

interface PremiumGateProps {
  feature: "summary" | "ai-coach" | string;
  children: ReactNode;
}

export function PremiumGate({ feature, children }: PremiumGateProps) {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);

  const isPremium =
    userInfo?.role === "premium" || userInfo?.role === "admin";

  // When gate is visible (not premium), listen for role changes in Firestore.
  // This handles the case where the user completes Stripe checkout and the
  // webhook updates their role — the gate unlocks automatically.
  useEffect(() => {
    if (isPremium || !userAuth) return;

    const unsub = onSnapshot(doc(db, "users", userAuth as string), (snap) => {
      const role = snap.data()?.role as "admin" | "premium" | "user" | undefined;
      if (role === "premium" || role === "admin") {
        dispatch(setUserRole(role));
      }
    });

    return () => unsub();
  }, [isPremium, userAuth, dispatch]);

  // Still loading user data — don't flash gate or content
  if (userInfo === null) return null;

  if (isPremium) return <>{children}</>;

  const meta = FEATURE_META[feature] ?? {
    icon: <Lock size={18} className="text-zinc-400" />,
    name: "Premium Feature",
    desc: "Upgrade to access this feature.",
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-4 pt-20 pb-16 sm:pt-28">
      {/* Feature badge */}
      <div className="flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900 px-3.5 py-1.5">
        <Lock size={11} className="text-zinc-500" />
        <span className="text-xs font-medium text-zinc-400">
          {meta.name} · Premium
        </span>
      </div>

      {/* Feature intro */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
          {meta.icon}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            {meta.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{meta.desc}</p>
        </div>
      </div>

      {/* Upgrade card */}
      <div className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/40">
        <UpgradeContent />
      </div>
    </div>
  );
}
