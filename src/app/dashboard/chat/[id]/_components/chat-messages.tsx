'use client';
import { useEffect, useRef, useState } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import type { Message, User, Chat } from '@/lib/types';
import { format } from 'date-fns';
import { useUser, useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit2, Trash2, Check, X, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { RoleBadge } from '@/components/role-badges';

interface MessageItemProps {
  message: Message & { id: string };
  chatId: string;
  chat?: Chat & { id: string };
}

function MessageItem({ message, chatId, chat }: MessageItemProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const isSelf = message.senderId === currentUser?.uid;
  const isSystem = message.type === 'system';
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const senderRef = useMemoFirebase(() => {
    if (!firestore || !message.senderId || isSystem) return null;
    return doc(firestore, 'users', message.senderId);
  }, [firestore, message.senderId, isSystem]);

  const { data: sender, isLoading: isSenderLoading } = useDoc<User>(senderRef);

  // Determinar los roles del usuario
  const isGroupCreator = chat?.createdBy === message.senderId;
  const isGroupAdmin = chat?.adminIds?.includes(message.senderId) && !isGroupCreator;
  const isPlatformAdmin = sender?.role === 'admin';
  const isGroup = chat?.type === 'group';

  // Determinar el color del nombre (dorado para creadores y co-creadores)
  const getNameColor = () => {
    if (!isGroup) return 'text-primary';
    if (isGroupCreator) return 'text-amber-500'; // Dorado para creador
    if (isGroupAdmin) return 'text-blue-500'; // Azul para co-creador
    return 'text-primary';
  };

  // Renderizar mensaje del sistema
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-4 py-2 rounded-full text-xs text-muted-foreground max-w-md text-center">
          {message.content}
        </div>
      </div>
    );
  }
  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(message.content);
  };

  const handleSaveEdit = () => {
    if (!firestore || !editedContent.trim()) return;
    
    const messageRef = doc(firestore, 'chats', chatId, 'messages', message.id);
    setDocumentNonBlocking(messageRef, {
      content: editedContent,
      edited: true,
      editedAt: new Date().toISOString(),
    }, { merge: true });
    
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleDelete = () => {
    if (!firestore) return;
    if (confirm('¿Estás seguro de que quieres eliminar este mensaje?')) {
      const messageRef = doc(firestore, 'chats', chatId, 'messages', message.id);
      deleteDocumentNonBlocking(messageRef);
    }
  };
  
  if (isSenderLoading || !sender) {
    return (
       <div className={cn('flex items-start gap-3', { 'flex-row-reverse': isSelf })}>
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className={cn('flex flex-col gap-1', { 'items-end': isSelf })}>
             <Skeleton className="h-16 w-48 rounded-lg" />
             <Skeleton className="h-4 w-20 mt-1" />
          </div>
       </div>
    );
  }

  return (
    <div
      className={cn('flex items-start gap-3 group', {
        'flex-row-reverse': isSelf,
      })}
    >
      <UserAvatar user={sender} showStatus={false} className="chat-avatar" />
      <div
        className={cn('flex flex-col gap-1', {
          'items-end': isSelf,
        })}
      >
        <div className="flex items-start gap-2">
          {isSelf && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground chat-button"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <div
            className={cn(
              'max-w-xs rounded-lg p-3 text-sm shadow-md md:max-w-md',
              {
                // Mensajes propios - con fondos especiales si es creador/co-creador
                'bg-primary text-primary-foreground': isSelf && !isEditing && (!isGroup || (!isGroupCreator && !isGroupAdmin)) && !isPlatformAdmin,
                'bg-amber-500/30 text-foreground border-2 border-amber-500/50 electric-border-creator': isSelf && !isEditing && isGroup && isGroupCreator,
                'bg-amber-500/20 text-foreground border border-amber-400/40': isSelf && !isEditing && isGroup && isGroupAdmin,
                'bg-purple-500/30 text-foreground border-2 border-purple-500/50 electric-border-admin': isSelf && !isEditing && isPlatformAdmin && !isGroup,
                // Mensajes de otros - tonos sutiles
                'bg-amber-500/15 border-2 border-amber-500/40 electric-border-creator': !isSelf && isGroup && isGroupCreator,
                'bg-amber-500/10 border border-amber-500/30': !isSelf && isGroup && isGroupAdmin,
                'bg-purple-500/15 border-2 border-purple-500/40 electric-border-admin': !isSelf && isPlatformAdmin && !isGroup,
                'bg-card': (!isSelf || isEditing) && (!isGroup || (!isGroupCreator && !isGroupAdmin)) && !isPlatformAdmin,
              }
            )}
          >
            {!isSelf && (
              <div className="mb-1 flex items-center gap-1.5">
                <p className={cn("text-xs font-semibold", getNameColor())}>
                  {sender.name}
                </p>
                {/* Insignias de roles */}
                {isPlatformAdmin && <RoleBadge type="platform-admin" size="sm" />}
                {isGroup && isGroupCreator && <RoleBadge type="group-creator" size="sm" />}
                {isGroup && isGroupAdmin && <RoleBadge type="group-admin" size="sm" />}
              </div>
            )}
            {/* Insignias para mensajes propios */}
            {isSelf && (isPlatformAdmin || (isGroup && (isGroupCreator || isGroupAdmin))) && (
              <div className="mb-1 flex items-center gap-1.5 justify-end">
                <p className="text-xs font-semibold text-primary-foreground/90">Tú</p>
                {isPlatformAdmin && <RoleBadge type="platform-admin" size="sm" />}
                {isGroup && isGroupCreator && <RoleBadge type="group-creator" size="sm" />}
                {isGroup && isGroupAdmin && <RoleBadge type="group-admin" size="sm" />}
              </div>
            )}
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:bg-accent hover:text-accent-foreground chat-button"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 chat-button"
                    onClick={handleSaveEdit}
                    disabled={!editedContent.trim()}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </button>
                </div>
              </div>
            ) : message.type === 'image' && message.imageUrl ? (
              <div className="space-y-2">
                <img 
                  src={message.imageUrl} 
                  alt={message.content}
                  className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: '300px', width: 'auto' }}
                  onClick={() => window.open(message.imageUrl, '_blank')}
                />
                {message.content && message.content !== 'Sent an image' && (
                  <p className="text-xs whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            ) : message.type === 'file' && message.fileUrl ? (
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
              >
                <FileText className="h-5 w-5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{message.fileName || message.content}</p>
                  {message.fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {(message.fileSize / 1024).toFixed(2)} KB
                    </p>
                  )}
                </div>
              </a>
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {message.sentAt ? format(new Date(message.sentAt), 'p') : ''}
          {message.edited && <span> (edited)</span>}
        </div>
      </div>
    </div>
  );
}


export function ChatMessages({ 
  messages, 
  isLoading, 
  chatId,
  chat
}: { 
  messages: Message[], 
  isLoading: boolean,
  chatId: string,
  chat?: Chat & { id: string }
}) {
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
                <Skeleton className="h-16 w-48 rounded-lg" />
                <Skeleton className="h-4 w-20 mt-1" />
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex flex-col gap-1 items-end">
                <Skeleton className="h-16 w-48 rounded-lg" />
                <Skeleton className="h-4 w-20 mt-1" />
              </div>
            </div>
          </>
        )}
        {messages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message as Message & { id: string }} 
            chatId={chatId}
            chat={chat}
          />
        ))}
      </div>
    </div>
  );
}
