'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, User as UserIcon, Users } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import type { Chat, User, Message } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useSidebar } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [chats, setChats] = useState<(Chat & { id: string })[]>([]);
  const [users, setUsers] = useState<(User & { id: string })[]>([]);

  useEffect(() => {
    if (!searchTerm.trim() || !firestore || !currentUser) {
      setChats([]);
      setUsers([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        // Buscar en chats (por nombre)
        const chatsRef = collection(firestore, 'chats');
        const chatsQuery = query(
          chatsRef,
          where('participantIds', 'array-contains', currentUser.uid)
        );
        const chatsSnapshot = await getDocs(chatsQuery);
        
        const foundChats = chatsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Chat & { id: string }))
          .filter(chat => {
            // Filtrar chats eliminados por el usuario
            if (chat.deletedBy?.includes(currentUser.uid)) return false;
            // Buscar en nombre del chat
            const searchLower = searchTerm.toLowerCase();
            return chat.name?.toLowerCase().includes(searchLower) ||
                   chat.description?.toLowerCase().includes(searchLower);
          })
          .slice(0, 5);

        setChats(foundChats);

        // Buscar usuarios (por nombre o email) - solo usuarios con searchable: true
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const foundUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User & { id: string }))
          .filter(user => {
            if (user.id === currentUser.uid) return false;
            // Filtrar usuarios que no quieren ser encontrados
            if (user.searchable === false) return false;
            const searchLower = searchTerm.toLowerCase();
            return user.name?.toLowerCase().includes(searchLower) ||
                   user.email?.toLowerCase().includes(searchLower) ||
                   user.pin?.toLowerCase().includes(searchLower);
          })
          .slice(0, 5);

        setUsers(foundUsers);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(searchTimeout);
  }, [searchTerm, firestore, currentUser]);

  const handleChatClick = (chatId: string) => {
    // Cerrar el sidebar en móvil
    if (isMobile) {
      setOpenMobile(false);
    }
    router.push(`/dashboard/chat/${chatId}`);
    onOpenChange(false);
    setSearchTerm('');
  };

  const handleUserClick = async (userId: string) => {
    if (!firestore || !currentUser) return;

    try {
      // Buscar si ya existe un chat privado con este usuario
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('type', '==', 'private'),
        where('participantIds', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Verificar si existe un chat con exactamente estos dos participantes
      const existingChat = querySnapshot.docs.find(doc => {
        const chat = doc.data() as Chat;
        const participants = chat.participantIds;
        return participants.length === 2 && 
               participants.includes(userId) && 
               participants.includes(currentUser.uid) &&
               !chat.deletedBy?.includes(currentUser.uid);
      });

      if (existingChat) {
        // Cerrar el sidebar en móvil
        if (isMobile) {
          setOpenMobile(false);
        }
        // Si existe, navegar al chat existente
        router.push(`/dashboard/chat/${existingChat.id}`);
      } else {
        // Si no existe, crear un nuevo chat
        const now = new Date().toISOString();
        
        const newChat = {
          type: 'private' as const,
          participantIds: [currentUser.uid, userId],
          createdAt: now,
          createdBy: currentUser.uid,
        };
        
        // Crear el chat y esperar a que se complete
        const chatRef = await addDocumentNonBlocking(chatsRef, newChat);
        
        if (chatRef && chatRef.id) {
          // Cerrar el sidebar en móvil
          if (isMobile) {
            setOpenMobile(false);
          }
          // Navegar al nuevo chat
          router.push(`/dashboard/chat/${chatRef.id}`);
        }
      }

      onOpenChange(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error opening/creating chat:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>
            Search for chats, users, or messages
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or PIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Loading State */}
          {isSearching && (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {/* Empty State */}
          {!isSearching && searchTerm && chats.length === 0 && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No results found for "{searchTerm}"</p>
            </div>
          )}

          {/* Chats Results */}
          {chats.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chats ({chats.length})
              </h3>
              <div className="space-y-1">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => handleChatClick(chat.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl">
                      {chat.groupImage || (chat.type === 'group' ? '👥' : '💬')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{chat.name || 'Chat'}</p>
                        {chat.type === 'group' ? (
                          <Badge className="text-xs flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-400">
                            <Users className="h-3 w-3" />
                            Group
                          </Badge>
                        ) : (
                          <Badge className="text-xs flex items-center gap-1 bg-purple-500/10 text-purple-700 dark:text-purple-400">
                            <MessageSquare className="h-3 w-3" />
                            Chat
                          </Badge>
                        )}
                      </div>
                      {chat.description && (
                        <p className="text-sm text-muted-foreground truncate">{chat.description}</p>
                      )}
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Users Results */}
          {users.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Users ({users.length})
              </h3>
              <div className="space-y-1">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <UserAvatar user={user} className="h-10 w-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">PIN: {user.pin}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Initial State */}
          {!searchTerm && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Start typing to search...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
