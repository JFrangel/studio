import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';

interface UserAvatarProps {
  user: User;
  className?: string;
  showStatus?: boolean;
}

const statusColorMap = {
  activo: 'bg-green-500',
  ausente: 'bg-yellow-500',
  ocupado: 'bg-red-500',
  inactivo: 'bg-gray-400',
};

export function UserAvatar({ user, className, showStatus = true }: UserAvatarProps) {
  const fallback = user.nombre
    .split(' ')
    .map((n) => n[0])
    .join('');
    
  return (
    <div className="relative">
      <Avatar className={cn('h-10 w-10', className)}>
        <AvatarImage src={user.foto} alt={user.nombre} data-ai-hint="person portrait" />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showStatus && user.estado && (
        <span className={cn(
          'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background',
          statusColorMap[user.estado]
        )} />
      )}
    </div>
  );
}
