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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { useCollection, useFirestore, useUser, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
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
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'My Notes',
        avatarUser: currentUser,
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
        
        <SidebarMenuButton asChild className="flex-1">
          <Link 
            href={`/dashboard/chat/${chat.id}`} 
            className={isMuted ? 'opacity-50' : ''}
            onClick={handleClick}
          >
            <div className="relative">
              {isGroup ? (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xl">
                  {groupImage}
                </div>
              ) : avatarUser ? (
                <UserAvatar user={avatarUser as any} className="h-8 w-8" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                  📝
                </div>
              )}
              {isPinned && (
                <Pin className="absolute -top-1 -right-1 h-3 w-3 text-primary fill-primary" />
              )}
            </div>
            <span className="flex-1 truncate">
              {name}
              {isPersonal && <span className="text-muted-foreground ml-1">(yo)</span>}
            </span>
          </Link>
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-accent rounded-md transition-opacity"
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

  const chatsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chats'), where('participantIds', 'array-contains', user.uid));
  }, [firestore, user]);

  const { data: allChats, isLoading } = useCollection<Chat>(chatsQuery);

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
    if (!firestore || !user) return;
    if (confirm('Are you sure you want to delete this chat?')) {
      const chatRef = doc(firestore, 'chats', chatId);
      setDocumentNonBlocking(chatRef, {
        deletedBy: arrayUnion(user.uid)
      }, { merge: true });
    }
  };

  const handleBulkArchive = () => {
    if (!firestore || !user) return;
    selectedChats.forEach(chatId => handleArchive(chatId));
    handleCancelSelection();
  };

  const handleBulkDelete = () => {
    if (!firestore || !user) return;
    if (confirm(`Are you sure you want to delete ${selectedChats.length} chats?`)) {
      selectedChats.forEach(chatId => handleDelete(chatId));
      handleCancelSelection();
    }
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
          
          {/* Active/Archived Chats */}
          {chatsToShow.map((chat) => (
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
    </>
  );
}
