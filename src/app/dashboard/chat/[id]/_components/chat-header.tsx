'use client';
import { useState } from 'react';
import { UserAvatar } from '@/components/user-avatar';
import type { Chat, User } from '@/lib/types';
import { Phone, Video, MoreVertical, Info, Users, Pin, Archive, Trash2, Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, documentId, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ManageGroupDialog } from '../../../_components/manage-group-dialog';

export function ChatHeader({ chat }: { chat: Chat & {id: string} }) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isManageGroupOpen, setManageGroupOpen] = useState(false);

  const participantIds = chat.participantIds.filter(p => p !== currentUser?.uid);
  
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || participantIds.length === 0) return null;
    return query(collection(firestore, 'users'), where(documentId(), 'in', participantIds));
  }, [firestore, participantIds.join(',')]); // Stable dependency

  const { data: participantUsers, isLoading: areParticipantsLoading } = useCollection<User>(usersQuery);

  const getChatDetails = () => {
    // Personal "My Notes" chat
    if (chat.type === 'private' && chat.participantIds.length === 1 && chat.participantIds[0] === currentUser?.uid) {
      return {
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'My Notes',
        description: 'Your personal space for notes',
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
        description: areParticipantsLoading ? '...' : otherUser?.status === 'active' ? 'Online' : 'Offline',
        userForAvatar: otherUser,
        isPersonal: false,
        isGroup: false,
        groupImage: null
      };
    }
    
    // Group chat
    return {
      name: chat.name || 'Group Chat',
      description: chat.description || `${chat.participantIds.length} members`,
      userForAvatar: null,
      isPersonal: false,
      isGroup: true,
      groupImage: chat.groupImage || '👥'
    };
  };

  const { name, description, userForAvatar, isPersonal, isGroup, groupImage } = getChatDetails();
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

  const handleDeleteChat = () => {
    if (!firestore || !currentUser) return;
    if (confirm('Are you sure you want to delete this chat? This will only remove it from your view.')) {
      const chatRef = doc(firestore, 'chats', chat.id);
      setDocumentNonBlocking(chatRef, {
        deletedBy: arrayUnion(currentUser.uid)
      }, { merge: true });
      router.push('/dashboard');
    }
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
      <div className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-3">
          {isGroup ? (
            <button 
              onClick={handleAvatarClick}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-2xl hover:opacity-80 transition-opacity cursor-pointer"
            >
              {groupImage}
            </button>
          ) : isPersonal && currentUser ? (
            <button 
              onClick={handleAvatarClick}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <UserAvatar 
                user={{
                  name: currentUser.displayName || currentUser.email || 'User',
                  photo: currentUser.photoURL || '',
                  status: 'active'
                }} 
                className="h-10 w-10" 
              />
            </button>
          ) : userForAvatar ? (
            <button onClick={handleAvatarClick} className="hover:opacity-80 transition-opacity cursor-pointer">
              <UserAvatar user={userForAvatar} />
            </button>
          ) : (
            <div className="relative flex -space-x-2">
              {participantUsers?.slice(0, 3).map(user => (
                <button 
                  key={user.id}
                  onClick={() => router.push(`/dashboard/profile/${user.id}`)}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <UserAvatar user={user} className="h-9 w-9 border-2 border-card" />
                </button>
              ))}
            </div>
          )}
        <button onClick={handleAvatarClick} className="flex flex-col hover:opacity-80 transition-opacity cursor-pointer text-left">
          <h2 className="text-base font-semibold font-headline">
            {name}
            {isPersonal && <span className="text-muted-foreground ml-2">(yo)</span>}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground">
              <MoreVertical className="h-5 w-5" />
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
            <DropdownMenuItem className="text-destructive" onClick={handleDeleteChat}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </>
  );
}
