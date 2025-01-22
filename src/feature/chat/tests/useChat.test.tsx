import { act,renderHook } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { useChat } from "../hooks/useChat";
import { sendChatMessage } from "../services/chatService";

vi.mock("../../services/chatService");
vi.mock("store/hooks", () => ({
  useAppSelector: (selector: any) => {
    if (selector.name === "selectUserAuth") return "user123";
    if (selector.name === "selectUserName") return "Test User";
    return null;
  },
}));
vi.mock("react-i18next", () => ({
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
});
