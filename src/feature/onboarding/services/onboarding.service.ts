import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "utils/firebase/client/firebase.utils";
import type { OnboardingResult } from "../types";

export const firebaseSaveOnboarding = async (result: OnboardingResult) => {
  const auth = getAuth();
  if (!auth.currentUser) return;
  const userDocRef = doc(db, "users", auth.currentUser.uid);
  await updateDoc(userDocRef, {
    onboarding: {
      chosenPath: result.chosenPath,
      completedAt: serverTimestamp(),
    },
    onboardingCompleted: true,
  });
};
