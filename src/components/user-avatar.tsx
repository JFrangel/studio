import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import { getAvatarUrl, generateAvatarSeed, getDefaultAvatarStyle, type AvatarStyle } from '@/lib/avatars';

interface UserAvatarProps {
  user: Partial<User>;
  className?: string;
  showStatus?: boolean;
}

const statusColorMap: { [key: string]: string } = {
  active: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  inactive: 'bg-gray-400',
};

export function UserAvatar({ user, className, showStatus = true }: UserAvatarProps) {
  const fallback = user.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
    : '??';
  
  // Determinar qué imagen usar
  let avatarSrc = user.photo;
  
  // Si el usuario eligió usar avatar animado o no tiene foto
  if (user.avatarStyle === 'avatar' || !user.photo || user.photo.includes('pravatar.cc')) {
    const seed = user.avatarSeed || generateAvatarSeed(user.id || user.email || 'default');
    const style = (user.avatarSeed?.split('-')[0] || getDefaultAvatarStyle()) as AvatarStyle;
    avatarSrc = getAvatarUrl(seed, style);
  }
    
  return (
    <div className="relative">
      <Avatar className={cn('h-10 w-10', className)}>
        <AvatarImage src={avatarSrc} alt={user.name} data-ai-hint="person portrait" />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      {showStatus && user.status && (
        <span className={cn(
          'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background',
          statusColorMap[user.status]
        )} />
      )}
    </div>
  );
}

    