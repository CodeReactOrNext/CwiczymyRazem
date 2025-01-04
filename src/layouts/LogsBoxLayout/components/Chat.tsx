import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ChatMessage } from "types/chat.types";
import { db } from "utils/firebase/client/firebase.utils";
import { useAppSelector } from "store/hooks";
import { selectUserAuth, selectUserAvatar, selectUserInfo, selectUserName } from "feature/user/store/userSlice";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUserId = useAppSelector(selectUserAuth);
    const currentUserName = useAppSelector(selectUserName);
    const avatar = useAppSelector(selectUserAvatar);


    

  useEffect(() => {
    const q = query(
      collection(db, "chats"),
      orderBy("timestamp", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(messages.reverse());
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
   
    
    e.preventDefault();
    if (!newMessage.trim() ) return;

    try {
      await addDoc(collection(db, "chats"), {
        userId: currentUserId,
        username: currentUserName|| "Anonymous",
        message: newMessage,
        timestamp: serverTimestamp(),
        userPhotoURL: avatar,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat ${
              msg.userId === currentUserId ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img
                  src={msg.userPhotoURL || "/default-avatar.png"}
                  alt="avatar"
                />
              </div>
            </div>
            <div className="chat-header">{msg.username}</div>
            <div className="chat-bubble">{msg.message}</div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="join w-full">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="input input-bordered join-item w-full"
            placeholder="Type a message..."
          />
          <button type="submit" className="btn join-item">
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
