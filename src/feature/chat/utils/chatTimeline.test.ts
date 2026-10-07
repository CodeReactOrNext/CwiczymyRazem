import type { ChatMessageType } from "feature/chat/types/chat.types";
import {
  buildChatTimeline,
  chatDayKind,
  GROUP_BREAK_MS,
  toMessageDate,
} from "feature/chat/utils/chatTimeline";
import { describe, expect, it } from "vitest";

const NOW = new Date(2026, 9, 7, 18, 0);

const msg = (
  id: string,
  userId: string,
  timestamp: Date,
  extra: Partial<ChatMessageType> = {},
): ChatMessageType => ({
  id,
  userId,
  username: userId,
  message: id,
  timestamp,
  ...extra,
});

const at = (hours: number, minutes = 0, dayOffset = 0) =>
  new Date(2026, 9, 7 + dayOffset, hours, minutes);

describe("toMessageDate", () => {
  it("reads a Firestore Timestamp", () => {
    const date = at(14, 32);
    expect(toMessageDate({ toDate: () => date }, NOW)).toBe(date);
  });

  it("treats a message without a server time yet as sent now", () => {
    expect(toMessageDate(null, NOW)).toBe(NOW);
  });
});

describe("chatDayKind", () => {
  it("names today and yesterday, and dates the rest", () => {
    expect(chatDayKind(at(1), NOW)).toBe("today");
    expect(chatDayKind(at(23, 59, -1), NOW)).toBe("yesterday");
    expect(chatDayKind(at(12, 0, -2), NOW)).toBe("earlier");
  });
});

describe("buildChatTimeline", () => {
  it("opens every day with a divider", () => {
    const timeline = buildChatTimeline(
      [msg("a", "ann", at(22, 0, -1)), msg("b", "ann", at(9, 0))],
      NOW,
    );

    expect(timeline.map((entry) => entry.kind)).toEqual([
      "day",
      "group",
      "day",
      "group",
    ]);
  });

  it("gathers one author's run into a single group", () => {
    const timeline = buildChatTimeline(
      [
        msg("a", "ann", at(14, 0)),
        msg("b", "ann", at(14, 2)),
        msg("c", "bob", at(14, 3)),
      ],
      NOW,
    );

    const groups = timeline.filter((entry) => entry.kind === "group");
    expect(groups).toHaveLength(2);
    expect(groups[0].kind === "group" && groups[0].messages).toHaveLength(2);
  });

  it("starts a new group after a long pause or a reply", () => {
    const later = new Date(at(14, 0).getTime() + GROUP_BREAK_MS);
    const timeline = buildChatTimeline(
      [
        msg("a", "ann", at(14, 0)),
        msg("b", "ann", later),
        msg("c", "ann", later, {
          replyTo: { id: "x", userId: "bob", username: "bob", message: "hi" },
        }),
      ],
      NOW,
    );

    expect(timeline.filter((entry) => entry.kind === "group")).toHaveLength(3);
  });

  it("keeps server events on their own line and breaks the run around them", () => {
    const timeline = buildChatTimeline(
      [
        msg("a", "ann", at(14, 0)),
        msg("e", "ann", at(14, 1), { type: "system" }),
        msg("b", "ann", at(14, 2)),
      ],
      NOW,
    );

    expect(timeline.map((entry) => entry.kind)).toEqual([
      "day",
      "group",
      "event",
      "group",
    ]);
  });
});
