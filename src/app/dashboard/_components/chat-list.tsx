'use client';
import Link from 'next/link';
import { PlusCircle, Users, Search, Pin, Archive, MessageSquare, MoreVertical, Trash2, CheckSquare, XCircle, LogIn } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupAction,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { useCollection, useFirestore, useUser, useMemoFirebase, setDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, doc, getDoc, arrayUnion } from 'firebase/firestore';
import type { Chat, User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useEffect, useMemo } from 'react';
import { AddChatDialog } from './add-chat-dialog';
import { CreateGroupDialog } from './create-group-dialog';
import { SearchDialog } from './search-dialog';
import { JoinGroupDialog } from './join-group-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, type GroupAvatarStyle } from '@/lib/avatars';
import { GroupBadge, RoleBadge } from '@/components/role-badges';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

function ChatListItem({ 
  chat, 
  isPinned, 
  isSelected, 
  onSelect, 
  isSelectionMode,
  onPin,
  onArchive,
  onDelete
}: { 
  chat: Chat & { id: string }, 
  isPinned?: boolean,
  isSelected?: boolean,
  onSelect?: (chatId: string) => void,
  isSelectionMode?: boolean,
  onPin?: (chatId: string) => void,
  onArchive?: (chatId: string) => void,
  onDelete?: (chatId: string) => void
}) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setOpenMobile, isMobile } = useSidebar();

  // Hook para mensajes no leídos
  const { unreadCount, hasUnread } = useUnreadMessages(chat);

  // Obtener el perfil completo del usuario actual desde Firestore
  const currentUserDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);

  const { data: currentUserProfile } = useDoc<User>(currentUserDocRef);

  const isPersonalChat = chat.type === 'private' && chat.participantIds.length === 1 && chat.participantIds[0] === currentUser?.uid;
  const isMuted = chat.mutedBy?.includes(currentUser?.uid || '');
  const isArchived = chat.archivedBy?.includes(currentUser?.uid || '');

  useEffect(() => {
    const fetchOtherUser = async () => {
      setIsLoading(true);
      if (!firestore || !currentUser || chat.type !== 'private' || isPersonalChat) {
        setIsLoading(false);
        return;
      }

      const otherParticipantId = chat.participantIds.find(p => p !== currentUser.uid);
      if (otherParticipantId) {
        try {
          const userDocRef = doc(firestore, 'users', otherParticipantId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setOtherUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
          }
        } catch (error) {
          console.error("Error fetching other user:", error);
        }
      }
      setIsLoading(false);
    };

    fetchOtherUser();
  }, [firestore, currentUser, chat, isPersonalChat]);

  const getChatDetails = () => {
    if (isPersonalChat) {
      return {
        name: currentUserProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'My Notes',
        avatarUser: currentUserProfile, // SOLO usar el perfil de Firestore que tiene avatarStyle y avatarSeed
        isPersonal: true,
        isGroup: false,
        groupImage: null
      };
    }
    if (chat.type === 'private') {
      return {
        name: otherUser?.name || 'Private Chat',
        avatarUser: otherUser,
        isPersonal: false,
        isGroup: false,
        groupImage: null
      };
    }
    // Group chat
    return {
      name: chat.name || 'Group Chat',
      avatarUser: null,
      isPersonal: false,
      isGroup: true,
      groupImage: chat.groupImage || '👥'
    };
  };

  if (isLoading) {
     return <Skeleton className="h-10 w-full" />
  }

  const { name, avatarUser, isPersonal, isGroup, groupImage } = getChatDetails();

  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      onSelect?.(chat.id);
    } else if (isMobile) {
      // En móvil, cerramos el sidebar cuando se hace clic en un chat
      setOpenMobile(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // El menú contextual se manejará con el DropdownMenu
  };

  return (
    <SidebarMenuItem onContextMenu={handleContextMenu}>
      <div className={`flex items-center gap-2 group relative ${isSelected ? 'bg-accent' : ''}`}>
        {isSelectionMode && (
          <button
            onClick={() => onSelect?.(chat.id)}
            className="flex items-center justify-center w-6 h-6 ml-2"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <div className="h-5 w-5 border-2 border-muted-foreground rounded" />
            )}
          </button>
        )}
        
        <SidebarMenuButton asChild className="flex-1 sidebar-menu-button">
          <Link 
            href={`/dashboard/chat/${chat.id}`} 
            className={isMuted ? 'opacity-50' : ''}
            onClick={handleClick}
          >
            <div className="relative flex-shrink-0">
              {isGroup ? (
                chat.groupAvatarStyle === 'avatar' && chat.groupAvatarSeed ? (
                  <Avatar className="h-8 w-8 chat-avatar">
                    <AvatarImage 
                      src={getAvatarUrl(
                        chat.groupAvatarSeed,
                        chat.groupAvatarSeed.split('-')[0] as GroupAvatarStyle
                      )} 
                      alt={chat.name || 'Group'}
                    />
                    <AvatarFallback>{chat.name?.[0] || '👥'}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xl chat-avatar">
                    {groupImage}
                  </div>
                )
              ) : avatarUser ? (
                <UserAvatar user={avatarUser as any} className="h-8 w-8 chat-avatar" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold chat-avatar">
                  📝
                </div>
              )}
              {isPinned && (
                <Pin className="absolute -top-1 -right-1 h-3 w-3 text-primary fill-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <span className={`truncate flex items-center gap-1 ${hasUnread ? 'font-semibold' : ''}`}>
                {name}
                {isPersonal && (
                  <>
                    <span className="text-muted-foreground ml-1">(yo)</span>
                    {/* Insignia de admin si el usuario actual es admin */}
                    {currentUserProfile?.role === 'admin' && <RoleBadge type="platform-admin" size="sm" />}
                  </>
                )}
                {isGroup && <GroupBadge />}
                {/* Insignia para chats con admins de plataforma */}
                {!isGroup && otherUser?.role === 'admin' && <RoleBadge type="platform-admin" size="sm" />}
              </span>
              {/* Indicador de mensajes no leídos */}
              {hasUnread && (
                <div className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 border-2 border-background ml-2 flex-shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>
          </Link>
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-accent rounded-md transition-opacity chat-button"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onSelect?.(chat.id)}>
              <CheckSquare className="mr-2 h-4 w-4" />
              Select
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onPin?.(chat.id)}>
              <Pin className="mr-2 h-4 w-4" />
              {isPinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive?.(chat.id)}>
              <Archive className="mr-2 h-4 w-4" />
              {isArchived ? 'Unarchive' : 'Archive'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete?.(chat.id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarMenuItem>
  );
}


export function ChatList() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddChatOpen, setAddChatOpen] = useState(false);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isJoinGroupOpen, setJoinGroupOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filterView, setFilterView] = useState<'all' | 'chats' | 'groups'>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chats'), where('participantIds', 'array-contains', user.uid));
  }, [firestore, user]);

  const { data: allChats, isLoading } = useCollection<Chat>(chatsQuery);

  // Función para generar PIN único de 6 dígitos
  const generateGroupPin = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Función para generar código de invitación único
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  // Migrar grupos existentes que no tienen PIN o inviteCode
  useEffect(() => {
    if (!allChats || !firestore || !user) return;

    const migrateGroups = async () => {
      const groupsToMigrate = allChats.filter(
        chat => chat.type === 'group' && (!chat.groupPin || !chat.inviteCode)
      );

      for (const group of groupsToMigrate) {
        const updates: any = {};
        
        if (!group.groupPin) {
          updates.groupPin = generateGroupPin();
        }
        
        if (!group.inviteCode) {
          updates.inviteCode = generateInviteCode();
        }

        if (Object.keys(updates).length > 0) {
          const chatRef = doc(firestore, 'chats', group.id);
          await setDocumentNonBlocking(chatRef, updates, { merge: true });
        }
      }
    };

    migrateGroups();
  }, [allChats, firestore, user]);

  // Filtrar chats: separar fijados, activos y archivados
  const { pinnedChats, activeChats, archivedChats } = useMemo(() => {
    if (!allChats || !user) return { pinnedChats: [], activeChats: [], archivedChats: [] };

    const filtered = allChats.filter(chat => !chat.deletedBy?.includes(user.uid));
    
    // Los chats fijados siempre van primero, sin importar si están archivados
    const pinned = filtered.filter(chat => 
      chat.pinnedBy?.includes(user.uid) && !chat.archivedBy?.includes(user.uid)
    );
    
    // Chats archivados (que NO estén fijados)
    const archived = filtered.filter(chat => 
      chat.archivedBy?.includes(user.uid) && !chat.pinnedBy?.includes(user.uid)
    );
    
    // Chats activos (que NO estén fijados NI archivados)
    const active = filtered.filter(chat => 
      !chat.archivedBy?.includes(user.uid) && !chat.pinnedBy?.includes(user.uid)
    );

    return { pinnedChats: pinned, activeChats: active, archivedChats: archived };
  }, [allChats, user]);

  // Aplicar filtro de vista (todos/chats/grupos)
  const applyViewFilter = (chats: (Chat & { id: string })[]) => {
    if (filterView === 'all') return chats;
    if (filterView === 'chats') return chats.filter(chat => chat.type === 'private');
    if (filterView === 'groups') return chats.filter(chat => chat.type === 'group');
    return chats;
  };

  const chatsToShow = showArchived 
    ? applyViewFilter(archivedChats) 
    : applyViewFilter([...pinnedChats, ...activeChats]);

  const handleToggleSelection = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
  };

  const handleCancelSelection = () => {
    setSelectedChats([]);
    setIsSelectionMode(false);
  };

  const handlePin = (chatId: string) => {
    if (!firestore || !user) return;
    const chat = allChats?.find(c => c.id === chatId);
    if (!chat) return;
    
    const chatRef = doc(firestore, 'chats', chatId);
    const isPinned = chat.pinnedBy?.includes(user.uid);
    
    setDocumentNonBlocking(chatRef, {
      pinnedBy: isPinned ? chat.pinnedBy?.filter(id => id !== user.uid) || [] : [...(chat.pinnedBy || []), user.uid]
    }, { merge: true });
  };

  const handleArchive = (chatId: string) => {
    if (!firestore || !user) return;
    const chat = allChats?.find(c => c.id === chatId);
    if (!chat) return;
    
    const chatRef = doc(firestore, 'chats', chatId);
    const isArchivedChat = chat.archivedBy?.includes(user.uid);
    
    setDocumentNonBlocking(chatRef, {
      archivedBy: isArchivedChat ? chat.archivedBy?.filter(id => id !== user.uid) || [] : [...(chat.archivedBy || []), user.uid]
    }, { merge: true });
  };

  const handleDelete = (chatId: string) => {
    setChatToDelete(chatId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!firestore || !user || !chatToDelete) return;
    const chatRef = doc(firestore, 'chats', chatToDelete);
    setDocumentNonBlocking(chatRef, {
      deletedBy: arrayUnion(user.uid)
    }, { merge: true });
    setShowDeleteDialog(false);
    setChatToDelete(null);
  };

  const handleBulkArchive = () => {
    if (!firestore || !user) return;
    selectedChats.forEach(chatId => handleArchive(chatId));
    handleCancelSelection();
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    if (!firestore || !user) return;
    selectedChats.forEach(chatId => {
      const chatRef = doc(firestore, 'chats', chatId);
      setDocumentNonBlocking(chatRef, {
        deletedBy: arrayUnion(user.uid)
      }, { merge: true });
    });
    setShowBulkDeleteDialog(false);
    handleCancelSelection();
  };

  const handleCreateGroupFromSelected = async () => {
    if (!firestore || !user || selectedChats.length === 0) return;

    try {
      // Obtener todos los participantes de los chats seleccionados
      const participantIds = new Set<string>();
      
      for (const chatId of selectedChats) {
        const chat = allChats?.find(c => c.id === chatId);
        if (chat) {
          chat.participantIds.forEach(id => {
            if (id !== user.uid) {
              participantIds.add(id);
            }
          });
        }
      }

      // Crear nuevo grupo con estos participantes
      const chatsRef = collection(firestore, 'chats');
      const now = new Date().toISOString();
      
      const groupData: any = {
        name: `Group with ${participantIds.size} members`,
        type: 'group',
        participantIds: [user.uid, ...Array.from(participantIds)],
        createdAt: now,
        createdBy: user.uid,
        adminIds: [user.uid],
        groupImage: '👥',
      };

      const newGroupRef = doc(chatsRef);
      await setDocumentNonBlocking(newGroupRef, groupData, { merge: false });
      handleCancelSelection();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  return (
    <>
    <AddChatDialog open={isAddChatOpen} onOpenChange={setAddChatOpen} />
    <CreateGroupDialog open={isCreateGroupOpen} onOpenChange={setCreateGroupOpen} />
    <SearchDialog open={isSearchOpen} onOpenChange={setSearchOpen} />
    <JoinGroupDialog open={isJoinGroupOpen} onOpenChange={setJoinGroupOpen} />
    
    {/* Selection Mode Bar */}
    {isSelectionMode && (
      <div className="p-2 bg-accent border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{selectedChats.length} selected</span>
          <button
            onClick={handleCancelSelection}
            className="p-1 hover:bg-background rounded"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCreateGroupFromSelected}
            disabled={selectedChats.length === 0}
            className="flex flex-col items-center gap-1 p-2 hover:bg-background rounded disabled:opacity-50"
          >
            <Users className="h-4 w-4" />
            <span className="text-xs">Group</span>
          </button>
          <button
            onClick={handleBulkArchive}
            disabled={selectedChats.length === 0}
            className="flex flex-col items-center gap-1 p-2 hover:bg-background rounded disabled:opacity-50"
          >
            <Archive className="h-4 w-4" />
            <span className="text-xs">Archive</span>
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedChats.length === 0}
            className="flex flex-col items-center gap-1 p-2 hover:bg-background rounded text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-xs">Delete</span>
          </button>
        </div>
      </div>
    )}
    
    {/* Action buttons section */}
    {!isSelectionMode && (
      <div className="p-2 space-y-2">
        <button
          className="w-full flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent text-sm"
          onClick={() => setAddChatOpen(true)}
        >
          <PlusCircle className="size-4" />
          New Chat
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent text-sm"
          onClick={() => setCreateGroupOpen(true)}
        >
          <Users className="size-4" />
          Create Group
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent text-sm"
          onClick={() => setJoinGroupOpen(true)}
        >
          <LogIn className="size-4" />
          Join Group
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent text-sm"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="size-4" />
          Search
        </button>
        
        <button
          className="w-full flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent text-sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          <Archive className="size-4" />
          {showArchived ? 'Show Active' : 'Show Archived'}
        </button>
        
        {/* Filter buttons */}
        <div className="pt-2 border-t">
          <p className="text-xs font-semibold text-muted-foreground px-2 mb-2">Filter</p>
          <div className="grid grid-cols-3 gap-1">
            <button
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterView === 'all' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-accent'
              }`}
              onClick={() => setFilterView('all')}
            >
              All
            </button>
            <button
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterView === 'chats' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-accent'
              }`}
              onClick={() => setFilterView('chats')}
            >
              Chats
            </button>
            <button
              className={`px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterView === 'groups' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-accent'
              }`}
              onClick={() => setFilterView('groups')}
            >
              Groups
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Chats container */}
    <SidebarGroup>
      <SidebarGroupLabel>
        {showArchived ? 'Archived' : filterView === 'all' ? 'Chats' : filterView === 'chats' ? 'Private Chats' : 'Groups'}
        {chatsToShow.length > 0 && ` (${chatsToShow.length})`}
      </SidebarGroupLabel>
      <SidebarMenu>
          {isLoading && (
            <>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </>
          )}
          
          {/* Pinned Chats Section */}
          {!showArchived && applyViewFilter(pinnedChats).length > 0 && (
            <>
              <div className="px-2 py-1 text-xs text-muted-foreground font-semibold flex items-center gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </div>
              {applyViewFilter(pinnedChats).map((chat) => (
                <ChatListItem 
                  key={chat.id} 
                  chat={chat} 
                  isPinned={true}
                  isSelected={selectedChats.includes(chat.id)}
                  onSelect={handleToggleSelection}
                  isSelectionMode={isSelectionMode}
                  onPin={handlePin}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
          
          {/* Active/Archived Chats - Solo mostrar chats NO fijados */}
          {applyViewFilter(showArchived ? archivedChats : activeChats).map((chat) => (
            <ChatListItem 
              key={chat.id} 
              chat={chat} 
              isPinned={false}
              isSelected={selectedChats.includes(chat.id)}
              onSelect={handleToggleSelection}
              isSelectionMode={isSelectionMode}
              onPin={handlePin}
              onArchive={handleArchive}
              onDelete={handleDelete}
            />
          ))}
          
          {/* Empty States */}
          {!isLoading && chatsToShow.length === 0 && !showArchived && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No chats yet</p>
              <p className="text-xs mt-1">Start a new conversation!</p>
            </div>
          )}
          
          {!isLoading && archivedChats.length === 0 && showArchived && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No archived chats</p>
            </div>
          )}
        </SidebarMenu>
      </SidebarGroup>

      {/* Alert Dialog para eliminar un chat */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">¿Eliminar chat?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ¿Estás seguro que deseas eliminar este chat? Solo se eliminará de tu vista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alert Dialog para eliminar múltiples chats */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">¿Eliminar {selectedChats.length} chats?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              ¿Estás seguro que deseas eliminar estos {selectedChats.length} chats? Solo se eliminarán de tu vista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0"
            >
              Eliminar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
