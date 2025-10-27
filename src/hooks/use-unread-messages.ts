'use client';
import { useMemo } from 'react';
import { useUser, useDoc, useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Chat, User, Message } from '@/lib/types';

// Hook mejorado que cuenta los mensajes no leídos reales
export function useUnreadMessages(chat: Chat & { id: string }) {
  const { user } = useUser();
  const firestore = useFirestore();

  // Obtener el perfil del usuario actual para acceder a los timestamps de última lectura
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<User>(userDocRef);

  // Obtener los mensajes del chat para contar los no leídos
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    
    // Obtener el timestamp de última lectura
    const lastReadAt = userProfile?.chatLastReadAt?.[chat.id] || 0;
    
    // Query para obtener solo mensajes después de la última lectura
    // y que no sean del usuario actual
    return query(
      collection(firestore, 'chats', chat.id, 'messages'),
      where('sentAt', '>', new Date(lastReadAt).toISOString()),
      orderBy('sentAt', 'desc')
    );
  }, [firestore, user, chat.id, userProfile?.chatLastReadAt]);

  const { data: unreadMessages } = useCollection<Message>(messagesQuery);

  const unreadCount = useMemo(() => {
    if (!user || !chat.lastMessageAt) return 0;

    // Si el usuario actual envió el último mensaje, no hay mensajes no leídos
    if (chat.lastMessageSender === user.uid) {
      return 0;
    }

    // Si tenemos los mensajes no leídos, filtrar los que no son del usuario actual
    if (unreadMessages) {
      const count = unreadMessages.filter(msg => msg.senderId !== user.uid).length;
      return count;
    }

    // Fallback: usar la lógica anterior si no hay mensajes
    const lastReadAt = userProfile?.chatLastReadAt?.[chat.id];

    if (!lastReadAt) {
      // Si nunca se ha leído este chat, mostrar indicador genérico
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const lastMessageTime = new Date(chat.lastMessageAt).getTime();
      return lastMessageTime > oneDayAgo ? 1 : 0;
    }

    // Si el último mensaje es más reciente que la última lectura, hay mensajes no leídos
    const lastMessageTime = new Date(chat.lastMessageAt).getTime();
    return lastMessageTime > lastReadAt ? 1 : 0;
  }, [user, chat, userProfile, unreadMessages]);

  return {
    unreadCount,
    isLoading: false,
    hasUnread: unreadCount > 0
  };
}