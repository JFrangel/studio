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
import { chats, users } from '@/lib/data';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';

export function ChatList() {
  const getChatDetails = (chat: (typeof chats)[0]) => {
    if (chat.tipo === 'privado') {
      const otherUserId = chat.participantes.find(p => p !== 'u1');
      const otherUser = users.find(u => u.id === otherUserId);
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

  return (
    <div className="flex flex-col gap-2">
      <SidebarGroup>
        <SidebarGroupLabel>Chats</SidebarGroupLabel>
        <SidebarGroupAction>
          <PlusCircle className="size-4" />
        </SidebarGroupAction>
        <SidebarMenu>
          {chats.map((chat) => {
            const { name, avatarUser } = getChatDetails(chat);
            return (
              <SidebarMenuItem key={chat.id}>
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
                    <Badge variant="secondary" className="h-5">3</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}
