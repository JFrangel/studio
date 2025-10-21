'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, doc, getDoc, getDocs, query, where, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/user-avatar';
import { Shield, ShieldOff, UserMinus, AlertTriangle, Edit, Users, Plus, Clock, Info, Copy, Check, Link2, Hash, Sparkles, Eye, MessageSquare } from 'lucide-react';
import type { User, Chat, Message } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, type GroupAvatarStyle } from '@/lib/avatars';
import { GroupAvatarPicker } from '@/components/group-avatar-picker';
import { RoleBadge, GroupBadge } from '@/components/role-badges';

const DEFAULT_GROUP_IMAGES = [
  '👥', '🎉', '💼', '🏠', '🎮', '📚', '🎨', '🏋️', 
  '🍕', '🎵', '⚽', '🌟', '💡', '🚀', '🎯', '🌈'
];

interface ManageGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
}

export function ManageGroupDialog({ open, onOpenChange, chat }: ManageGroupDialogProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [participants, setParticipants] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  
  // Edit group states
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(DEFAULT_GROUP_IMAGES[0]);
  const [useAnimatedAvatar, setUseAnimatedAvatar] = useState(false);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Add members states
  const [pinInput, setPinInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  
  // Copy states
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const isCurrentUserAdmin = currentUser && chat.adminIds?.includes(currentUser.uid);

  useEffect(() => {
    if (open && firestore) {
      loadParticipants();
      loadRecentContacts();
      // Initialize edit form
      setGroupName(chat.name || '');
      setDescription(chat.description || '');
      setSelectedImage(chat.groupImage || DEFAULT_GROUP_IMAGES[0]);
      setUseAnimatedAvatar(chat.groupAvatarStyle === 'avatar');
      setSelectedAvatarSeed(chat.groupAvatarSeed || null);
      setError('');
    }
  }, [open, firestore, chat.participantIds]);

  const loadParticipants = async () => {
    if (!firestore) return;

    setIsLoading(true);
    try {
      const users: User[] = [];
      for (const userId of chat.participantIds) {
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        if (userDoc.exists()) {
          users.push({ id: userDoc.id, ...userDoc.data() } as User);
        }
      }
      setParticipants(users);
    } catch (error) {
      console.error('Error loading participants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentContacts = async () => {
    if (!firestore || !currentUser) return;

    setIsLoadingContacts(true);
    try {
      // Obtener chats recientes del usuario
      const chatsRef = collection(firestore, 'chats');
      const q = query(
        chatsRef,
        where('participantIds', 'array-contains', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Ordenar chats por lastMessageAt en el cliente
      const chats = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Chat & { id: string }))
        .sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 20);

      const userIds = new Set<string>();

      // Extraer IDs de usuarios únicos de los chats, excluyendo participantes actuales
      chats.forEach((c) => {
        c.participantIds.forEach((id) => {
          if (id !== currentUser.uid && !chat.participantIds.includes(id)) {
            userIds.add(id);
          }
        });
      });

      if (userIds.size === 0) {
        setRecentContacts([]);
        setIsLoadingContacts(false);
        return;
      }

      // Obtener información de usuarios (en lotes de 10 para Firestore)
      const userIdsArray = Array.from(userIds).slice(0, 10);
      const usersRef = collection(firestore, 'users');
      const usersQuery = query(usersRef, where('__name__', 'in', userIdsArray));
      const usersSnapshot = await getDocs(usersQuery);

      const users: User[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as User));

      setRecentContacts(users);
    } catch (error) {
      console.error('Error loading recent contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSaveGroupDetails = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (!firestore || !currentUser) return;

    setIsSaving(true);
    setError('');

    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      const updateData: any = {
        name: groupName,
        lastMessageAt: new Date().toISOString(),
      };

      // Configurar avatar del grupo
      if (useAnimatedAvatar && selectedAvatarSeed) {
        updateData.groupAvatarStyle = 'avatar';
        updateData.groupAvatarSeed = selectedAvatarSeed;
        // Limpiar groupImage si se usa avatar animado
        updateData.groupImage = null;
      } else {
        updateData.groupAvatarStyle = 'emoji';
        updateData.groupImage = selectedImage;
        // Limpiar groupAvatarSeed si se usa emoji
        updateData.groupAvatarSeed = null;
      }

      if (description.trim()) {
        updateData.description = description;
      }

      await setDocumentNonBlocking(chatRef, updateData, { merge: true });

      // Crear mensajes del sistema para cambios
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      const now = new Date().toISOString();
      const userName = currentUser.displayName || currentUser.email;

      // Mensaje si cambió la descripción
      if (description !== chat.description) {
        const descMessage: Omit<Message, 'id'> = {
          senderId: 'system',
          content: `${userName} actualizó la descripción del grupo`,
          type: 'system',
          systemMessageType: 'description_updated',
          readBy: [],
          sentAt: now,
          edited: false,
        };
        await addDocumentNonBlocking(messagesRef, descMessage);
      }

      // Mensaje si cambió el icono/avatar
      const oldIcon = chat.groupAvatarStyle === 'avatar' ? 'avatar animado' : (chat.groupImage || '👥');
      const newIcon = useAnimatedAvatar ? 'avatar animado' : selectedImage;
      if (oldIcon !== newIcon) {
        const iconMessage: Omit<Message, 'id'> = {
          senderId: 'system',
          content: `${userName} cambió el icono del grupo`,
          type: 'system',
          systemMessageType: 'icon_updated',
          readBy: [],
          sentAt: now,
          edited: false,
        };
        await addDocumentNonBlocking(messagesRef, iconMessage);
      }

      setError('');
    } catch (error) {
      console.error('Error updating group:', error);
      setError('Error updating group');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddMemberByPin = async () => {
    if (!pinInput.trim() || !firestore) return;

    setIsSearching(true);
    setError('');

    try {
      // Buscar usuario por PIN
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('pin', '==', pinInput.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('User not found with this PIN');
        setIsSearching(false);
        return;
      }

      const userData = querySnapshot.docs[0];
      const user: User = { id: userData.id, ...userData.data() } as User;

      // Verificar que no esté ya en el grupo
      if (chat.participantIds.includes(user.id)) {
        setError('User is already in this group');
        setIsSearching(false);
        return;
      }

      // Agregar al grupo
      const chatRef = doc(firestore, 'chats', chat.id);
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayUnion(user.id),
        },
        { merge: true }
      );

      // Recargar participantes
      await loadParticipants();
      setPinInput('');
      setError('');
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Error adding member');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromRecent = async (user: User) => {
    if (!firestore) return;

    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayUnion(user.id),
        },
        { merge: true }
      );

      // Recargar participantes y contactos
      await loadParticipants();
      await loadRecentContacts();
      setError('');
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Error adding member');
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    if (!firestore || !isCurrentUserAdmin) return;

    const chatRef = doc(firestore, 'chats', chat.id);
    const isAdmin = chat.adminIds?.includes(userId);

    try {
      await setDocumentNonBlocking(
        chatRef,
        {
          adminIds: isAdmin ? arrayRemove(userId) : arrayUnion(userId),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error toggling admin:', error);
    }
  };

  const handleSendMessage = async (participant: User) => {
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
      
      // Buscar un chat existente con este usuario específico
      const existingChat = querySnapshot.docs.find(doc => {
        const chatData = doc.data();
        return chatData.participantIds.includes(participant.id) && chatData.participantIds.length === 2;
      });

      if (existingChat) {
        // Ya existe un chat, navegar a él
        router.push(`/dashboard/chat/${existingChat.id}`);
        onOpenChange(false);
      } else {
        // Crear nuevo chat
        const newChatRef = await addDocumentNonBlocking(chatsRef, {
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          participantIds: [currentUser.uid, participant.id],
          type: 'private',
        });
        
        if (newChatRef) {
          router.push(`/dashboard/chat/${newChatRef.id}`);
          onOpenChange(false);
        }
      }
    } catch (error) {
      console.error('Error creating/opening chat:', error);
    }
  };

  const handleRemoveParticipant = async (user: User) => {
    if (!firestore || !isCurrentUserAdmin || !currentUser) return;

    // No se puede eliminar al creador
    if (user.id === chat.createdBy) {
      alert('Cannot remove the group creator');
      return;
    }

    // Confirmar eliminación
    setUserToRemove(user);
  };

  const confirmRemoveParticipant = async () => {
    if (!firestore || !userToRemove) return;

    const chatRef = doc(firestore, 'chats', chat.id);

    try {
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayRemove(userToRemove.id),
          adminIds: arrayRemove(userToRemove.id), // También remover de admins si lo era
        },
        { merge: true }
      );

      setParticipants(participants.filter(p => p.id !== userToRemove.id));
      setUserToRemove(null);
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleDeleteGroup = async () => {
    if (!firestore || !isCurrentUserAdmin) return;

    try {
      // Eliminar todos los mensajes
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Eliminar el chat
      await deleteDoc(doc(firestore, 'chats', chat.id));

      // Redirigir al dashboard
      router.push('/dashboard');
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error deleting group');
    }
  };

  const handleCopyPin = () => {
    if (chat.groupPin) {
      navigator.clipboard.writeText(chat.groupPin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyInviteLink = () => {
    if (chat.inviteCode) {
      const inviteLink = `${window.location.origin}/dashboard/join/${chat.inviteCode}`;
      navigator.clipboard.writeText(inviteLink);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Group Settings</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Edit group details, manage members and administrators
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className={`grid w-full ${isCurrentUserAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="info" className="text-xs sm:text-sm px-2">
                <Info className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Info</span>
              </TabsTrigger>
              {isCurrentUserAdmin && (
                <TabsTrigger value="details" className="text-xs sm:text-sm px-2">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="members" className="text-xs sm:text-sm px-2">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Members</span>
                <span className="sm:hidden">({participants.length})</span>
              </TabsTrigger>
              {isCurrentUserAdmin && (
                <TabsTrigger value="add" className="text-xs sm:text-sm px-2">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Group Basic Info */}
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-muted">
                  {chat.groupAvatarStyle === 'avatar' && chat.groupAvatarSeed ? (
                    <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                      <AvatarImage 
                        src={getAvatarUrl(
                          chat.groupAvatarSeed,
                          chat.groupAvatarSeed.split('-')[0] as GroupAvatarStyle
                        )} 
                        alt={chat.name || 'Group'}
                      />
                      <AvatarFallback className="text-2xl sm:text-4xl">{chat.name?.[0] || '👥'}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="text-3xl sm:text-4xl">
                      {chat.groupImage || '👥'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{chat.name || 'Group Chat'}</h3>
                      <GroupBadge />
                    </div>
                    {chat.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{chat.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                      <Users className="h-3 w-3" />
                      <span>{participants.length} members</span>
                      {chat.isPublic !== undefined && (
                        <>
                          <span>•</span>
                          <Badge className="text-xs">
                            {chat.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* PIN and Invite Info - Available to all members */}
                {(chat.groupPin || chat.inviteCode) && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Información del Grupo
                    </h4>

                    {/* Group PIN */}
                    {chat.groupPin && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Group PIN</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-2 sm:p-3 rounded-lg bg-muted font-mono text-base sm:text-lg tracking-wider flex items-center justify-center min-w-0">
                            <Hash className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-muted-foreground shrink-0" />
                            <span className="truncate">{chat.groupPin}</span>
                          </div>
                          <Button
                            onClick={handleCopyPin}
                            className="shrink-0 border h-8 w-8 sm:h-10 sm:w-10 p-0"
                          >
                            {copiedPin ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this PIN with others to let them join the group
                        </p>
                      </div>
                    )}

                    {/* Invite Link */}
                    {chat.inviteCode && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Invite Link</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-2 sm:p-3 rounded-lg bg-muted text-xs sm:text-sm flex items-center min-w-0">
                            <Link2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {typeof window !== 'undefined' ? `${window.location.origin}/dashboard/join/${chat.inviteCode}` : chat.inviteCode}
                            </span>
                          </div>
                          <Button
                            onClick={handleCopyInviteLink}
                            className="shrink-0 border h-8 w-8 sm:h-10 sm:w-10 p-0"
                          >
                            {copiedInvite ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Share this link to invite people directly to the group
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Creation Info */}
                {chat.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
                    <Clock className="h-3 w-3" />
                    <span>Created {new Date(chat.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4 mt-4">
              {isCurrentUserAdmin ? (
                <>
                  {/* Group Image Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Imagen del Grupo</Label>
                      <button
                        type="button"
                        onClick={() => setUseAnimatedAvatar(!useAnimatedAvatar)}
                        className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">
                          {useAnimatedAvatar ? 'Usar emoji' : 'Usar avatar animado'}
                        </span>
                        <span className="sm:hidden">
                          {useAnimatedAvatar ? 'Emoji' : 'Avatar'}
                        </span>
                      </button>
                    </div>

                    {!useAnimatedAvatar ? (
                      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {DEFAULT_GROUP_IMAGES.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setSelectedImage(emoji)}
                            className={`text-2xl sm:text-3xl p-2 rounded-lg hover:bg-accent transition-colors ${
                              selectedImage === emoji ? 'bg-accent ring-2 ring-primary' : ''
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="border rounded-lg p-2 sm:p-4 space-y-4">
                        {selectedAvatarSeed && (
                          <div className="flex items-center gap-3 p-2 sm:p-3 bg-muted rounded-lg">
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                              <AvatarImage 
                                src={getAvatarUrl(
                                  selectedAvatarSeed,
                                  selectedAvatarSeed.split('-')[0] as GroupAvatarStyle
                                )} 
                                alt="Selected avatar"
                              />
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium">Avatar seleccionado</p>
                              <p className="text-xs text-muted-foreground truncate">
                                Click abajo para cambiar
                              </p>
                            </div>
                          </div>
                        )}
                        <GroupAvatarPicker 
                          onSelect={setSelectedAvatarSeed}
                          currentSeed={selectedAvatarSeed || undefined}
                        />
                      </div>
                    )}
                  </div>

                  {/* Group Name */}
                  <div>
                    <Label htmlFor="group-name">Group Name *</Label>
                    <Input
                      id="group-name"
                      placeholder="Group name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Group Description */}
                  <div>
                    <Label htmlFor="group-description">Description</Label>
                    <Textarea
                      id="group-description"
                      placeholder="What's this group about?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={200}
                      rows={3}
                    />
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveGroupDetails}
                    disabled={isSaving || !groupName.trim()}
                    className="w-full"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>

                  {/* Delete Group Button */}
                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      onClick={() => setShowDeleteGroupDialog(true)}
                      className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Delete Group for Everyone
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      This action cannot be undone. The group will be deleted for all participants.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Edit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Only administrators can edit group details</p>
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Loading participants...
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] sm:max-h-[400px] overflow-y-auto">
                  {participants.map((participant) => {
                    const isAdmin = chat.adminIds?.includes(participant.id);
                    const isCreator = participant.id === chat.createdBy;
                    const canManage = isCurrentUserAdmin && participant.id !== currentUser?.uid;

                    return (
                      <div
                        key={participant.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted"
                      >
                        <UserAvatar user={participant} className="h-8 w-8 sm:h-10 sm:w-10" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <p className="text-xs sm:text-sm font-medium truncate">
                              {participant.name}
                            </p>
                            {/* Insignia de admin de plataforma */}
                            {participant.role === 'admin' && (
                              <RoleBadge type="platform-admin" size="sm" />
                            )}
                            {/* Insignia de creador del grupo */}
                            {isCreator && (
                              <RoleBadge type="group-creator" size="sm" />
                            )}
                            {/* Insignia de co-creador/admin del grupo */}
                            {isAdmin && !isCreator && (
                              <RoleBadge type="group-admin" size="sm" />
                            )}
                            {participant.id === currentUser?.uid && (
                              <Badge className="text-xs border px-1 py-0">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate hidden sm:block">
                            {participant.email}
                          </p>
                        </div>

                        {/* Actions - Ver perfil y enviar mensaje */}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => router.push(`/dashboard/profile/${participant.id}`)}
                            title="Ver perfil"
                            className="p-2 hover:bg-accent rounded-md"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {participant.id !== currentUser?.uid && (
                            <button
                              type="button"
                              onClick={() => handleSendMessage(participant)}
                              title="Enviar mensaje"
                              className="p-2 hover:bg-accent rounded-md"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* Actions for admins */}
                        {canManage && !isCreator && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleAdmin(participant.id)}
                              title={isAdmin ? 'Remove admin' : 'Make admin'}
                              className="p-2 hover:bg-accent rounded-md"
                            >
                              {isAdmin ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveParticipant(participant)}
                              title="Remove from group"
                              className="p-2 hover:bg-accent rounded-md text-destructive"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Add Members Tab */}
            <TabsContent value="add" className="space-y-4 mt-4">
              {isCurrentUserAdmin ? (
                <>
                  <Tabs defaultValue="recent" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="recent">
                        <Clock className="h-4 w-4 mr-2" />
                        Recent
                      </TabsTrigger>
                      <TabsTrigger value="pin">
                        <Plus className="h-4 w-4 mr-2" />
                        By PIN
                      </TabsTrigger>
                    </TabsList>

                    {/* Recent Contacts Tab */}
                    <TabsContent value="recent" className="space-y-2 mt-4">
                      {isLoadingContacts ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          Loading recent contacts...
                        </div>
                      ) : recentContacts.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No recent contacts available. Use the PIN tab to add members.
                        </div>
                      ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2">
                          {recentContacts.map((contact) => (
                            <div
                              key={contact.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                              onClick={() => handleAddFromRecent(contact)}
                            >
                              <UserAvatar user={contact} className="h-10 w-10" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{contact.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {contact.email}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="p-2 hover:bg-accent rounded-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFromRecent(contact);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* By PIN Tab */}
                    <TabsContent value="pin" className="mt-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter user PIN"
                          value={pinInput}
                          onChange={(e) => setPinInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMemberByPin();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleAddMemberByPin}
                          disabled={isSearching || !pinInput.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Only administrators can add new members</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 hover:bg-accent"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Participant Confirmation */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{userToRemove?.name}</strong> from this group?
              They will no longer have access to the chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveParticipant}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={showDeleteGroupDialog} onOpenChange={setShowDeleteGroupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the group and all its messages for <strong>ALL participants</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
