import type { ChatMessageType } from "feature/chat/types/chat.types";
import { describe, expect, it } from "vitest";

import { foldGreetings, isStockGreeting } from "./chatGreetings";

const welcome: ChatMessageType = {
  id: "w1",
  type: "welcome",
  userId: "ann",
  username: "Ann",
  message: "Ann just joined Riff Quest",
  timestamp: new Date(),
};

const reply = (
  id: string,
  userId: string,
  message: string,
  extra: Partial<ChatMessageType> = {},
): ChatMessageType => ({
  id,
  userId,
  username: userId.toUpperCase(),
  message,
  timestamp: new Date(),
  replyTo: { id: "w1", userId: "ann", username: "Ann", message: welcome.message },
  ...extra,
});

describe("isStockGreeting", () => {
  it("takes the Say hi text and its plain variations", () => {
    expect(isStockGreeting(reply("1", "bob", "@Ann Welcome! 👋 "))).toBe(true);
    expect(isStockGreeting(reply("2", "bob", "hey @Ann, welcome!!"))).toBe(true);
    expect(isStockGreeting(reply("3", "bob", "👋"))).toBe(true);
  });

  it("keeps anything with more to say", () => {
    expect(
      isStockGreeting(reply("1", "bob", "@Ann Welcome! What do you play?")),
    ).toBe(false);
    expect(
      isStockGreeting(
        reply("2", "bob", "@Ann Welcome!", {
          attachment: { kind: "plan", id: "p", title: "Plan" },
        }),
      ),
    ).toBe(false);
    expect(
      isStockGreeting({ ...reply("3", "bob", "Welcome!"), replyTo: null }),
    ).toBe(false);
  });
});

describe("foldGreetings", () => {
  it("folds stock greetings into the welcome they answer, once per greeter", () => {
    const talk = reply("4", "cid", "@Ann Welcome! Try the Journey first");
    const { visible, greetersById } = foldGreetings([
      welcome,
      reply("2", "bob", "@Ann Welcome! 👋"),
      reply("3", "bob", "@Ann welcome"),
      talk,
    ]);

    expect(visible).toEqual([welcome, talk]);
    expect(greetersById.get("w1")?.map((g) => g.userId)).toEqual(["bob"]);
  });

  it("leaves a greeting alone when the welcome it answers is not loaded", () => {
    const greeting = reply("2", "bob", "@Ann Welcome! 👋");
    expect(foldGreetings([greeting]).visible).toEqual([greeting]);
  });
});
