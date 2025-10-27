'use client';
import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getAvatarUrl, type GroupAvatarStyle } from '@/lib/avatars';
import type { User, Chat } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  MessageSquare, 
  Shield, 
  Clock, 
  Mail, 
  Trash2,
  Eye,
  UserX,
  Copy
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface UserDetailsDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps) {
  const firestore = useFirestore();
  const router = useRouter();
  const [userGroups, setUserGroups] = useState<(Chat & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [groupToDelete, setGroupToDelete] = useState<(Chat & { id: string }) | null>(null);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías agregar un toast notification
    alert(`${label} copiado al portapapeles`);
  };

  // Cargar grupos del usuario
  useEffect(() => {
    if (!firestore || !user || !open) return;

    const loadUserGroups = async () => {
      setIsLoading(true);
      try {
        const chatsRef = collection(firestore, 'chats');
        const q = query(
          chatsRef,
          where('type', '==', 'group'),
          where('participantIds', 'array-contains', user.id)
        );
        
        const snapshot = await getDocs(q);
        const groups = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Chat & { id: string }));
        
        setUserGroups(groups);
      } catch (error) {
        console.error('Error loading user groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserGroups();
  }, [firestore, user, open]);

  const handleViewGroup = (groupId: string) => {
    router.push(`/dashboard/chat/${groupId}`);
    onOpenChange(false);
  };

  const handleDeleteGroup = (group: Chat & { id: string }) => {
    setGroupToDelete(group);
    setShowDeleteGroupDialog(true);
  };

  const confirmDeleteGroup = async () => {
    if (!firestore || !groupToDelete) return;

    try {
      // Eliminar mensajes del grupo
      const messagesRef = collection(firestore, 'chats', groupToDelete.id, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Eliminar el grupo
      await deleteDoc(doc(firestore, 'chats', groupToDelete.id));

      // Actualizar la lista local
      setUserGroups(userGroups.filter(g => g.id !== groupToDelete.id));
      setShowDeleteGroupDialog(false);
      setGroupToDelete(null);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Error al eliminar el grupo');
    }
  };

  const statusClasses: { [key in User['status']]: string } = {
    active: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    inactive: 'bg-gray-400',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalles del Usuario</DialogTitle>
            <DialogDescription className="text-sm">
              Vista completa de administrador con acceso a grupos y actividad
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="groups">
                Grupos ({userGroups.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              {/* Información del usuario */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <UserAvatar user={user} className="h-16 w-16" />
                    <div className="flex-1">
                      <CardTitle className="text-base sm:text-lg">{user.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusClasses[user.status]}`} />
                        <span className="capitalize">{user.status}</span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span className="text-muted-foreground flex-1">{user.email}</span>
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => copyToClipboard(user.email, 'Email')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Rol:</span>
                    <Badge className="capitalize">{user.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Último acceso:</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Visible en búsqueda:</span>
                    <Badge variant={user.searchable ? 'default' : 'secondary'}>
                      {user.searchable ? 'Sí' : 'No'}
                    </Badge>
                  </div>
                  {user.pin && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">PIN del Usuario:</span>
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono flex-1">
                        {user.pin}
                      </code>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(user.pin, 'PIN')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="flex-1">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : userGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <UserX className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Este usuario no está en ningún grupo
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {userGroups.map((group) => (
                    <Card key={group.id}>
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          {group.groupAvatarStyle === 'avatar' && group.groupAvatarSeed ? (
                            <Avatar className="h-12 w-12 shrink-0">
                              <AvatarImage 
                                src={getAvatarUrl(
                                  group.groupAvatarSeed,
                                  group.groupAvatarSeed.split('-')[0] as GroupAvatarStyle
                                )} 
                                alt={group.name || 'Group'}
                              />
                              <AvatarFallback>{group.name?.[0] || '👥'}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl shrink-0">
                              {group.groupImage || '👥'}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {group.participantIds.length} miembros
                              {group.adminIds?.includes(user.id) && (
                                <Badge className="ml-2 text-xs">Admin</Badge>
                              )}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewGroup(group.id)}
                              className="text-xs"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Ver</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteGroup(group)}
                              className="text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Eliminar</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para confirmar eliminación de grupo */}
      <AlertDialog open={showDeleteGroupDialog} onOpenChange={setShowDeleteGroupDialog}>
        <AlertDialogContent className="w-[95vw] max-w-md sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              ¿Eliminar grupo "{groupToDelete?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Esta acción es permanente y eliminará el grupo para todos los miembros. 
              Los usuarios no sabrán que fue eliminado por un administrador.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto m-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteGroup}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 m-0"
            >
              Eliminar grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
