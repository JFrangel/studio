import type { User, Chat, Message } from './types';

// This file is now deprecated in favor of real-time data from Firestore.
// It is kept for reference but is no longer used in the application.

export const users: User[] = [
  {
    id: "u1",
    nombre: "Jose Frangel",
    email: "jose@example.com",
    rol: "admin",
    foto: "https://picsum.photos/seed/user1/200/200",
    ultimoLogin: "2025-10-20T15:45:00Z",
    estado: "activo"
  },
];

export const chats: Chat[] = [];

export const messages: { [key: string]: Message[] } = {};

export const currentUser: User = users[0];
