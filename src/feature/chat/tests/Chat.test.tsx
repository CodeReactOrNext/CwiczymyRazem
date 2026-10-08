// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { TooltipProvider } from "assets/components/ui/tooltip";
import { useChat } from "feature/chat/hooks/useChat";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Chat from "../Chat";

// The reaction tooltips and the support-team lookup behind the author avatars need
// the same providers the app mounts in _app.tsx.
const renderChat = (chatPath?: string) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <TooltipProvider>
        <Chat chatPath={chatPath} />
      </TooltipProvider>
    </QueryClientProvider>
  );

vi.mock("feature/chat/hooks/useChat");
vi.mock("feature/chat/hooks/useChatTyping", () => ({
  useChatTyping: () => ({
    typingNames: [],
    notifyTyping: vi.fn(),
    stopTyping: vi.fn(),
  }),
  typingLabel: () => null,
}));
vi.mock("hooks/useOnlineUsers", () => ({
  useOnlineUsers: () => ({ onlineUsers: [], isDbEnabled: true }),
}));
vi.mock("feature/chat/components/ChatAttachmentPicker", () => ({
  ChatAttachmentPicker: () => null,
}));
vi.mock("feature/chat/components/ChatAttachmentCard", () => ({
  ChatAttachmentCard: () => null,
}));
vi.mock("feature/recordings/components/RecordingViewModal", () => ({
  RecordingViewModal: () => null,
}));
vi.mock("layouts/LogsBoxLayout/components/Logs/ActivityStartModal", () => ({
  ActivityStartModal: () => null,
}));
vi.mock("feature/chat/services/chatService", () => ({
  GLOBAL_CHAT_PATH: "chats",
}));

const mockSendMessage = vi.fn((e) => {
  e?.preventDefault();
});
const mockToggleReaction = vi.fn();
const mockSetNewMessage = vi.fn();

const chatState = (overrides: Record<string, unknown> = {}) => ({
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
  isLoading: false,
  newMessage: "Some message",
  sendMessage: mockSendMessage,
  setNewMessage: mockSetNewMessage,
  toggleReaction: mockToggleReaction,
  replyTo: null,
  startReply: vi.fn(),
  cancelReply: vi.fn(),
  attachment: null,
  setAttachment: vi.fn(),
  addMention: vi.fn(),
  currentUserId: "user1",
  currentUserName: "Test User",
  error: null,
  ...overrides,
});

describe("Chat Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useChat as any).mockReturnValue(chatState());
  });

  afterEach(cleanup);

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

  it("labels the message field and sends on Enter, not on Shift+Enter", () => {
    renderChat();
    const field = screen.getByRole("textbox", { name: "Message" });

    expect(field.tagName).toBe("TEXTAREA");
    expect(field.getAttribute("enterkeyhint")).toBe("send");

    fireEvent.keyDown(field, { key: "Enter", shiftKey: true });
    expect(mockSendMessage).not.toHaveBeenCalled();

    fireEvent.keyDown(field, { key: "Enter" });
    expect(mockSendMessage).toHaveBeenCalled();
  });

  it("dates the day and times the group", () => {
    const { container } = renderChat();

    expect(screen.getByText("Today")).toBeDefined();
    expect(container.querySelectorAll("time[datetime]").length).toBe(2);
  });

  it("opens the message menu from ⋯ with Reply and Copy", () => {
    const startReply = vi.fn();
    (useChat as any).mockReturnValue(chatState({ startReply }));
    renderChat();

    fireEvent.click(screen.getByRole("button", { name: "Message actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Reply" }));

    expect(startReply).toHaveBeenCalled();
  });

  it("should display error when present", () => {
    (useChat as any).mockReturnValue(
      chatState({ messages: [], newMessage: "", error: "Error message" })
    );

    renderChat();
    expect(screen.getByText("Error message")).toBeDefined();
  });

  it("reacts with the emoji that was clicked", () => {
    renderChat();

    fireEvent.click(screen.getAllByRole("button", { name: "React with 🔥" })[0]);

    expect(mockToggleReaction).toHaveBeenCalledWith("1", "🔥");
  });

  it("shows one chip per emoji with its count", () => {
    (useChat as any).mockReturnValue(
      chatState({
        messages: [
          {
            id: "1",
            userId: "user2",
            username: "Other",
            message: "Test Message",
            timestamp: new Date(),
            likes: [
              { id: "user1", username: "User 1" },
              { id: "user2", username: "User 2" },
              { id: "user3", username: "User 3", emoji: "🎸" },
            ],
          },
        ],
      })
    );

    renderChat();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
  });

  it("offers to say hi in an empty room", () => {
    (useChat as any).mockReturnValue(chatState({ messages: [] }));

    renderChat("guilds/g1/chat");
    fireEvent.click(screen.getByRole("button", { name: /Say hi/ }));

    expect(screen.getByText("Be the first — say hi to your guild.")).toBeDefined();
    expect(mockSetNewMessage).toHaveBeenCalledWith("Hi guild! 👋 ");
  });

  it("shows the quote a reply answers", () => {
    (useChat as any).mockReturnValue(
      chatState({
        messages: [
          {
            id: "2",
            userId: "user2",
            username: "Other",
            message: "Me too",
            timestamp: new Date(),
            replyTo: { id: "1", userId: "user1", username: "Ann", message: "Anyone jamming?" },
          },
        ],
      })
    );

    renderChat();
    expect(screen.getByText("Anyone jamming?")).toBeDefined();
  });

  it("draws guild events as a line and lets others greet a new member", () => {
    const startReply = vi.fn();
    (useChat as any).mockReturnValue(
      chatState({
        startReply,
        messages: [
          {
            id: "3",
            type: "system",
            userId: "ann",
            username: "Ann",
            message: "Ann joined the guild",
            timestamp: new Date(),
            system: { kind: "member_joined" },
          },
        ],
      })
    );

    renderChat("guilds/g1/chat");
    fireEvent.click(screen.getByRole("button", { name: /Say hi/ }));

    expect(startReply).toHaveBeenCalled();
    expect(mockSetNewMessage).toHaveBeenCalledWith("@Ann Welcome! 👋 ");
  });

  it("folds stock greetings into the join line and drops Say hi once greeted", () => {
    (useChat as any).mockReturnValue(
      chatState({
        messages: [
          {
            id: "w1",
            type: "system",
            userId: "ann",
            username: "Ann",
            message: "Ann joined the guild",
            timestamp: new Date(),
            system: { kind: "member_joined" },
          },
          {
            id: "g1",
            userId: "user1",
            username: "Test User",
            message: "@Ann Welcome! 👋",
            timestamp: new Date(),
            replyTo: { id: "w1", userId: "ann", username: "Ann", message: "Ann joined the guild" },
          },
        ],
      })
    );

    renderChat("guilds/g1/chat");

    expect(screen.getByText("Test User")).toBeDefined();
    expect(screen.getByText(/said hi/)).toBeDefined();
    expect(screen.queryByText("@Ann")).toBeNull();
    expect(screen.queryByRole("button", { name: /Say hi/ })).toBeNull();
  });
});
