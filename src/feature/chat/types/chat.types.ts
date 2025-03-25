export interface ChatMessageType {
  id?: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  userPhotoURL?: string;
} 