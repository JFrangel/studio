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
  nombre?: string; // For group chats
  tipo: 'privado' | 'grupal';
  participantIds: string[];
  creadoEn: string; // ISO string
  ultimoMensaje?: string;
  ultimoMensajeEn?: string; // ISO string
  creadoPor: string;
};

export type Message = {
  id: string;
  senderId: string;
  content: string;
  type: 'texto' | 'imagen';
  readBy: string[];
  sentAt: string; // ISO String
  edited: boolean;
};
