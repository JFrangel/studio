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
    if (user.avatarSeed) {
      // El avatarSeed viene en formato "style-seed" (ej: "avataaars-preview-123")
      const seedParts = user.avatarSeed.split('-');
      const style = seedParts[0] as AvatarStyle;
      const actualSeed = seedParts.slice(1).join('-'); // El resto es el seed
      avatarSrc = getAvatarUrl(actualSeed, style);
    } else {
      // Fallback si no hay avatarSeed
      const seed = generateAvatarSeed(user.id || user.email || 'default');
      const style = getDefaultAvatarStyle();
      avatarSrc = getAvatarUrl(seed, style);
    }
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

    