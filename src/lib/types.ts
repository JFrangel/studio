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
  chatLastReadAt?: Record<string, number>; // Timestamps de última lectura por chat (chatId -> timestamp)
};

export type JoinRequest = {
  userId: string;
  userName: string;
  userEmail: string;
  requestedAt: string; // ISO string
  status: 'pending' | 'approved' | 'rejected';
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
  lastMessageSender?: string; // ID del usuario que envió el último mensaje
  createdBy: string;
  adminIds?: string[]; // Co-creadores/administradores del grupo (incluye al creador)
  groupImage?: string; // URL or emoji for group image
  groupAvatarStyle?: 'emoji' | 'avatar'; // 'emoji' para emoji, 'avatar' para avatar animado
  groupAvatarSeed?: string; // Seed para avatar animado de grupo (formato: "style-seed")
  groupPin?: string; // PIN único del grupo para unirse
  visibility?: 'public' | 'private'; // 'public' = cualquiera puede unirse, 'private' = requiere aprobación
  inviteCode?: string; // Código de invitación único para enlaces
  joinRequests?: JoinRequest[]; // Solicitudes pendientes de unión para grupos privados
  /** @deprecated Use visibility instead. Kept for backward compatibility */
  isPublic?: boolean; // DEPRECATED: usar visibility
  deletedBy?: string[]; // Array de user IDs que eliminaron el chat
  archivedBy?: string[]; // Array de user IDs que archivaron el chat
  mutedBy?: string[]; // Array de user IDs que silenciaron el chat
  pinnedBy?: string[]; // Array de user IDs que fijaron el chat
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system'; // Añadido 'system' para mensajes del sistema
  readBy: string[];
  sentAt: string; // ISO String
  edited: boolean;
  imageUrl?: string; // URL de la imagen en Firebase Storage
  fileUrl?: string; // URL del archivo en Firebase Storage
  fileName?: string; // Nombre original del archivo
  fileSize?: number; // Tamaño del archivo en bytes
  systemMessageType?: 'group_created' | 'description_updated' | 'icon_updated' | 'user_joined' | 'user_left' | 'member_joined' | 'member_left'; // Tipo de mensaje del sistema
};
