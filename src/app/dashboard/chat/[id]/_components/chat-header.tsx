'use client';
import { UserAvatar } from '@/components/user-avatar';
import type { Chat, User } from '@/lib/types';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

export function ChatHeader({ chat }: { chat: Chat & {id: string} }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const participantIds = chat.participantes.filter(p => p !== currentUser?.uid);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || participantIds.length === 0) return null;
    return query(collection(firestore, 'users'), where('id', 'in', participantIds));
  }, [firestore, participantIds]);

  const { data: participantUsers } = useCollection<User>(usersQuery);

  const getChatDetails = () => {
    if (chat.tipo === 'privado') {
      const otherUser = participantUsers?.[0];
      return {
        name: otherUser?.nombre || 'Private Chat',
        description: otherUser?.estado === 'activo' ? 'Online' : 'Offline',
        userForAvatar: otherUser
      };
    }
    return {
      name: chat.nombre || 'Group Chat',
      description: `${chat.participantes.length} members`,
      userForAvatar: null
    };
  };

  const { name, description, userForAvatar } = getChatDetails();
  
  return (
    <div className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {chat.tipo === 'privado' ? (
           userForAvatar && <UserAvatar user={userForAvatar} />
        ) : (
          <div className="relative flex -space-x-2">
            {participantUsers?.slice(0, 3).map(user => (
              <UserAvatar key={user.id} user={user} className="h-9 w-9 border-2 border-card" />
            ))}
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="text-base font-semibold font-headline">{name}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
