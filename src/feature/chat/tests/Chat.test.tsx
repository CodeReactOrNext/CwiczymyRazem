import { fireEvent,render, screen } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import Chat from "../Chat";
import { useChat } from "feature/chat/hooks/useChat";

vi.mock("feature/chat/hooks/useChat");

vi.mock("hooks/useTranslation", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));


describe("Chat Component", () => {
  const mockSendMessage = vi.fn((e) => {
    e?.preventDefault();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useChat as any).mockReturnValue({
      messages: [
        {
          id: "1",
          userId: "user1",
          username: "Test User",
          message: "Test Message",
          timestamp: new Date(),
        },
      ],
      newMessage: "Some message",
      sendMessage: mockSendMessage,
      setNewMessage: vi.fn(),
      currentUserId: "user1",
      error: null,
    });
  });

  it("should render messages", () => {
    render(<Chat />);
    expect(screen.getByText("Test Message")).toBeDefined();
  });

  it("should send message", async () => {
    const { container } = render(<Chat />);
    const button = container.querySelector('button[type="submit"]');
    if (!button) throw new Error("Button not found");
    
    fireEvent.click(button);
    
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("should display error when present", () => {
    (useChat as any).mockReturnValue({
      messages: [],
      newMessage: "",
      sendMessage: mockSendMessage,
      setNewMessage: vi.fn(),
      currentUserId: "user1",
      error: "Error message",
    });

    render(<Chat />);
    expect(screen.getByText("Error message")).toBeDefined();
  });
});
