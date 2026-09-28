import type { ChatReaction } from "feature/chat/types/chat.types";
import { describe, expect, it } from "vitest";

import {
  activeMentionQuery,
  insertMention,
  MAX_CHAT_MENTIONS,
  resolveMentions,
  snippet,
  splitByMentions,
} from "./chatMentions";
import { findOwnReaction, groupReactions, reactionEmoji } from "./chatReactions";
import { systemEventText, welcomeText } from "./systemMessages";

describe("chat reactions", () => {
  const reactions: ChatReaction[] = [
    { id: "a", username: "Ann" },
    { id: "b", username: "Bob", emoji: "🔥" },
    { id: "a", username: "Ann", emoji: "🔥" },
    { id: "c", username: "Cid", emoji: "❤️" },
  ];

  it("reads a legacy entry without emoji as a heart", () => {
    expect(reactionEmoji({ id: "a", username: "Ann" })).toBe("❤️");
  });

  it("groups by emoji in picker order and marks the viewer's", () => {
    const groups = groupReactions(reactions, "a");

    expect(groups.map((g) => g.emoji)).toEqual(["❤️", "🔥"]);
    expect(groups[0].reactors.map((r) => r.id)).toEqual(["a", "c"]);
    expect(groups.every((g) => g.mine)).toBe(true);
    expect(groupReactions(reactions, "c")[1].mine).toBe(false);
  });

  it("finds the stored entry exactly as written, so arrayRemove can match it", () => {
    expect(findOwnReaction(reactions, "a", "❤️")).toBe(reactions[0]);
    expect(findOwnReaction(reactions, "a", "🔥")).toBe(reactions[2]);
    expect(findOwnReaction(reactions, "a", "😂")).toBeUndefined();
  });
});

describe("chat mentions", () => {
  it("finds the tag being typed at the caret", () => {
    expect(activeMentionQuery("hi @an", 6)).toEqual({ start: 3, query: "an" });
    expect(activeMentionQuery("@", 1)).toEqual({ start: 0, query: "" });
    expect(activeMentionQuery("mail@an", 7)).toBeNull();
    expect(activeMentionQuery("hi @an there", 12)).toBeNull();
  });

  it("replaces the half-typed tag and moves the caret past it", () => {
    expect(insertMention("hi @an!", 3, 6, "Ann Lee")).toEqual({
      text: "hi @Ann Lee !",
      caret: 12,
    });
  });

  it("keeps only tags still in the text, without the author or duplicates", () => {
    const picked = [
      { id: "1", username: "Ann" },
      { id: "2", username: "Bob" },
      { id: "1", username: "Ann" },
      { id: "me", username: "Me" },
    ];

    expect(resolveMentions("@Ann and @Me", picked, "me")).toEqual([
      { id: "1", username: "Ann" },
    ]);
  });

  it("caps the number of tags", () => {
    const picked = Array.from({ length: 8 }, (_, i) => ({
      id: String(i),
      username: `P${i}`,
    }));
    const text = picked.map((p) => `@${p.username}`).join(" ");

    expect(resolveMentions(text, picked, null)).toHaveLength(MAX_CHAT_MENTIONS);
  });

  it("splits a message around tagged names, longest name first", () => {
    const segments = splitByMentions("hey @Ann Lee and @Ann!", [
      { id: "1", username: "Ann" },
      { id: "2", username: "Ann Lee" },
    ]);

    expect(segments).toEqual([
      { type: "text", text: "hey " },
      {
        type: "mention",
        text: "@Ann Lee",
        mention: { id: "2", username: "Ann Lee" },
      },
      { type: "text", text: " and " },
      { type: "mention", text: "@Ann", mention: { id: "1", username: "Ann" } },
      { type: "text", text: "!" },
    ]);
  });

  it("leaves a message without tags whole", () => {
    expect(splitByMentions("plain (text)", [])).toEqual([
      { type: "text", text: "plain (text)" },
    ]);
  });

  it("shortens long text for quotes", () => {
    expect(snippet("a  b\nc")).toBe("a b c");
    expect(snippet("x".repeat(20), 10)).toBe(`${"x".repeat(9)}…`);
  });
});

describe("system messages", () => {
  it("describes what a new player came for", () => {
    expect(welcomeText("Ania", "plans", "Beginner")).toBe(
      "Ania just joined, starting with the Beginner plan",
    );
    expect(welcomeText("Ania", "songs", null)).toBe(
      "Ania just joined, here to learn songs",
    );
    expect(welcomeText("Ania", null, null)).toBe("Ania just joined Riff Quest");
  });

  it("writes guild events as one line", () => {
    expect(
      systemEventText(
        { kind: "level_up", guildName: "Shredders", level: 4, quests: ["A", "B"] },
        "system",
      ),
    ).toBe("Shredders reached level 4 — cleared A, B");
    expect(systemEventText({ kind: "member_joined" }, "Ania")).toBe(
      "Ania joined the guild",
    );
  });
});
