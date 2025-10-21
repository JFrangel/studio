'use client';
import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function useMarkMessagesAsRead(chatId: string) {
  const { user } = useUser();
  const firestore = useFirestore();
  const hasMarkedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user || !firestore || !chatId) return;

    const updateReadTimestamp = async () => {
      try {
        const now = Date.now();
        const userDocRef = doc(firestore, 'users', user.uid);

        // Usar setDoc con merge para asegurar que se actualice
        await setDoc(userDocRef, {
          chatLastReadAt: {
            [chatId]: now
          }
        }, { merge: true });

        console.log(`✅ Mensajes marcados como leídos para chat ${chatId} en timestamp ${now}`);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    // Actualizar inmediatamente al abrir el chat (solo una vez)
    if (!hasMarkedRef.current) {
      hasMarkedRef.current = true;
      updateReadTimestamp();
    }

    // Actualizar cuando el usuario vuelve a la pestaña
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateReadTimestamp();
      }
    };

    // Actualizar cuando el usuario hace focus en la ventana
    const handleFocus = () => {
      updateReadTimestamp();
    };

    // Actualizar cuando hay scroll (el usuario está viendo los mensajes)
    const handleScroll = () => {
      updateReadTimestamp();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('scroll', handleScroll);
      // Actualizar una última vez al salir del chat
      updateReadTimestamp();
    };
  }, [chatId, user, firestore]);
}