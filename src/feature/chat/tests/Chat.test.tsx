import { fireEvent,render, screen } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import Chat from "../Chat";
import { useChat } from "../hooks/useChat";

vi.mock("../hooks/useChat");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Chat Component", () => {
  const mockSendMessage = vi.fn();

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
      newMessage: "",
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

  it("should send message", () => {
    render(<Chat />);
    const form = screen.getByRole("form");
    const input = screen.getByPlaceholderText("send_placeholder");
    
    fireEvent.change(input, { target: { value: "New message" } });
    fireEvent.submit(form);
    
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
