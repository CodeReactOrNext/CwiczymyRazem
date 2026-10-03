import type { AppNotification } from "feature/notifications/services/notification.service";
import {
  notificationChatTab,
  notificationHref,
} from "feature/notifications/services/notification.service";
import { describe, expect, it, vi } from "vitest";

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  serverTimestamp: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

const notification = (
  overrides: Partial<AppNotification>,
): AppNotification => ({
  id: "n1",
  userId: "recipient",
  type: "like",
  timestamp: null,
  isRead: false,
  ...overrides,
});

describe("notificationHref", () => {
  it("opens the recording a like or comment landed on", () => {
    expect(
      notificationHref(notification({ type: "like", recordingId: "rec1" })),
    ).toBe("/recordings?recordingId=rec1");
    expect(
      notificationHref(notification({ type: "comment", recordingId: "rec1" })),
    ).toBe("/recordings?recordingId=rec1");
  });

  it("has nowhere to send a like without a recording id", () => {
    expect(notificationHref(notification({ type: "like" }))).toBeNull();
  });

  it("leaves reactions unlinked despite carrying a recordingId", () => {
    // Reactions reuse `recordingId` for the practice-log id, so it must not be
    // treated as a recording.
    expect(
      notificationHref(notification({ type: "reaction", recordingId: "log1" })),
    ).toBeNull();
  });

  it("keeps the existing playlist, marketplace and exercise targets", () => {
    expect(
      notificationHref(
        notification({ type: "playlist_liked", playlistId: "p1" }),
      ),
    ).toBe("/songs?view=playlists&playlistId=p1");
    expect(notificationHref(notification({ type: "marketplace_sold" }))).toBe(
      "/arsenal?tab=market",
    );
    expect(notificationHref(notification({ type: "exercise_thanked" }))).toBe(
      "/profile/skills?tab=community",
    );
    expect(notificationHref(notification({ type: "daily_exercise_win" }))).toBe(
      "/arsenal",
    );
    expect(
      notificationHref(notification({ type: "daily_exercise_place", place: 3 })),
    ).toBe("/dashboard");
  });

  it("leaves system notifications without a target", () => {
    expect(notificationHref(notification({ type: "season_start" }))).toBeNull();
    expect(
      notificationHref(notification({ type: "season_reward" })),
    ).toBeNull();
  });
});

describe("notificationChatTab", () => {
  it("opens the guild tab for a guild room and the chat tab otherwise", () => {
    expect(
      notificationChatTab(
        notification({ type: "chat_mention", chatPath: "guilds/Shred/chat" }),
      ),
    ).toBe("guild");
    expect(
      notificationChatTab(notification({ type: "chat_reply", chatPath: "chats" })),
    ).toBe("chat");
  });

  it("leaves every other notification alone", () => {
    expect(notificationChatTab(notification({ type: "like" }))).toBeNull();
  });
});
