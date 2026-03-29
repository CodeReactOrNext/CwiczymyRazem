import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserInfo,
} from "feature/user/store/userSlice";
import { doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

const MIN_LEVEL = 2;
const MIN_DAYS_SINCE_REGISTRATION = 4;
const MIN_SESSIONS = 3;
const MAX_DISMISSALS = 3;

// Cooldown in days after each dismissal (index = dismissCount before this show)
const DISMISS_COOLDOWNS_DAYS = [0, 3, 7];

const toMs = (value: any): number => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const s = value.seconds ?? value._seconds ?? 0;
  return s * 1000;
};

export const useFeedbackPrompt = () => {
  const [show, setShow] = useState(false);
  const userAuth = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const userStats = useAppSelector(selectCurrentUserStats);

  useEffect(() => {
    if (!userAuth || !userInfo || !userStats) return;

    // Sent feedback already → never show
    if (userInfo.feedbackAskedAt) return;

    const dismissCount = userInfo.feedbackDismissCount ?? 0;

    // Dismissed max times → never show
    if (dismissCount >= MAX_DISMISSALS) return;

    // Basic eligibility
    const meetsLevel = userStats.lvl >= MIN_LEVEL;
    const meetsSessions = userStats.sessionCount >= MIN_SESSIONS;
    const accountAgeDays = (Date.now() - toMs(userInfo.createdAt)) / 86_400_000;
    const meetsAge = accountAgeDays >= MIN_DAYS_SINCE_REGISTRATION;

    if (!meetsLevel || !meetsSessions || !meetsAge) return;

    // Cooldown after previous dismissal
    const cooldownDays = DISMISS_COOLDOWNS_DAYS[dismissCount] ?? 0;
    const lastDismissedMs = toMs(userInfo.feedbackLastDismissedAt);
    const daysSinceLastDismiss = lastDismissedMs
      ? (Date.now() - lastDismissedMs) / 86_400_000
      : Infinity;

    if (daysSinceLastDismiss < cooldownDays) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [userAuth, userInfo, userStats]);

  const markAsDismissed = async () => {
    if (!userAuth) return;
    setShow(false);
    try {
      await updateDoc(doc(db, "users", userAuth), {
        feedbackDismissCount: increment(1),
        feedbackLastDismissedAt: serverTimestamp(),
      });
    } catch {
      // non-critical
    }
  };

  const markAsSent = async () => {
    if (!userAuth) return;
    setShow(false);
    try {
      await updateDoc(doc(db, "users", userAuth), {
        feedbackAskedAt: serverTimestamp(),
      });
    } catch {
      // non-critical
    }
  };

  return { show, markAsDismissed, markAsSent };
};
