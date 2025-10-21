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
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc } from 'firebase/firestore';
import type { Chat, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { AddChatDialog } from './add-chat-dialog';

function ChatListItem({ chat }: { chat: Chat & { id: string } }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const isPersonalChat = chat.participantIds.length === 1 && chat.participantIds[0] === currentUser?.uid;

  // Find the other participant if it's a private chat with someone else
  const otherParticipantId = !isPersonalChat && chat.type === 'private' 
    ? chat.participantIds.find(p => p !== currentUser?.uid)
    : null;

  const otherUserQuery = useMemoFirebase(() => {
    if (!firestore || !otherParticipantId) return null;
    return query(collection(firestore, 'users'), where('id', '==', otherParticipantId));
  }, [firestore, otherParticipantId]);

  const { data: otherUsers } = useCollection<User>(otherUserQuery);
  const otherUser = otherUsers?.[0];

  const getChatDetails = () => {
    if (isPersonalChat) {
      return {
        name: chat.name || 'My Notes', // Use chat name or default
        avatarUser: null,
        isPersonal: true
      };
    }
    if (chat.type === 'private') {
      return {
        name: otherUser?.name || 'Private Chat',
        avatarUser: otherUser,
        isPersonal: false
      };
    }
    // Group chat
    return {
      name: chat.name || 'Group Chat',
      avatarUser: null,
      isPersonal: false
    };
  };

  const { name, avatarUser, isPersonal } = getChatDetails();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href={`/dashboard/chat/${chat.id}`}>
          {isPersonal ? (
             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">📝</div>
          ) : avatarUser ? (
            <UserAvatar user={avatarUser} className="h-8 w-8" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {chat.participantIds.length}
            </div>
          )}
          <span className="flex-1 truncate">{name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}


export function ChatList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddChatOpen, setAddChatOpen] = useState(false);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chats'), where('participantIds', 'array-contains', user.uid));
  }, [firestore, user]);

  const { data: chats, isLoading } = useCollection<Chat>(chatsQuery);

  return (
    <>
    <AddChatDialog open={isAddChatOpen} onOpenChange={setAddChatOpen} />
    <div className="flex flex-col gap-2">
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupAction onClick={() => setAddChatOpen(true)}>
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
    </>
  );
}
