'use client';

import { use } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { ChatHeader } from './_components/chat-header';
import { ChatMessages } from './_components/chat-messages';
import { MessageInput } from './_components/message-input';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Chat, Message } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { id: chatId } = use(params);

  const chatRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);

  const { data: chat, isLoading: chatLoading, error: chatError } = useDoc<Chat>(chatRef);

  const messagesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('sentAt', 'asc'));
    },
    [firestore, chatId]
  );
  const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);

  // Show loading state
  if (chatLoading || !user) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-20 w-3/4" />
            <Skeleton className="h-20 w-3/4 self-end" />
            <Skeleton className="h-20 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (chatError) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading chat</AlertTitle>
          <AlertDescription>
            {chatError.message}
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Make sure you have deployed the Firestore rules to Firebase Console.
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show not found state
  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Chat not found</AlertTitle>
          <AlertDescription>
            This chat doesn't exist or you don't have permission to access it.
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Chat ID: {chatId}
            </span>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ChatHeader chat={chat} />
      <ChatMessages messages={messages || []} isLoading={messagesLoading} chatId={chatId} />
      <MessageInput chatId={chatId} />
    </div>
  );
}
