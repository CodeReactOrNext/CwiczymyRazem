import { fireEvent,render, screen } from "@testing-library/react";
import { useChat } from "feature/chat/hooks/useChat";
import { beforeEach,describe, expect, it, vi } from "vitest";

import Chat from "../Chat";

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
  const mockToggleLike = vi.fn();

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
          likes: [],
        },
      ],
      newMessage: "Some message",
      sendMessage: mockSendMessage,
      setNewMessage: vi.fn(),
      toggleLike: mockToggleLike,
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
      toggleLike: mockToggleLike,
      currentUserId: "user1",
      error: "Error message",
    });

    render(<Chat />);
    expect(screen.getByText("Error message")).toBeDefined();
  });

  it("should toggle like when the like button is clicked", () => {
    const { container } = render(<Chat />);
    const likeButton = container.querySelector('button[type="button"]');
    if (!likeButton) throw new Error("Like button not found");

    fireEvent.click(likeButton);

    expect(mockToggleLike).toHaveBeenCalledWith("1");
  });

  it("should show the like count when the message has likes", () => {
    (useChat as any).mockReturnValue({
      messages: [
        {
          id: "1",
          userId: "user1",
          username: "Test User",
          message: "Test Message",
          timestamp: new Date(),
          likes: ["user1", "user2"],
        },
      ],
      newMessage: "",
      sendMessage: mockSendMessage,
      setNewMessage: vi.fn(),
      toggleLike: mockToggleLike,
      currentUserId: "user1",
      error: null,
    });

    render(<Chat />);
    expect(screen.getByText("2")).toBeDefined();
  });
});
