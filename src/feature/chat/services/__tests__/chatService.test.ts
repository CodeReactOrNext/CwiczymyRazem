import { expect, describe, it, vi } from "vitest";
import { sendChatMessage } from "../chatService";
import { addDoc, collection } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";

vi.mock("firebase/firestore");
vi.mock("utils/firebase/client/firebase.utils", () => ({
  db: {},
}));

describe("Chat Service", () => {
  it("should not send empty messages", async () => {
    await sendChatMessage("", "user123", "Test User", "avatar.jpg");
    expect(addDoc).not.toHaveBeenCalled();
  });

  it("should send valid message", async () => {
    const message = "Test message";
    (addDoc as any).mockResolvedValue({ id: "newMessageId" });

    await sendChatMessage(message, "user123", "Test User", "avatar.jpg");

    expect(collection).toHaveBeenCalledWith(db, "chats");
    expect(addDoc).toHaveBeenCalled();
  });
}); 