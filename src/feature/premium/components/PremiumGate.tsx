import { selectUserAuth, selectUserInfo, setUserRole } from "feature/user/store/userSlice";
import { doc, onSnapshot } from "firebase/firestore";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";
import { UpgradeContent } from "./UpgradeModal";

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



  return (
    <div className="mx-auto flex w-full flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <UpgradeContent />
      </div>
    </div>
  );
}
