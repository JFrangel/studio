'use client';
import { useState, useEffect } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import type { Chat, User } from '@/lib/types';
import { Phone, Video, MoreVertical, Info, Users, Pin, Archive, Trash2, Bell, BellOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, documentId, doc, arrayUnion, arrayRemove, getDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
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
import { ManageGroupDialog } from '../../../_components/manage-group-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, type GroupAvatarStyle } from '@/lib/avatars';
import { RoleBadge, GroupBadge } from '@/components/role-badges';

export function ChatHeader({ chat, onSearchClick }: { chat: Chat & {id: string}, onSearchClick?: () => void }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isManageGroupOpen, setManageGroupOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [allGroupMembers, setAllGroupMembers] = useState<User[]>([]);

  const participantIds = chat.participantIds.filter(p => p !== currentUser?.uid);
  
  // Obtener el perfil completo del usuario actual
  const currentUserDocRef = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);

  const { data: currentUserProfile } = useDoc<User>(currentUserDocRef);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || participantIds.length === 0) return null;
    return query(collection(firestore, 'users'), where(documentId(), 'in', participantIds));
  }, [firestore, participantIds.join(',')]); // Stable dependency

  const { data: participantUsers, isLoading: areParticipantsLoading } = useCollection<User>(usersQuery);

  // Cargar todos los miembros del grupo si es un grupo
  useEffect(() => {
    if (!firestore || chat.type !== 'group') return;

    const loadAllMembers = async () => {
      const members: User[] = [];
      for (const userId of chat.participantIds) {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
          members.push({ id: userDoc.id, ...userDoc.data() } as User);
        }
      }
      setAllGroupMembers(members);
    };

    loadAllMembers();
  }, [firestore, chat.participantIds, chat.type]);

  const getChatDetails = () => {
    // Personal "My Notes" chat
    if (chat.type === 'private' && chat.participantIds.length === 1 && chat.participantIds[0] === currentUser?.uid) {
      return {
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'My Notes',
        description: 'Tu espacio personal para notas',
        userForAvatar: null,
        isPersonal: true,
        isGroup: false,
        groupImage: null
      }
    }
    
    // Private 1-on-1 chat
    if (chat.type === 'private') {
      const otherUser = participantUsers?.[0];
      return {
        name: areParticipantsLoading ? 'Loading...' : otherUser?.name || 'Private Chat',
        description: areParticipantsLoading ? '...' : otherUser?.status === 'active' ? 'En línea' : 'Desconectado',
        userForAvatar: otherUser,
        isPersonal: false,
        isGroup: false,
        groupImage: null
      };
    }
    
    // Group chat
    const memberCount = chat.participantIds.length;
    const memberNames = allGroupMembers.slice(0, 3).map(m => m.name).join(', ');
    const remainingCount = memberCount - 3;
    const descriptionText = allGroupMembers.length > 0
      ? memberCount <= 3 
        ? memberNames 
        : `${memberNames}${remainingCount > 0 ? ` y ${remainingCount} más` : ''}`
      : chat.description || `${memberCount} miembros`;

    return {
      name: chat.name || 'Group Chat',
      description: descriptionText,
      userForAvatar: null,
      isPersonal: false,
      isGroup: true,
      groupImage: chat.groupImage || '👥',
      memberCount: memberCount
    };
  };

  const { name, description, userForAvatar, isPersonal, isGroup, groupImage, memberCount } = getChatDetails();
  const isGroupCreator = chat.createdBy === currentUser?.uid;
  const isPinned = chat.pinnedBy?.includes(currentUser?.uid || '');
  const isArchived = chat.archivedBy?.includes(currentUser?.uid || '');
  const isMuted = chat.mutedBy?.includes(currentUser?.uid || '');

  const handleTogglePin = () => {
    if (!firestore || !currentUser) return;
    const chatRef = doc(firestore, 'chats', chat.id);
    setDocumentNonBlocking(chatRef, {
      pinnedBy: isPinned ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    }, { merge: true });
  };

  const handleToggleArchive = () => {
    if (!firestore || !currentUser) return;
    const chatRef = doc(firestore, 'chats', chat.id);
    setDocumentNonBlocking(chatRef, {
      archivedBy: isArchived ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    }, { merge: true });
    if (!isArchived) {
      router.push('/dashboard');
    }
  };

  const handleToggleMute = () => {
    if (!firestore || !currentUser) return;
    const chatRef = doc(firestore, 'chats', chat.id);
    setDocumentNonBlocking(chatRef, {
      mutedBy: isMuted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    }, { merge: true });
  };

  const confirmDeleteChat = () => {
    if (!firestore || !currentUser) return;
    const chatRef = doc(firestore, 'chats', chat.id);
    setDocumentNonBlocking(chatRef, {
      deletedBy: arrayUnion(currentUser.uid)
    }, { merge: true });
    setShowDeleteDialog(false);
    router.push('/dashboard');
  };
  
  const handleAvatarClick = () => {
    if (isGroup) {
      // Si es un grupo, abrir el diálogo de gestión de grupo
      setManageGroupOpen(true);
    } else if (isPersonal && currentUser) {
      router.push(`/dashboard/profile/${currentUser.uid}`);
    } else if (userForAvatar) {
      router.push(`/dashboard/profile/${userForAvatar.id}`);
    }
  };

  const handleViewProfile = () => {
    if (userForAvatar) {
      router.push(`/dashboard/profile/${userForAvatar.id}`);
    } else if (isPersonal && currentUser) {
      router.push(`/dashboard/profile/${currentUser.uid}`);
    }
  };
  
  const isCurrentUserAdmin = currentUser && chat.adminIds?.includes(currentUser.uid);

  return (
    <>
      <ManageGroupDialog
        open={isManageGroupOpen}
        onOpenChange={setManageGroupOpen}
        chat={chat}
      />
      <div className="flex h-16 items-center gap-2 sm:gap-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-sm px-3 sm:px-4 md:px-6 chat-header">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {isGroup ? (
            chat.groupAvatarStyle === 'avatar' && chat.groupAvatarSeed ? (
              <button 
                onClick={handleAvatarClick}
                className="hover:opacity-80 transition-opacity cursor-pointer chat-avatar"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={getAvatarUrl(
                      chat.groupAvatarSeed,
                      chat.groupAvatarSeed.split('-')[0] as GroupAvatarStyle
                    )} 
                    alt={chat.name || 'Group'}
                  />
                  <AvatarFallback>{chat.name?.[0] || '👥'}</AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <button 
                onClick={handleAvatarClick}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-2xl hover:opacity-80 transition-opacity cursor-pointer chat-avatar"
              >
                {groupImage}
              </button>
            )
          ) : isPersonal && currentUserProfile ? (
            <button 
              onClick={handleAvatarClick}
              className="hover:opacity-80 transition-opacity cursor-pointer chat-avatar"
            >
              <UserAvatar 
                user={currentUserProfile}
                className="h-10 w-10" 
              />
            </button>
          ) : userForAvatar ? (
            <button onClick={handleAvatarClick} className="hover:opacity-80 transition-opacity cursor-pointer chat-avatar">
              <UserAvatar user={userForAvatar} />
            </button>
          ) : (
            <div className="relative flex -space-x-2">
              {participantUsers?.slice(0, 3).map(user => (
                <button 
                  key={user.id}
                  onClick={() => router.push(`/dashboard/profile/${user.id}`)}
                  className="hover:opacity-80 transition-opacity cursor-pointer chat-avatar"
                >
                  <UserAvatar user={user} className="h-9 w-9 border-2 border-card" />
                </button>
              ))}
            </div>
          )}
        <button onClick={handleAvatarClick} className="flex flex-col hover:opacity-80 transition-opacity cursor-pointer text-left min-w-0 flex-1 chat-button">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 w-full">
            <h2 className="text-sm sm:text-base font-semibold font-headline truncate group-header">
              {name}
              {isPersonal && <span className="text-muted-foreground ml-1 sm:ml-2">(yo)</span>}
            </h2>
            {/* Insignia de grupo si estamos dentro de un grupo */}
            {isGroup && <GroupBadge />}
            {/* Insignia de admin en chat personal si el usuario es admin */}
            {isPersonal && currentUserProfile?.role === 'admin' && (
              <RoleBadge type="platform-admin" size="sm" />
            )}
            {/* Insignia de admin si es chat 1-a-1 con un admin (solo mostrar insignia de la otra persona) */}
            {!isGroup && !isPersonal && userForAvatar?.role === 'admin' && (
              <RoleBadge type="platform-admin" size="sm" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate w-full">
            {isGroup && memberCount && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span className="hidden sm:inline">{memberCount} miembros</span>
                <span className="sm:hidden">{memberCount}</span>
                <span className="hidden sm:inline"> • </span>
              </span>
            )}
            <span className="truncate">{description}</span>
          </p>
        </button>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center rounded-md h-9 w-9 sm:h-10 sm:w-10 hover:bg-accent hover:text-accent-foreground shrink-0">
              <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isGroup && (
              <>
                <DropdownMenuItem onClick={() => setManageGroupOpen(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Group Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isGroup && (
              <>
                <DropdownMenuItem onClick={handleViewProfile}>
                  <Info className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onSearchClick?.()}>
              <Search className="mr-2 h-4 w-4" />
              Search Messages
            </DropdownMenuItem>
            {isGroup && (
              <>
                <DropdownMenuSeparator />
              </>
            )}
            {!isGroup && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={handleTogglePin}>
              <Pin className="mr-2 h-4 w-4" />
              {isPinned ? 'Unpin Chat' : 'Pin Chat'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleMute}>
              {isMuted ? <Bell className="mr-2 h-4 w-4" /> : <BellOff className="mr-2 h-4 w-4" />}
              {isMuted ? 'Unmute' : 'Mute Notifications'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleArchive}>
              <Archive className="mr-2 h-4 w-4" />
              {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Phone className="mr-2 h-4 w-4" />
              Voice Call
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Video className="mr-2 h-4 w-4" />
              Video Call
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="w-[95vw] max-w-md sm:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">¿Eliminar chat?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            ¿Estás seguro que deseas eliminar este chat? Solo se eliminará de tu vista, los demás participantes seguirán viéndolo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={confirmDeleteChat}
            className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
