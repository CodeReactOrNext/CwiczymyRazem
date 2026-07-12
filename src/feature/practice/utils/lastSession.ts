export interface LastSessionInfo {
  title: string;
  href: string;
  at: number;
}

const STORAGE_KEY = "cw.lastSessions";
const MAX_SESSIONS = 3;
// After two weeks "last session" stops being a meaningful shortcut.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function saveLastSession(info: Omit<LastSessionInfo, "at">): void {
  try {
    const sessions = loadLastSessions();
    const newSession = { ...info, at: Date.now() };
    const updated = [newSession, ...sessions].slice(0, MAX_SESSIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full/blocked — the shortcut just won't show, nothing to handle.
  }
}

export function loadLastSession(): LastSessionInfo | null {
  const sessions = loadLastSessions();
  return sessions[0] || null;
}

export function loadLastSessions(): LastSessionInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Partial<LastSessionInfo> => typeof item === "object" && item !== null)
      .filter((item) =>
        typeof item.title === "string" &&
        typeof item.href === "string" &&
        typeof item.at === "number"
      )
      .filter((item) => Date.now() - (item.at ?? 0) <= MAX_AGE_MS)
      .map((item) => item as LastSessionInfo);
  } catch {
    return [];
  }
}
