import { Crown, Shield, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RoleBadgeProps {
  type: 'platform-admin' | 'group-creator' | 'group-admin';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoleBadge({ type, size = 'sm', className }: RoleBadgeProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const badges = {
    'platform-admin': {
      icon: Crown,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      title: 'Administrador de Plataforma',
    },
    'group-creator': {
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      title: 'Creador del Grupo',
    },
    'group-admin': {
      icon: Shield,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      title: 'Co-creador del Grupo',
    },
  };

  const badge = badges[type];
  const Icon = badge.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full p-0.5 cursor-help',
              badge.bg,
              className
            )}
          >
            <Icon className={cn(sizeClasses[size], badge.color)} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{badge.title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface GroupBadgeProps {
  className?: string;
}

export function GroupBadge({ className }: GroupBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center rounded-full bg-primary/10 px-1.5 py-0.5 cursor-help',
              className
            )}
          >
            <span className="text-[10px] font-bold text-primary">G</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Insignia de Grupo</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
