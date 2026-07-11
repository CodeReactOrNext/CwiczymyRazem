export interface LastSessionInfo {
  title: string;
  href: string;
  at: number;
}

const STORAGE_KEY = "cw.lastSession";
// After two weeks "last session" stops being a meaningful shortcut.
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

export function saveLastSession(info: Omit<LastSessionInfo, "at">): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...info, at: Date.now() })
    );
  } catch {
    // Storage full/blocked — the shortcut just won't show, nothing to handle.
  }
}

export function loadLastSession(): LastSessionInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastSessionInfo>;
    if (
      typeof parsed.title !== "string" ||
      typeof parsed.href !== "string" ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.at > MAX_AGE_MS) return null;
    return parsed as LastSessionInfo;
  } catch {
    return null;
  }
}
