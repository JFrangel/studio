'use client';
import { useDoc, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { ChatHeader } from './_components/chat-header';
import { ChatMessages } from './_components/chat-messages';
import { MessageInput } from './_components/message-input';
import { notFound } from 'next/navigation';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Chat, Message } from '@/lib/types';
import { use } from 'react';

export default function ChatPage({ params }: { params: { id: string } }) {
  const firestore = useFirestore();
  const chatId = use(Promise.resolve(params.id));

  const chatRef = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);
  
  const { data: chat, isLoading: isChatLoading } = useDoc<Chat>(chatRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !chatId) return null;
    return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('sentAt', 'asc'));
  }, [firestore, chatId]);

  const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);

  if (!isChatLoading && !chat) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
       {isChatLoading ? (
         <div className="flex h-full flex-1 items-center justify-center">Loading chat...</div>
       ) : chat ? (
        <>
          <ChatHeader chat={chat} />
          <ChatMessages messages={messages || []} isLoading={areMessagesLoading} />
          <MessageInput chatId={chatId} />
        </>
      ) : null}
    </div>
  );
}
