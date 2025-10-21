'use client';
import { useEffect, useRef } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import type { Message, User } from '@/lib/types';
import { format } from 'date-fns';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function MessageItem({ message }: { message: Message & { id: string } }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const isSelf = message.remitenteId === currentUser?.uid;

  const senderQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('id', '==', message.remitenteId));
  }, [firestore, message.remitenteId]);

  const { data: senders } = useCollection<User>(senderQuery);
  const sender = senders?.[0];
  
  if (!sender) {
    return (
       <div className={cn('flex items-start gap-3', { 'flex-row-reverse': isSelf })}>
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className={cn('flex flex-col gap-1', { 'items-end': isSelf })}>
             <Skeleton className="h-16 w-48" />
             <Skeleton className="h-4 w-20" />
          </div>
       </div>
    );
  }

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
          {message.enviadoEn ? format(new Date(message.enviadoEn), 'p') : ''}
          {message.editado && <span> (edited)</span>}
        </div>
      </div>
    </div>
  );
}


export function ChatMessages({ messages, isLoading }: { messages: Message[], isLoading: boolean }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6">
      <div className="flex flex-col gap-4">
        {isLoading && (
          <>
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-16 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1 items-end">
                <Skeleton className="h-16 w-48" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </>
        )}
        {messages.map((message) => (
          <MessageItem key={message.id} message={message as Message & { id: string }} />
        ))}
      </div>
    </div>
  );
}
