'use client';
import { useEffect } from 'react';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export function useMarkMessagesAsRead(chatId: string) {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore || !chatId) return;

    // Actualizar el timestamp de última lectura para este chat
    const userDocRef = doc(firestore, 'users', user.uid);
    const now = Date.now();

    setDocumentNonBlocking(userDocRef, {
      [`chatLastReadAt.${chatId}`]: now
    }, { merge: true });
  }, [chatId, user, firestore]);
}