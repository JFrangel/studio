export type User = {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario' | 'moderador';
  foto: string;
  ultimoLogin: string; // ISO String
  estado: 'activo' | 'inactivo' | 'ocupado' | 'ausente';
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
