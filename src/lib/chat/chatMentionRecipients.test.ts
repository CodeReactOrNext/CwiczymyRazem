import { describe, expect, it } from "vitest";

import {
  chatNotificationRecipients,
  guildIdOfChatPath,
  isChatPath,
} from "./chatMentionRecipients";

describe("isChatPath", () => {
  it("accepts the global room and guild rooms only", () => {
    expect(isChatPath("chats")).toBe(true);
    expect(isChatPath("guilds/Riff Raiders/chat")).toBe(true);
    expect(isChatPath("users/abc")).toBe(false);
    expect(isChatPath("guilds/a/chat/x/y")).toBe(false);
    expect(isChatPath(42)).toBe(false);
  });

  it("reads the guild off a guild room", () => {
    expect(guildIdOfChatPath("guilds/Riff Raiders/chat")).toBe("Riff Raiders");
    expect(guildIdOfChatPath("chats")).toBeNull();
  });
});

describe("chatNotificationRecipients", () => {
  it("rings the tagged as mentions and the answered as a reply, once each", () => {
    expect(
      chatNotificationRecipients({
        userId: "me",
        replyTo: { userId: "ann" },
        mentions: [
          { id: "ann", username: "Ann" },
          { id: "bob", username: "Bob" },
          { id: "bob", username: "Bob" },
        ],
      }),
    ).toEqual([
      { uid: "ann", type: "chat_reply" },
      { uid: "bob", type: "chat_mention" },
    ]);
  });

  it("never rings the author or a system row", () => {
    expect(
      chatNotificationRecipients({
        userId: "me",
        replyTo: { userId: "system" },
        mentions: [{ id: "me", username: "Me" }],
      }),
    ).toEqual([]);
  });

  it("caps the tags it trusts and ignores junk", () => {
    const mentions = Array.from({ length: 9 }, (_, i) => ({
      id: `u${i}`,
      username: `U${i}`,
    }));

    expect(
      chatNotificationRecipients({ userId: "me", mentions }),
    ).toHaveLength(5);
    expect(
      chatNotificationRecipients({ userId: "me", mentions: "nope", replyTo: 3 }),
    ).toEqual([]);
  });
});
