'use client';
import { useMemo } from 'react';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Chat, User } from '@/lib/types';

// Hook mejorado que usa timestamps de última lectura almacenados en el perfil del usuario
// Esto evita leer todos los mensajes y problemas de permisos
export function useUnreadMessages(chat: Chat & { id: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Obtener el perfil del usuario actual para acceder a los timestamps de última lectura
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<User>(userDocRef);

  const unreadCount = useMemo(() => {
    if (!user || !chat.lastMessageAt) return 0;

    // Si el usuario actual envió el último mensaje, no hay mensajes no leídos
    if (chat.lastMessageSender === user.uid) {
      return 0;
    }

    // Obtener el timestamp de última lectura para este chat específico
    const lastReadAt = userProfile?.chatLastReadAt?.[chat.id];

    if (!lastReadAt) {
      // Si nunca se ha leído este chat, considerar que hay mensajes no leídos
      // si el chat tiene mensajes recientes (últimas 24 horas)
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const lastMessageTime = new Date(chat.lastMessageAt).getTime();
      return lastMessageTime > oneDayAgo ? 1 : 0;
    }

    // Si el último mensaje es más reciente que la última lectura, hay mensajes no leídos
    const lastMessageTime = new Date(chat.lastMessageAt).getTime();
    return lastMessageTime > lastReadAt ? 1 : 0;
  }, [user, chat, userProfile]);

  return {
    unreadCount,
    isLoading: false,
    hasUnread: unreadCount > 0
  };
}