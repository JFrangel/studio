'use client';

import { useState } from 'react';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, doc, arrayUnion } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Key } from 'lucide-react';
import type { Chat } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface JoinGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinGroupDialog({ open, onOpenChange }: JoinGroupDialogProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [groupPin, setGroupPin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [foundGroup, setFoundGroup] = useState<(Chat & { id: string }) | null>(null);

  const handleSearchGroup = async () => {
    if (!groupPin.trim() || !firestore || !currentUser) return;

    setIsSearching(true);
    setError('');
    setFoundGroup(null);

    try {
      // Buscar grupo por PIN
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('type', '==', 'group'),
        where('groupPin', '==', groupPin.trim())
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('Group not found. Please check the PIN and try again.');
        setIsSearching(false);
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const group = { id: groupDoc.id, ...groupDoc.data() } as Chat & { id: string };

      // Verificar si el grupo es privado y el usuario no está invitado
      if (!group.isPublic && !group.participantIds.includes(currentUser.uid)) {
        setError('This is a private group. You need an invitation to join.');
        setIsSearching(false);
        return;
      }

      // Verificar si el usuario ya es miembro
      if (group.participantIds.includes(currentUser.uid)) {
        // Ya es miembro, simplemente navegar al chat
        router.push(`/dashboard/chat/${group.id}`);
        onOpenChange(false);
        setGroupPin('');
        setIsSearching(false);
        return;
      }

      setFoundGroup(group);
    } catch (error) {
      console.error('Error searching group:', error);
      setError('Error searching for group');
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!foundGroup || !firestore || !currentUser) return;

    setIsSearching(true);
    setError('');

    try {
      const chatRef = doc(firestore, 'chats', foundGroup.id);
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayUnion(currentUser.uid),
        },
        { merge: true }
      );

      // Navegar al chat del grupo
      router.push(`/dashboard/chat/${foundGroup.id}`);
      onOpenChange(false);
      setGroupPin('');
      setFoundGroup(null);
    } catch (error) {
      console.error('Error joining group:', error);
      setError('Error joining group');
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setGroupPin('');
    setFoundGroup(null);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => {
      onOpenChange(isOpen);
      if (!isOpen) handleReset();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Join Group</DialogTitle>
          <DialogDescription>
            Enter the group PIN to find and join a group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!foundGroup ? (
            <>
              {/* Group PIN Input */}
              <div>
                <Label htmlFor="group-pin">Group PIN</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="group-pin"
                      placeholder="Enter 6-digit PIN"
                      value={groupPin}
                      onChange={(e) => setGroupPin(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearchGroup();
                        }
                      }}
                      maxLength={6}
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSearchGroup}
                    disabled={isSearching || !groupPin.trim() || groupPin.length < 6}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Ask the group admin for the group PIN
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                  {error}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Group Found */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-4xl">
                    {foundGroup.groupImage || '👥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg">{foundGroup.name}</h3>
                    {foundGroup.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {foundGroup.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {foundGroup.participantIds.length} members
                      </span>
                      {foundGroup.isPublic && (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 rounded-full">
                          Public
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 border rounded-md hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleJoinGroup}
                    disabled={isSearching}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSearching ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
