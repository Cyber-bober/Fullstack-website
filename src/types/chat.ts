export type ChatUser = {
  id: string;
  fullName: string;
  username: string;
  photos: string[];
};

export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
  };
};

export type Conversation = {
  user: ChatUser;
  lastMessage: ChatMessage;
  unreadCount: number;
};