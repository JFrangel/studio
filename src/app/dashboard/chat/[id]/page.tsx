import { chats, messages as allMessages } from '@/lib/data';
import { ChatHeader } from './_components/chat-header';
import { ChatMessages } from './_components/chat-messages';
import { MessageInput } from './_components/message-input';
import { notFound } from 'next/navigation';

export default function ChatPage({ params }: { params: { id: string } }) {
  const chat = chats.find((c) => c.id === params.id);
  const messages = allMessages[params.id] || [];

  if (!chat) {
    notFound();
  }

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader chat={chat} />
      <ChatMessages messages={messages} />
      <MessageInput />
    </div>
  );
}
