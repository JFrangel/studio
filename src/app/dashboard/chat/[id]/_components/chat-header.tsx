import { UserAvatar } from '@/components/user-avatar';
import { users } from '@/lib/data';
import type { Chat } from '@/lib/types';
import { Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ChatHeader({ chat }: { chat: Chat }) {
  const getChatDetails = () => {
    if (chat.tipo === 'privado') {
      const otherUserId = chat.participantes.find(p => p !== 'u1');
      const otherUser = users.find(u => u.id === otherUserId);
      return {
        name: otherUser?.nombre || 'Private Chat',
        description: otherUser?.estado === 'activo' ? 'Online' : 'Offline',
      };
    }
    return {
      name: chat.nombre || 'Group Chat',
      description: `${chat.participantes.length} members`,
    };
  };

  const { name, description } = getChatDetails();
  const participantUsers = users.filter(u => chat.participantes.includes(u.id));

  return (
    <div className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        {chat.tipo === 'privado' ? (
          <UserAvatar user={participantUsers.find(u => u.id !== 'u1')!} />
        ) : (
          <div className="relative flex -space-x-2">
            {participantUsers.slice(0, 3).map(user => (
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
