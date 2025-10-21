export type User = {
  id: string;
  name: string;
  email: string;
  pin: string;
  role: 'admin' | 'user' | 'moderator';
  photo: string;
  avatarStyle?: 'photo' | 'avatar'; // 'photo' para imagen real, 'avatar' para avatar animado
  avatarSeed?: string; // Identificador único para generar el avatar consistentemente
  lastLogin: string; // ISO String
  status: 'active' | 'inactive' | 'busy' | 'away';
  description?: string;
  searchable?: boolean; // true = aparece en búsquedas, false/undefined = privado
};

export type Chat = {
  id: string;
  name?: string; // For group chats
  description?: string; // Group description
  type: 'private' | 'group';
  participantIds: string[];
  createdAt: string; // ISO string
  lastMessage?: string;
  lastMessageAt?: string; // ISO string
  createdBy: string;
  adminIds?: string[]; // Co-creadores/administradores del grupo (incluye al creador)
  groupImage?: string; // URL or emoji for group image
  groupPin?: string; // PIN único del grupo para unirse
  isPublic?: boolean; // true = público (se puede buscar), false/undefined = privado (solo por invitación)
  inviteCode?: string; // Código de invitación único para enlaces
  deletedBy?: string[]; // Array de user IDs que eliminaron el chat
  archivedBy?: string[]; // Array de user IDs que archivaron el chat
  mutedBy?: string[]; // Array de user IDs que silenciaron el chat
  pinnedBy?: string[]; // Array de user IDs que fijaron el chat
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  readBy: string[];
  sentAt: string; // ISO String
  edited: boolean;
  imageUrl?: string; // URL de la imagen en Firebase Storage
  fileUrl?: string; // URL del archivo en Firebase Storage
  fileName?: string; // Nombre original del archivo
  fileSize?: number; // Tamaño del archivo en bytes
};
