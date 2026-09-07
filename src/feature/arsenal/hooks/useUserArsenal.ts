import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

import { findEquippedGuitar } from "../data/equippedGuitar";
import type { ArsenalUserData } from "../types/arsenal.types";

export const userArsenalQueryKey = (userId: string) => [
  "arsenal",
  "user",
  userId,
];

const fetchUserArsenal = async (
  userId: string,
): Promise<ArsenalUserData | null> => {
  const snap = await getDoc(doc(db, "users", userId));
  if (!snap.exists()) return null;
  return (snap.data()?.arsenal as ArsenalUserData) ?? null;
};

/**
 * Any player's arsenal, straight off their user document — a profile is public,
 * so a visitor reads the same shape its owner does.
 *
 * `enabled` is how the callers hanging off a hover defer the read: a
 * leaderboard draws a dozen avatars and most are never opened.
 */
export const useUserArsenal = (
  userId: string | null | undefined,
  enabled = true,
) =>
  useQuery({
    queryKey: userArsenalQueryKey(userId ?? ""),
    queryFn: () => fetchUserArsenal(userId!),
    enabled: Boolean(userId) && enabled,
    staleTime: 60_000,
  });

/** The item behind the guitar a player wears on their profile. */
export const useEquippedGuitar = (
  userId: string | null | undefined,
  enabled = true,
) => {
  const { data, isLoading } = useUserArsenal(userId, enabled);
  return { item: findEquippedGuitar(data), isLoading };
};
