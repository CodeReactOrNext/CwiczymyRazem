import { useState, useEffect, useRef } from "react";
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
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserInfo,
  selectUserName,
} from "feature/user/store/userSlice";
import Avatar from "components/Avatar";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const currentUserId = useAppSelector(selectUserAuth);
  const currentUserName = useAppSelector(selectUserName);
  const avatar = useAppSelector(selectUserAvatar);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, "chats"), {
        userId: currentUserId,
        username: currentUserName || "Anonymous",
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
    <div className='flex h-full flex-col'>
      <div className='flex-1 space-y-4 overflow-y-auto p-4'>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat ${
              msg.userId === currentUserId ? "chat-end" : "chat-start"
            }`}>
            <div className='avatar chat-image'>
              <Avatar
                avatarURL={msg.userPhotoURL}
                name={msg.username!}
                size='sm'
              />
            </div>
            <div className='chat-header'>{msg.username}</div>
            <div className='chat-bubble flex items-center'>{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className='border-t p-4'>
        <div className='flex gap-2'>
          <Input
            type='text'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder='Type a message...'
            className='flex-1'
          />
          <Button type='submit'>Send</Button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
