'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Users, Clock } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import type { User, Chat } from '@/lib/types';

const DEFAULT_GROUP_IMAGES = [
  '👥', '🎉', '💼', '🏠', '🎮', '📚', '🎨', '🏋️', 
  '🍕', '🎵', '⚽', '🌟', '💡', '🚀', '🎯', '🌈'
];

// Función para generar un PIN único de 6 dígitos
const generateGroupPin = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Función para generar un código de invitación único
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ open, onOpenChange }: CreateGroupDialogProps) {
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(DEFAULT_GROUP_IMAGES[0]);
  const [isPublic, setIsPublic] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [participants, setParticipants] = useState<User[]>([]);
  const [recentContacts, setRecentContacts] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Cargar contactos recientes cuando se abre el diálogo
  useEffect(() => {
    if (open && firestore && currentUser) {
      loadRecentContacts();
    }
  }, [open, firestore, currentUser]);

  const loadRecentContacts = async () => {
    if (!firestore || !currentUser) return;

    setIsLoadingContacts(true);
    try {
      // Obtener chats recientes del usuario (sin orderBy para evitar índice compuesto)
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

      // Extraer IDs de usuarios únicos de los chats
      chats.forEach((chat) => {
        chat.participantIds.forEach((id) => {
          if (id !== currentUser.uid) {
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

  const handleAddParticipant = async () => {
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

      // Verificar que no sea el usuario actual
      if (user.id === currentUser?.uid) {
        setError("You can't add yourself");
        setIsSearching(false);
        return;
      }

      // Verificar que no esté ya agregado
      if (participants.some(p => p.id === user.id)) {
        setError('User already added');
        setIsSearching(false);
        return;
      }

      setParticipants([...participants, user]);
      setPinInput('');
      setError('');
    } catch (error) {
      console.error('Error finding user:', error);
      setError('Error finding user');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    setParticipants(participants.filter(p => p.id !== userId));
  };

  const handleAddFromRecent = (user: User) => {
    if (participants.some(p => p.id === user.id)) {
      setError('User already added');
      return;
    }
    setParticipants([...participants, user]);
    setError('');
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (participants.length === 0) {
      setError('Add at least one participant');
      return;
    }

    if (!currentUser || !firestore) return;

    setIsCreating(true);
    setError('');

    try {
      const participantIds = [currentUser.uid, ...participants.map(p => p.id)];
      const now = new Date().toISOString();

      // Generar PIN único del grupo
      let groupPin = generateGroupPin();
      
      // Verificar que el PIN no exista ya (aunque es muy improbable)
      const chatsRef = collection(firestore, 'chats');
      const pinQuery = query(chatsRef, where('groupPin', '==', groupPin));
      const pinSnapshot = await getDocs(pinQuery);
      
      // Si el PIN ya existe, generar uno nuevo
      while (!pinSnapshot.empty) {
        groupPin = generateGroupPin();
        const newPinQuery = query(chatsRef, where('groupPin', '==', groupPin));
        const newPinSnapshot = await getDocs(newPinQuery);
        if (newPinSnapshot.empty) break;
      }

      const groupData: any = {
        name: groupName,
        type: 'group',
        participantIds,
        createdAt: now,
        createdBy: currentUser.uid,
        adminIds: [currentUser.uid], // El creador es el primer admin
        groupImage: selectedImage,
        groupPin: groupPin, // PIN único del grupo
        inviteCode: generateInviteCode(), // Código de invitación único
        isPublic: isPublic, // Público o privado
      };

      // Solo agregar description si tiene contenido
      if (description.trim()) {
        groupData.description = description;
      }

      addDocumentNonBlocking(chatsRef, groupData);

      // Cerrar diálogo y resetear
      onOpenChange(false);
      setGroupName('');
      setDescription('');
      setSelectedImage(DEFAULT_GROUP_IMAGES[0]);
      setIsPublic(false);
      setParticipants([]);
      setPinInput('');
      setRecentContacts([]);
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Error creating group');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Group</DialogTitle>
          <DialogDescription>
            Create a new group chat with multiple participants
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Image Selection */}
          <div>
            <Label>Group Image</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {DEFAULT_GROUP_IMAGES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedImage(emoji)}
                  className={`text-3xl p-2 rounded-lg hover:bg-accent transition-colors ${
                    selectedImage === emoji ? 'bg-accent ring-2 ring-primary' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Group Name */}
          <div>
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder="My awesome group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div>
            <Label htmlFor="group-description">Description (Optional)</Label>
            <Textarea
              id="group-description"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>

          {/* Group Visibility */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label htmlFor="group-visibility" className="text-base">
                Public Group
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic 
                  ? 'Anyone can find and join this group by searching or using the group PIN' 
                  : 'Only people with the invite link or PIN can join this group'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="group-visibility"
                type="checkbox"
                className="sr-only peer"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Add Participants with Tabs */}
          <div>
            <Label>Add Participants</Label>
            <Tabs defaultValue="recent" className="mt-2">
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
              <TabsContent value="recent" className="space-y-2">
                {isLoadingContacts ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    Loading recent contacts...
                  </div>
                ) : recentContacts.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No recent contacts found. Use the PIN tab to add participants.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {recentContacts
                      .filter(contact => !participants.some(p => p.id === contact.id))
                      .map((contact) => (
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
                          <Button type="button" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              {/* By PIN Tab */}
              <TabsContent value="pin">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter user PIN"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddParticipant();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAddParticipant}
                    disabled={isSearching || !pinInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Participants List */}
          {participants.length > 0 && (
            <div>
              <Label>Participants ({participants.length})</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted"
                  >
                    <UserAvatar user={participant} className="h-8 w-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{participant.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{participant.email}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveParticipant(participant.id)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Summary */}
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            <Users className="h-4 w-4 inline mr-2" />
            Total members: {participants.length + 1} (you + {participants.length} participants)
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || participants.length === 0}
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
