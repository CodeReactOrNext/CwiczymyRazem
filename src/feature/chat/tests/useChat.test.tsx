import { act,renderHook } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useChat } from "../hooks/useChat";
import {
  fetchChatMessages,
  sendChatMessage,
  toggleLikeChatMessage,
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


describe("useChat Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("should toggle like on a message", async () => {
    (fetchChatMessages as any).mockImplementation((callback: any) => {
      callback([
        {
          id: "msg1",
          userId: "someoneElse",
          username: "Other User",
          message: "Hi",
          timestamp: new Date(),
          likes: [],
        },
      ]);
      return () => {};
    });

    const { result } = renderHook(() => useChat());

    await act(async () => {
      await result.current.toggleLike("msg1");
    });

    expect(toggleLikeChatMessage).toHaveBeenCalledWith(
      "msg1",
      "user123",
      false
    );
  });
});
