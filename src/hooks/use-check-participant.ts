'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from './use-toast';

/**
 * Hook que verifica si el usuario actual sigue siendo participante del chat
 * Si es removido, redirige al dashboard con notificación
 */
export function useCheckParticipant(chatId: string, chatName?: string) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [wasParticipant, setWasParticipant] = useState(true);
  const [hasShownRemovalMessage, setHasShownRemovalMessage] = useState(false);

  useEffect(() => {
    if (!firestore || !user || !chatId || hasShownRemovalMessage) return;

    const chatRef = doc(firestore, 'chats', chatId);
    
    // Escuchar cambios en tiempo real del chat
    const unsubscribe = onSnapshot(
      chatRef, 
      (snapshot) => {
        if (!snapshot.exists()) {
          // El chat fue eliminado
          if (!hasShownRemovalMessage) {
            toast({
              variant: "destructive",
              title: "Grupo eliminado",
              description: "Este grupo ha sido eliminado por un administrador.",
            });
            setHasShownRemovalMessage(true);
            router.push('/dashboard');
          }
          return;
        }

        const chatData = snapshot.data();
        const participantIds = chatData?.participantIds || [];
        const isParticipant = participantIds.includes(user.uid);

        // Si era participante y ahora no lo es, fue expulsado
        if (wasParticipant && !isParticipant && !hasShownRemovalMessage) {
          toast({
            variant: "destructive",
            title: "Has sido eliminado del grupo",
            description: `Has sido removido de ${chatName || 'este grupo'} por un administrador.`,
          });
          setHasShownRemovalMessage(true);
          router.push('/dashboard');
        }

        setWasParticipant(isParticipant);
      }, 
      (error) => {
        console.error('Error listening to chat:', error);
        
        // Si hay error de permisos, el usuario ya no tiene acceso
        // Esto sucede cuando fue removido del grupo
        if (error.code === 'permission-denied' && !hasShownRemovalMessage) {
          toast({
            variant: "destructive",
            title: "Has sido eliminado del grupo",
            description: `Ya no tienes acceso a ${chatName || 'este grupo'}. Has sido removido por un administrador.`,
          });
          setHasShownRemovalMessage(true);
          router.push('/dashboard');
        }
      }
    );

    return () => unsubscribe();
  }, [firestore, user, chatId, router, toast, wasParticipant, chatName, hasShownRemovalMessage]);

  return wasParticipant;
}
