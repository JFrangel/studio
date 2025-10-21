'use client';
import { useEffect, useRef } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { currentUser, users } from '@/lib/data';
import type { Message } from '@/lib/types';
import { format } from 'date-fns';

export function ChatMessages({ messages }: { messages: Message[] }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {messages.map((message) => {
          const sender = users.find((u) => u.id === message.remitenteId);
          const isSelf = message.remitenteId === currentUser.id;

          if (!sender) return null;

          return (
            <div
              key={message.id}
              className={cn('flex items-start gap-3', {
                'flex-row-reverse': isSelf,
              })}
            >
              <UserAvatar user={sender} showStatus={false} />
              <div
                className={cn('flex flex-col gap-1', {
                  'items-end': isSelf,
                })}
              >
                <div
                  className={cn(
                    'max-w-xs rounded-lg p-3 text-sm shadow-md md:max-w-md',
                    {
                      'bg-primary text-primary-foreground': isSelf,
                      'bg-card': !isSelf,
                    }
                  )}
                >
                  {!isSelf && (
                    <p className="mb-1 text-xs font-semibold text-primary">
                      {sender.nombre}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">{message.contenido}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(message.enviadoEn), 'p')}
                  {message.editado && <span> (edited)</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
