'use client';

import { use, useState, useMemo } from 'react';
import { useDoc, useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { ChatHeader } from './_components/chat-header';
import { ChatMessages } from './_components/chat-messages';
import { MessageInput } from './_components/message-input';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Chat, Message } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, X } from 'lucide-react';
import { useMarkMessagesAsRead } from '@/hooks/use-mark-messages-read';
import { useCheckParticipant } from '@/hooks/use-check-participant';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { id: chatId } = use(params);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Marcar mensajes como leídos cuando se abre el chat
  useMarkMessagesAsRead(chatId);

  const chatRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'chats', chatId);
  }, [firestore, chatId]);

  const { data: chat, isLoading: chatLoading, error: chatError } = useDoc<Chat>(chatRef);

  // Verificar si el usuario sigue siendo participante (solo para grupos)
  useCheckParticipant(chatId, chat?.name);

  const messagesQuery = useMemoFirebase(
    () => {
      if (!firestore) return null;
      return query(collection(firestore, 'chats', chatId, 'messages'), orderBy('sentAt', 'asc'));
    },
    [firestore, chatId]
  );
  const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);

  // Filtrar mensajes según la búsqueda
  const filteredMessages = useMemo(() => {
    if (!messages || !searchQuery.trim()) return messages || [];
    
    const query = searchQuery.toLowerCase().trim();
    return messages.filter(msg => 
      msg.content?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  const handleSearchClick = () => {
    setIsSearching(true);
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
  };

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
    // Si el error es de permisos, probablemente fue removido del grupo
    if (chatError.message.includes('permission') || chatError.message.includes('insufficient')) {
      return (
        <div className="flex h-full items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Has sido eliminado del grupo</AlertTitle>
            <AlertDescription>
              Ya no tienes acceso a este grupo. Has sido removido por un administrador o el grupo ha sido eliminado.
              <br />
              <span className="text-xs text-muted-foreground mt-2 block">
                Serás redirigido al dashboard automáticamente.
              </span>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error al cargar el chat</AlertTitle>
          <AlertDescription>
            {chatError.message}
            <br />
            <span className="text-xs text-muted-foreground mt-2 block">
              Asegúrate de haber desplegado las reglas de Firestore en Firebase Console.
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
      <ChatHeader chat={chat} onSearchClick={handleSearchClick} />
      
      {/* Barra de búsqueda */}
      {isSearching && (
        <div className="flex items-center gap-2 border-b bg-card px-4 py-3">
          <Input
            type="text"
            placeholder="Buscar mensajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCloseSearch}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Contador de resultados */}
      {isSearching && searchQuery.trim() && (
        <div className="border-b bg-muted px-4 py-2 text-sm text-muted-foreground">
          {filteredMessages.length === 0 
            ? 'No se encontraron mensajes' 
            : `${filteredMessages.length} mensaje${filteredMessages.length !== 1 ? 's' : ''} encontrado${filteredMessages.length !== 1 ? 's' : ''}`
          }
        </div>
      )}

      <ChatMessages 
        messages={filteredMessages} 
        isLoading={messagesLoading} 
        chatId={chatId}
        chat={{ ...chat, id: chatId }}
      />
      <MessageInput chatId={chatId} />
    </div>
  );
}
