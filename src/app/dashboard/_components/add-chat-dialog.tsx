'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function AddChatDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateChat = async () => {
    if (!firestore || !currentUser || !pin) {
      setError('El PIN del usuario es requerido.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Find the user by PIN
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('pin', '==', pin));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Usuario con ese PIN no encontrado.');
      }

      const otherUserDoc = querySnapshot.docs[0];
      const otherUser = otherUserDoc.data() as User;
      const otherUserId = otherUserDoc.id;
      
      // Si es el mismo usuario, abrir su chat personal (notas)
      if(otherUserId === currentUser.uid) {
        // Buscar el chat personal
        const chatsRef = collection(firestore, 'chats');
        const personalChatQuery = query(
          chatsRef,
          where('type', '==', 'private'),
          where('participantIds', '==', [currentUser.uid])
        );
        const personalChatsSnapshot = await getDocs(personalChatQuery);
        
        if (!personalChatsSnapshot.empty) {
          // Ya existe el chat personal
          const personalChatId = personalChatsSnapshot.docs[0].id;
          onOpenChange(false);
          setPin('');
          router.push(`/dashboard/chat/${personalChatId}`);
          return;
        } else {
          // Crear chat personal si no existe
          const newPersonalChatRef = await addDoc(collection(firestore, 'chats'), {
            createdAt: new Date().toISOString(),
            createdBy: currentUser.uid,
            participantIds: [currentUser.uid],
            type: 'private',
          });
          
          toast({
            title: "Chat personal abierto",
            description: "Este es tu espacio personal para notas.",
          });
          onOpenChange(false);
          setPin('');
          router.push(`/dashboard/chat/${newPersonalChatRef.id}`);
          return;
        }
      }

      // 2. Check if a private chat already exists
      const chatsRef = collection(firestore, 'chats');
      const existingChatQuery = query(
        chatsRef,
        where('type', '==', 'private'),
        where('participantIds', 'array-contains', currentUser.uid)
      );
      const existingChatsSnapshot = await getDocs(existingChatQuery);
      
      const chatAlreadyExists = existingChatsSnapshot.docs.some(doc => {
         const chat = doc.data();
         return chat.participantIds.includes(otherUserId) && chat.participantIds.length === 2;
      });
      
      if (chatAlreadyExists) {
        throw new Error('Ya existe un chat con este usuario.');
      }


      // 3. Create a new chat
      const newChatRef = await addDoc(collection(firestore, 'chats'), {
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        participantIds: [currentUser.uid, otherUserId],
        type: 'private',
      });
      
      toast({
        title: "Chat creado!",
        description: `Ahora puedes chatear con ${otherUser.name}.`,
      });
      onOpenChange(false);
      setPin('');
      router.push(`/dashboard/chat/${newChatRef.id}`);

    } catch (e: any) {
      setError(e.message || 'Error al crear el chat.');
      toast({
        variant: "destructive",
        title: "¡Oh no! Algo salió mal.",
        description: e.message || 'No se pudo crear el chat.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Iniciar un Nuevo Chat</DialogTitle>
          <DialogDescription>
            Ingresa el PIN de 6 dígitos del usuario con el que quieres chatear.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pin" className="text-right">
              PIN Usuario
            </Label>
            <Input
              id="pin"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="col-span-3"
              placeholder="123456"
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleCreateChat} disabled={isLoading}>
            {isLoading ? 'Creando...' : 'Crear Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
