import {
  getDatabase,
  onDisconnect,
  onValue,
  ref,
  remove,
  serverTimestamp,
  set,
} from "firebase/database";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  firebaseApp,
  isDatabaseEnabled,
} from "utils/firebase/client/firebase.config";

/** Rewrite the flag no more often than this while someone keeps typing. */
const TYPING_REFRESH_MS = 3_000;
/** Quiet this long and the flag comes down on its own. */
const TYPING_IDLE_MS = 5_000;
/** A flag older than this is a tab that died without its disconnect handler firing. */
const TYPING_STALE_MS = 30_000;

interface TypingEntry {
  name?: string;
  at?: number;
}

/** RTDB keys can't hold `. # $ [ ] /`, and a guild's id is its name. */
export const typingRoomKey = (chatPath: string): string =>
  chatPath.replace(/[.#$[\]/]/g, "_");

const getDb = () => {
  if (!isDatabaseEnabled) return null;
  try {
    return getDatabase(firebaseApp);
  } catch {
    return null;
  }
};

/**
 * "Ania is typing…" for one room. Lives in the Realtime Database next to
 * presence rather than in Firestore: a flag that flips every few seconds would
 * be billed as a document read for every open chat, every time.
 *
 * Everything here is best-effort — a database without the `typing` rule just
 * means nobody sees the indicator.
 */
export const useChatTyping = (
  chatPath: string,
  userId: string | null,
  userName: string,
) => {
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const lastWriteRef = useRef(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomKey = typingRoomKey(chatPath);

  useEffect(() => {
    const db = getDb();
    if (!db || !userId) return;

    const unsubscribe = onValue(
      ref(db, `typing/${roomKey}`),
      (snapshot) => {
        const entries = (snapshot.val() ?? {}) as Record<string, TypingEntry>;
        const now = Date.now();
        setTypingNames(
          Object.entries(entries)
            .filter(
              ([uid, entry]) =>
                uid !== userId &&
                entry?.name &&
                (!entry.at || now - entry.at < TYPING_STALE_MS),
            )
            .map(([, entry]) => entry.name as string),
        );
      },
      () => setTypingNames([]),
    );

    return () => unsubscribe();
  }, [roomKey, userId]);

  const stopTyping = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    if (lastWriteRef.current === 0) return;
    lastWriteRef.current = 0;

    const db = getDb();
    if (!db || !userId) return;
    remove(ref(db, `typing/${roomKey}/${userId}`)).catch(() => {});
  }, [roomKey, userId]);

  const notifyTyping = useCallback(() => {
    const db = getDb();
    if (!db || !userId) return;

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(stopTyping, TYPING_IDLE_MS);

    const now = Date.now();
    if (now - lastWriteRef.current < TYPING_REFRESH_MS) return;
    lastWriteRef.current = now;

    const flagRef = ref(db, `typing/${roomKey}/${userId}`);
    onDisconnect(flagRef)
      .remove()
      .catch(() => {});
    set(flagRef, { name: userName, at: serverTimestamp() }).catch(() => {});
  }, [roomKey, userId, userName, stopTyping]);

  // Leaving the room (closing the drawer, switching tabs) takes the flag down with it.
  useEffect(() => stopTyping, [stopTyping]);

  return { typingNames, notifyTyping, stopTyping };
};

/** "Ania is typing…", "Ania and Bob are typing…", "3 people are typing…". */
export const typingLabel = (names: readonly string[]): string | null => {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} is typing…`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
  return `${names.length} people are typing…`;
};
