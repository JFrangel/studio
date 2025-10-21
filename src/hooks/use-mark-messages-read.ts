'use client';
import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export function useMarkMessagesAsRead(chatId: string) {
  const { user } = useUser();
  const firestore = useFirestore();
  const lastUpdateRef = useRef<number>(0);
  const isUpdatingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user || !firestore || !chatId) return;

    const updateReadTimestamp = async () => {
      // Evitar actualizaciones concurrentes
      if (isUpdatingRef.current) return;
      
      const now = Date.now();
      // Solo actualizar si han pasado al menos 2 segundos desde la última actualización
      if (now - lastUpdateRef.current < 2000) return;
      
      isUpdatingRef.current = true;
      lastUpdateRef.current = now;
      
      try {
        const userDocRef = doc(firestore, 'users', user.uid);

        // Usar setDoc con merge para asegurar que se actualice
        await setDoc(userDocRef, {
          chatLastReadAt: {
            [chatId]: now
          }
        }, { merge: true });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      } finally {
        isUpdatingRef.current = false;
      }
    };

    // Actualizar inmediatamente al abrir el chat
    updateReadTimestamp();

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

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      // Actualizar una última vez al salir del chat (respetando el throttle)
      const cleanup = async () => {
        const now = Date.now();
        if (now - lastUpdateRef.current >= 2000) {
          try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, {
              chatLastReadAt: {
                [chatId]: now
              }
            }, { merge: true });
          } catch (error) {
            // Silenciar errores en cleanup
          }
        }
      };
      cleanup();
    };
  }, [chatId, user, firestore]);
}