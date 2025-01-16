export interface ChatMessage {
  id?: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  userPhotoURL?: string;
} 