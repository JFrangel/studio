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
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const handleCreateChat = async () => {
    if (!firestore || !currentUser || !email) {
      setError('Email is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Find the user by email
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('User not found.');
      }

      const otherUser = querySnapshot.docs[0].data() as User;
      const otherUserId = otherUser.id;
      
      if(otherUserId === currentUser.uid) {
        throw new Error("You can't start a chat with yourself.");
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
        throw new Error('A chat with this user already exists.');
      }


      // 3. Create a new chat
      const newChatRef = await addDoc(collection(firestore, 'chats'), {
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        participantIds: [currentUser.uid, otherUserId],
        type: 'private',
      });
      
      toast({
        title: "Chat created!",
        description: `You can now chat with ${otherUser.nombre}.`,
      });
      onOpenChange(false);
      setEmail('');
      router.push(`/dashboard/chat/${newChatRef.id}`);

    } catch (e: any) {
      setError(e.message || 'Failed to create chat.');
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: e.message || 'Could not create the chat.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
          <DialogDescription>
            Enter the email address of the user you want to chat with.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="name@example.com"
            />
          </div>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleCreateChat} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
