// @vitest-environment jsdom

import { act,renderHook } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useChat } from "../hooks/useChat";
import {
  fetchChatMessages,
  notifyChatMentions,
  sendChatMessage,
  toggleChatReaction,
} from "../services/chatService";

vi.mock("../services/chatService");
vi.mock("store/hooks", () => ({
  useAppSelector: (selector: any) => {
    if (selector.name === "selectUserAuth") return "user123";
    if (selector.name === "selectUserName") return "Test User";
    return null;
  },
}));

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const roomWith = (messages: any[]) =>
  (fetchChatMessages as any).mockImplementation((callback: any) => {
    callback(messages);
    return () => {};
  });

describe("useChat Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (sendChatMessage as any).mockResolvedValue({ id: "sent1" });
  });

  it("should validate message length", async () => {
    const { result } = renderHook(() => useChat());
    const longMessage = "a".repeat(2001);

    act(() => {
      result.current.setNewMessage(longMessage);
    });

    await act(async () => {
      await result.current.sendMessage({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.error).toBe("validation_too_long");
    expect(sendChatMessage).not.toHaveBeenCalled();
  });

  it("should send valid message", async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setNewMessage("Hello");
    });

    await act(async () => {
      await result.current.sendMessage({ preventDefault: vi.fn() } as any);
    });

    expect(sendChatMessage).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    // Nobody tagged, nobody answered — nothing to ring.
    expect(notifyChatMentions).not.toHaveBeenCalled();
  });

  it("sends the reply and the tags still in the text, then asks for notifications", async () => {
    roomWith([
      {
        id: "msg1",
        userId: "ann",
        username: "Ann",
        message: "Anyone up for a jam?",
        timestamp: new Date(),
      },
    ]);
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.startReply(result.current.messages[0]);
      result.current.addMention({ id: "ann", username: "Ann" });
      result.current.addMention({ id: "bob", username: "Bob" });
      result.current.setNewMessage("@Ann sure!");
    });

    await act(async () => {
      await result.current.sendMessage({ preventDefault: vi.fn() } as any);
    });

    expect(sendChatMessage).toHaveBeenCalledWith(
      "@Ann sure!",
      "user123",
      "Test User",
      null,
      0,
      null,
      "chats",
      {
        replyTo: {
          id: "msg1",
          userId: "ann",
          username: "Ann",
          message: "Anyone up for a jam?",
        },
        mentions: [{ id: "ann", username: "Ann" }],
        attachment: null,
      }
    );
    expect(notifyChatMentions).toHaveBeenCalledWith("chats", "sent1");
    expect(result.current.replyTo).toBeNull();
    expect(result.current.newMessage).toBe("");
  });

  it("sends a shared card even without any text", async () => {
    const { result } = renderHook(() => useChat());

    act(() => {
      result.current.setAttachment({ kind: "song", id: "s1", title: "Wish", artist: "Pink Floyd" });
    });

    await act(async () => {
      await result.current.sendMessage({ preventDefault: vi.fn() } as any);
    });

    expect(sendChatMessage).toHaveBeenCalled();
  });

  it("adds a reaction and takes back exactly the stored entry", async () => {
    const legacyHeart = { id: "user123", username: "Test User" };
    roomWith([
      {
        id: "msg1",
        userId: "someoneElse",
        username: "Other User",
        message: "Hi",
        timestamp: new Date(),
        likes: [legacyHeart],
      },
    ]);

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.toggleReaction("msg1", "🔥");
    });
    expect(toggleChatReaction).toHaveBeenCalledWith(
      "msg1",
      { id: "user123", username: "Test User", emoji: "🔥" },
      false,
      "chats"
    );

    await act(async () => {
      await result.current.toggleReaction("msg1", "❤️");
    });
    // A heart from before emoji existed is removed as it was written.
    expect(toggleChatReaction).toHaveBeenLastCalledWith(
      "msg1",
      legacyHeart,
      true,
      "chats"
    );
  });
});
