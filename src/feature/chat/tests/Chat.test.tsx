import { fireEvent,render, screen } from "@testing-library/react";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { useChat } from "feature/chat/hooks/useChat";
import { beforeEach,describe, expect, it, vi } from "vitest";

import Chat from "../Chat";

// The like tooltip needs the same provider the app mounts in _app.tsx.
const renderChat = () =>
  render(
    <TooltipProvider>
      <Chat />
    </TooltipProvider>
  );

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
    renderChat();
    expect(screen.getByText("Test Message")).toBeDefined();
  });

  it("should send message", async () => {
    const { container } = renderChat();
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

    renderChat();
    expect(screen.getByText("Error message")).toBeDefined();
  });

  it("should toggle like when the like button is clicked", () => {
    const { container } = renderChat();
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
          likes: [
            { id: "user1", username: "User 1" },
            { id: "user2", username: "User 2" },
          ],
        },
      ],
      newMessage: "",
      sendMessage: mockSendMessage,
      setNewMessage: vi.fn(),
      toggleLike: mockToggleLike,
      currentUserId: "user1",
      error: null,
    });

    renderChat();
    expect(screen.getByText("2")).toBeDefined();
  });
});
