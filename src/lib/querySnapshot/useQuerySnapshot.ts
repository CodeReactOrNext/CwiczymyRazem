import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

import {
  clearQuerySnapshot,
  isPersistedQueryKey,
  restoreQuerySnapshot,
  writeQuerySnapshot,
} from "./querySnapshot";

// A dashboard load settles several queries within a second; save once after.
const WRITE_DELAY = 1000;

/** Restores the saved queries for the signed-in player and keeps the copy current. */
export const useQuerySnapshot = () => {
  const client = useQueryClient();
  const { data: session, status } = useSession();
  // `[...nextauth]` puts the uid on the session user; next-auth's type doesn't know it.
  const uid = (session?.user as { id?: string | null } | undefined)?.id ?? null;

  useEffect(() => {
    if (status === "unauthenticated") clearQuerySnapshot();
  }, [status]);

  useEffect(() => {
    if (!uid) return;

    // Runs before the app shell has a player to render, so the dashboard's
    // widgets mount onto a filled cache.
    restoreQuerySnapshot(client, uid);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.type !== "updated" || event.action.type !== "success") return;
      if (!isPersistedQueryKey(event.query.queryKey)) return;
      clearTimeout(timer);
      timer = setTimeout(() => writeQuerySnapshot(client, uid), WRITE_DELAY);
    });

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [client, uid]);
};
