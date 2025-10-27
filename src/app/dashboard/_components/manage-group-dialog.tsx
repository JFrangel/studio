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
import { Shield, ShieldOff, UserMinus, AlertTriangle, Edit, Users, Plus, Clock, Info, Copy, Check, Link2, Hash, Sparkles, Eye, MessageSquare, Lock, Unlock, UserCheck, UserX, CheckCircle, XCircle, LogOut } from 'lucide-react';
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
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false);
  
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
  
  // Visibility states
  const [groupVisibility, setGroupVisibility] = useState<'public' | 'private'>('public');
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  
  // Join requests
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

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
      setGroupVisibility(chat.visibility || 'public');
      setJoinRequests(chat.joinRequests || []);
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
      setError('El nombre del grupo es requerido');
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
      setError('Error al actualizar el grupo');
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
        setError('Usuario no encontrado con este PIN');
        setIsSearching(false);
        return;
      }

      const userData = querySnapshot.docs[0];
      const user: User = { id: userData.id, ...userData.data() } as User;

      // Verificar que no esté ya en el grupo
      if (chat.participantIds.includes(user.id)) {
        setError('El usuario ya está en este grupo');
        setIsSearching(false);
        return;
      }

      // Agregar al grupo
      const chatRef = doc(firestore, 'chats', chat.id);
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayUnion(user.id),
          lastMessageAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Crear mensaje del sistema
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      const now = new Date().toISOString();
      
      const joinMessage: Omit<Message, 'id'> = {
        senderId: 'system',
        content: `${user.name || user.email} se ha unido al grupo`,
        type: 'system',
        systemMessageType: 'member_joined',
        readBy: [],
        sentAt: now,
        edited: false,
      };
      
      await addDocumentNonBlocking(messagesRef, joinMessage);

      // Recargar participantes
      await loadParticipants();
      setPinInput('');
      setError('');
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Error al agregar miembro');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromRecent = async (user: User) => {
    if (!firestore) return;

    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      const now = new Date().toISOString();
      
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayUnion(user.id),
          lastMessageAt: now,
        },
        { merge: true }
      );

      // Crear mensaje del sistema
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      
      const joinMessage: Omit<Message, 'id'> = {
        senderId: 'system',
        content: `${user.name || user.email} se ha unido al grupo`,
        type: 'system',
        systemMessageType: 'member_joined',
        readBy: [],
        sentAt: now,
        edited: false,
      };
      
      await addDocumentNonBlocking(messagesRef, joinMessage);

      // Recargar participantes y contactos
      await loadParticipants();
      await loadRecentContacts();
      setError('');
    } catch (error) {
      console.error('Error adding member:', error);
      setError('Error al agregar miembro');
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
      alert('No se puede eliminar al creador del grupo');
      return;
    }

    // Confirmar eliminación
    setUserToRemove(user);
  };

  const confirmRemoveParticipant = async () => {
    if (!firestore || !userToRemove || !currentUser) return;

    const chatRef = doc(firestore, 'chats', chat.id);
    const now = new Date().toISOString();

    try {
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayRemove(userToRemove.id),
          adminIds: arrayRemove(userToRemove.id), // También remover de admins si lo era
          lastMessageAt: now,
        },
        { merge: true }
      );

      // Crear mensaje del sistema
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      const adminName = currentUser.displayName || currentUser.email || 'Un administrador';
      
      const removeMessage: Omit<Message, 'id'> = {
        senderId: 'system',
        content: `${adminName} ha eliminado a ${userToRemove.name} del grupo`,
        type: 'system',
        systemMessageType: 'member_left',
        readBy: [],
        sentAt: now,
        edited: false,
      };
      
      await addDocumentNonBlocking(messagesRef, removeMessage);

      setParticipants(participants.filter(p => p.id !== userToRemove.id));
      setUserToRemove(null);
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  const handleUpdateVisibility = async (newVisibility: 'public' | 'private') => {
    if (!firestore || !isCurrentUserAdmin) return;

    setIsUpdatingVisibility(true);
    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      await setDocumentNonBlocking(
        chatRef,
        { visibility: newVisibility },
        { merge: true }
      );
      setGroupVisibility(newVisibility);
    } catch (error) {
      console.error('Error updating visibility:', error);
      alert('Error al actualizar la visibilidad');
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleApproveRequest = async (userId: string) => {
    if (!firestore || !isCurrentUserAdmin) return;

    setProcessingRequest(userId);
    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      const request = joinRequests.find(r => r.userId === userId);
      
      if (!request) return;

      const now = new Date().toISOString();

      // Agregar al participante
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayUnion(userId),
          joinRequests: joinRequests.filter(r => r.userId !== userId),
          lastMessageAt: now,
        },
        { merge: true }
      );

      // Crear mensaje del sistema
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      
      const joinMessage: Omit<Message, 'id'> = {
        senderId: 'system',
        content: `${request.userName} se ha unido al grupo`,
        type: 'system',
        systemMessageType: 'member_joined',
        readBy: [],
        sentAt: now,
        edited: false,
      };
      
      await addDocumentNonBlocking(messagesRef, joinMessage);

      // Actualizar estado local
      setJoinRequests(joinRequests.filter(r => r.userId !== userId));
      
      // Recargar participantes
      loadParticipants();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Error al aprobar la solicitud');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    if (!firestore || !isCurrentUserAdmin) return;

    setProcessingRequest(userId);
    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      
      // Remover la solicitud
      await setDocumentNonBlocking(
        chatRef,
        {
          joinRequests: joinRequests.filter(r => r.userId !== userId)
        },
        { merge: true }
      );

      // Actualizar estado local
      setJoinRequests(joinRequests.filter(r => r.userId !== userId));
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setProcessingRequest(null);
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
      alert('Error al eliminar el grupo');
    }
  };

  const handleLeaveGroup = async () => {
    if (!firestore || !currentUser) return;

    try {
      // Si es el creador, no puede salirse
      if (currentUser.uid === chat.createdBy) {
        alert('El creador del grupo no puede salirse. Debes eliminar el grupo o transferir la propiedad primero.');
        return;
      }

      const chatRef = doc(firestore, 'chats', chat.id);
      const messagesRef = collection(firestore, 'chats', chat.id, 'messages');
      const now = new Date().toISOString();
      const userName = currentUser.displayName || currentUser.email || 'Usuario';

      // Guardar el nombre del grupo en localStorage para mostrarlo en la página de salida
      localStorage.setItem(`left-group-${chat.id}`, chat.name || 'Grupo');

      // Crear mensaje del sistema ANTES de salirse
      const leaveMessage: Omit<Message, 'id'> = {
        senderId: 'system',
        content: `${userName} ha abandonado el grupo`,
        type: 'system',
        systemMessageType: 'member_left',
        readBy: [],
        sentAt: now,
        edited: false,
      };
      
      await addDocumentNonBlocking(messagesRef, leaveMessage);

      // Remover del grupo
      await setDocumentNonBlocking(
        chatRef,
        {
          participantIds: arrayRemove(currentUser.uid),
          adminIds: arrayRemove(currentUser.uid), // También remover de admins si lo era
          lastMessageAt: now,
        },
        { merge: true }
      );

      // Cerrar TODOS los diálogos inmediatamente
      setShowLeaveGroupDialog(false);
      onOpenChange(false);
      
      // Redirigir a la página de "salida del grupo"
      router.push(`/dashboard/left-group/${chat.id}`);
    } catch (error) {
      console.error('Error leaving group:', error);
      // Incluso si hay error, redirigir a la página de salida
      localStorage.setItem(`left-group-${chat.id}`, chat.name || 'Grupo');
      setShowLeaveGroupDialog(false);
      onOpenChange(false);
      router.push(`/dashboard/left-group/${chat.id}`);
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto w-[95vw] group-settings manage-group">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg group-header">Configuración del Grupo</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm group-info">
              Edita los detalles del grupo, gestiona miembros y administradores
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className={`grid w-full ${isCurrentUserAdmin ? 'grid-cols-5' : 'grid-cols-3'}`}>
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
                <>
                  <TabsTrigger value="privacy" className="text-xs sm:text-sm px-2 relative">
                    {groupVisibility === 'private' ? <Lock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" /> : <Unlock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />}
                    <span className="hidden sm:inline">Privacidad</span>
                    {joinRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {joinRequests.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="add" className="text-xs sm:text-sm px-2">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Agregar</span>
                  </TabsTrigger>
                </>
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
                      <span>{participants.length} miembros</span>
                      {chat.visibility && (
                        <>
                          <span>•</span>
                          <Badge className="text-xs">
                            {chat.visibility === 'public' ? (
                              <span className="flex items-center gap-1">
                                <Unlock className="h-3 w-3" />
                                Público
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Privado
                              </span>
                            )}
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
                        <Label className="text-xs text-muted-foreground">PIN del Grupo</Label>
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
                          Comparte este PIN con otros para permitirles unirse al grupo
                        </p>
                      </div>
                    )}

                    {/* Invite Link */}
                    {chat.inviteCode && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Enlace de Invitación</Label>
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
                          Comparte este enlace para invitar personas directamente al grupo
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Creation Info */}
                {chat.createdAt && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-lg bg-muted/50">
                    <Clock className="h-3 w-3" />
                    <span>Creado el {new Date(chat.createdAt).toLocaleDateString()}</span>
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
                    <Label htmlFor="group-name">Nombre del Grupo *</Label>
                    <Input
                      id="group-name"
                      placeholder="Nombre del grupo"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      maxLength={50}
                    />
                  </div>

                  {/* Group Description */}
                  <div>
                    <Label htmlFor="group-description">Descripción</Label>
                    <Textarea
                      id="group-description"
                      placeholder="¿De qué trata este grupo?"
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
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>

                  {/* Delete Group Button - Solo para administradores */}
                  {isCurrentUserAdmin && (
                    <div className="pt-4 border-t">
                      <Button
                        type="button"
                        onClick={() => setShowDeleteGroupDialog(true)}
                        className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        Eliminar Grupo para Todos
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Esta acción no se puede deshacer. El grupo será eliminado para todos los participantes.
                      </p>
                    </div>
                  )}

                  {/* Leave Group Button - Para todos los participantes excepto el creador */}
                  {currentUser?.uid !== chat.createdBy && (
                    <div className={isCurrentUserAdmin ? "pt-4" : "pt-4 border-t"}>
                      <Button
                        type="button"
                        onClick={() => setShowLeaveGroupDialog(true)}
                        className="w-full bg-orange-500 text-white hover:bg-orange-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir del Grupo
                      </Button>
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Ya no podrás ver los mensajes ni participar en este grupo.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Edit className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Solo los administradores pueden editar los detalles del grupo</p>
                  
                  {/* Leave Group Button para usuarios no administradores */}
                  {currentUser?.uid !== chat.createdBy && (
                    <div className="mt-6">
                      <Button
                        type="button"
                        onClick={() => setShowLeaveGroupDialog(true)}
                        className="bg-orange-500 text-white hover:bg-orange-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Salir del Grupo
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4 mt-4">
              {isLoading ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Cargando participantes...
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
                                Tú
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
                              title={isAdmin ? 'Remover admin' : 'Hacer admin'}
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
                              title="Eliminar del grupo"
                              className="p-2 hover:bg-accent rounded-md text-destructive"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        
                        {/* Leave button for current user (if not creator) */}
                        {participant.id === currentUser?.uid && !isCreator && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setShowLeaveGroupDialog(true)}
                              title="Salir del grupo"
                              className="p-2 hover:bg-orange-500/10 rounded-md text-orange-600"
                            >
                              <LogOut className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-4 mt-4">
              {isCurrentUserAdmin && (
                <>
                  {/* Visibility Settings */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Visibilidad del Grupo</h3>
                    <p className="text-xs text-muted-foreground">
                      Controla quién puede unirse a este grupo
                    </p>
                    
                    <div className="grid gap-3">
                      {/* Public Option */}
                      <button
                        onClick={() => handleUpdateVisibility('public')}
                        disabled={isUpdatingVisibility || groupVisibility === 'public'}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                          groupVisibility === 'public'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isUpdatingVisibility ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Unlock className={`h-5 w-5 mt-0.5 ${groupVisibility === 'public' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Público</p>
                            {groupVisibility === 'public' && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Cualquiera con el PIN o enlace de invitación puede unirse inmediatamente
                          </p>
                        </div>
                      </button>

                      {/* Private Option */}
                      <button
                        onClick={() => handleUpdateVisibility('private')}
                        disabled={isUpdatingVisibility || groupVisibility === 'private'}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                          groupVisibility === 'private'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        } ${isUpdatingVisibility ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <Lock className={`h-5 w-5 mt-0.5 ${groupVisibility === 'private' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Privado</p>
                            {groupVisibility === 'private' && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requiere aprobación de los administradores antes de unirse
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Join Requests Section */}
                  {groupVisibility === 'private' && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Solicitudes de Unión</h3>
                        {joinRequests.length > 0 && (
                          <Badge className="bg-red-500 text-white">
                            {joinRequests.length} pendientes
                          </Badge>
                        )}
                      </div>
                      
                      {joinRequests.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                          <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No hay solicitudes de unión pendientes</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {joinRequests.map((request) => (
                            <div
                              key={request.userId}
                              className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{request.userName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {request.userEmail}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Solicitado el {new Date(request.requestedAt).toLocaleDateString()}
                                </p>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApproveRequest(request.userId)}
                                  disabled={processingRequest === request.userId}
                                  className="p-2 hover:bg-green-500/10 rounded-md text-green-600 disabled:opacity-50"
                                  title="Aprobar"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(request.userId)}
                                  disabled={processingRequest === request.userId}
                                  className="p-2 hover:bg-red-500/10 rounded-md text-red-600 disabled:opacity-50"
                                  title="Rechazar"
                                >
                                  <XCircle className="h-5 w-5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
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
                        Recientes
                      </TabsTrigger>
                      <TabsTrigger value="pin">
                        <Plus className="h-4 w-4 mr-2" />
                        Por PIN
                      </TabsTrigger>
                    </TabsList>

                    {/* Recent Contacts Tab */}
                    <TabsContent value="recent" className="space-y-2 mt-4">
                      {isLoadingContacts ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          Cargando contactos recientes...
                        </div>
                      ) : recentContacts.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          No hay contactos recientes disponibles. Usa la pestaña PIN para agregar miembros.
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
                          placeholder="Ingresa el PIN del usuario"
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
                  <p>Solo los administradores pueden agregar nuevos miembros</p>
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
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Participant Confirmation */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar a <strong>{userToRemove?.name}</strong> de este grupo?
              Ya no tendrán acceso al chat.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveParticipant}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirmation */}
      <AlertDialog open={showDeleteGroupDialog} onOpenChange={setShowDeleteGroupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto eliminará el grupo y todos sus mensajes para <strong>TODOS los participantes</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation */}
      <AlertDialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir de este grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Ya no podrás ver los mensajes ni participar en <strong>{chat.name}</strong>.
              Puedes volver a unirte más tarde si el grupo es público o si un administrador te invita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveGroup}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Salir del Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
