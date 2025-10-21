export type User = {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: 'admin' | 'user' | 'moderator';
  photo: string;
  lastLogin: string; // ISO String
  status: 'active' | 'inactive' | 'busy' | 'away';
};

export type Chat = {
  id: string;
  name?: string; // For group chats
  type: 'private' | 'group';
  participantIds: string[];
  createdAt: string; // ISO string
  lastMessage?: string;
  lastMessageAt?: string; // ISO string
  createdBy: string;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image';
  readBy: string[];
  sentAt: string; // ISO String
  edited: boolean;
};

    