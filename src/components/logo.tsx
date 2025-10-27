import { MessagesSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <MessagesSquare className="h-7 w-7 text-primary" />
      <h1 className="text-xl font-headline font-semibold text-foreground">
        ChatStatus
      </h1>
    </div>
  );
}
