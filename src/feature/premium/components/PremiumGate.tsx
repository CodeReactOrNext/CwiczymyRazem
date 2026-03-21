import { selectUserAuth, selectUserInfo, setUserRole } from "feature/user/store/userSlice";
import { doc, onSnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";
import { UpgradeContent } from "./UpgradeModal";

interface PremiumGateProps {
  feature: string;
  requiredPlan?: "master";
  children: ReactNode;
}

export function PremiumGate({ requiredPlan, children }: PremiumGateProps) {
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector(selectUserInfo);
  const userAuth = useAppSelector(selectUserAuth);

  const role = userInfo?.role;
  const isAdmin = role === "admin";
  const isPremium = role === "pro" || role === "master" || isAdmin;
  const hasSufficientPlan = requiredPlan === "master"
    ? role === "master" || isAdmin
    : isPremium;

  // Listen for role changes in Firestore when gate is visible.
  // Unlocks automatically after Stripe webhook updates the role.
  useEffect(() => {
    if (hasSufficientPlan || !userAuth) return;

    const unsub = onSnapshot(doc(db, "users", userAuth as string), (snap) => {
      const r = snap.data()?.role as "admin" | "pro" | "master" | "user" | undefined;
      if (r === "pro" || r === "master" || r === "admin") {
        dispatch(setUserRole(r));
      }
    });

    return () => unsub();
  }, [hasSufficientPlan, userAuth, dispatch]);

  // Still loading user data — don't flash gate or content
  if (userInfo === null) return null;

  if (hasSufficientPlan) return <>{children}</>;

  return (
    <div className="mx-auto flex w-full flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <UpgradeContent />
      </div>
    </div>
  );
}
