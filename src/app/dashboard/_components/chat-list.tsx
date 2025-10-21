'use client';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupAction,
} from '@/components/ui/sidebar';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Chat, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function ChatListItem({ chat }: { chat: Chat & { id: string } }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const otherParticipantId = chat.participantes.find(p => p !== currentUser?.uid);

  const otherUserQuery = useMemoFirebase(() => {
    if (!firestore || !otherParticipantId) return null;
    return query(collection(firestore, 'users'), where('id', '==', otherParticipantId));
  }, [firestore, otherParticipantId]);

  const { data: otherUsers } = useCollection<User>(otherUserQuery);
  const otherUser = otherUsers?.[0];

  const getChatDetails = () => {
    if (chat.tipo === 'privado') {
      return {
        name: otherUser?.nombre || 'Private Chat',
        avatarUser: otherUser,
      };
    }
    return {
      name: chat.nombre || 'Group Chat',
      avatarUser: null,
    };
  };

  const { name, avatarUser } = getChatDetails();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href={`/dashboard/chat/${chat.id}`}>
          {avatarUser ? (
            <UserAvatar user={avatarUser} className="h-8 w-8" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {chat.participantes.length}
            </div>
          )}
          <span className="flex-1 truncate">{name}</span>
          {/* Unread count logic to be implemented */}
          {/* <Badge variant="secondary" className="h-5">3</Badge> */}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}


export function ChatList() {
  const { user } = useUser();
  const firestore = useFirestore();

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chats'), where('participantes', 'array-contains', user.uid));
  }, [firestore, user]);

  const { data: chats, isLoading } = useCollection<Chat>(chatsQuery);

  return (
    <div className="flex flex-col gap-2">
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupAction>
          <PlusCircle className="size-4" />
        </SidebarGroupAction>
        <SidebarMenu>
          {isLoading && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
          {chats?.map((chat) => (
            <ChatListItem key={chat.id} chat={chat} />
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}
