'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, doc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Lock, Unlock, AlertCircle, CheckCircle } from 'lucide-react';
import type { Chat } from '@/lib/types';

type InviteStatus = 'loading' | 'found' | 'not-found' | 'already-member' | 'joining' | 'success' | 'error' | 'request-sent';

export default function JoinByInvitePage() {
  const router = useRouter();
  const params = useParams();
  const inviteCode = params.inviteCode as string;
  const { user: currentUser } = useUser();
  const firestore = useFirestore();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [group, setGroup] = useState<(Chat & { id: string }) | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!firestore || !currentUser || !inviteCode) return;

    const findGroup = async () => {
      try {
        // Buscar grupo por inviteCode
        const chatsRef = collection(firestore, 'chats');
        const q = query(
          chatsRef,
          where('type', '==', 'group'),
          where('inviteCode', '==', inviteCode)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setStatus('not-found');
          return;
        }

        const groupDoc = querySnapshot.docs[0];
        const groupData = { id: groupDoc.id, ...groupDoc.data() } as Chat & { id: string };

        // Verificar si ya es miembro
        if (groupData.participantIds.includes(currentUser.uid)) {
          setStatus('already-member');
          setGroup(groupData);
          // Redirigir al chat después de 2 segundos
          setTimeout(() => {
            router.push(`/dashboard/chat/${groupData.id}`);
          }, 2000);
          return;
        }

        setGroup(groupData);
        setStatus('found');
      } catch (error) {
        console.error('Error finding group:', error);
        setStatus('error');
        setError('Error al buscar el grupo');
      }
    };

    findGroup();
  }, [firestore, currentUser, inviteCode, router]);

  const handleJoinGroup = async () => {
    if (!group || !firestore || !currentUser) return;

    setStatus('joining');
    setError('');

    try {
      const chatRef = doc(firestore, 'chats', group.id);
      const now = new Date().toISOString();
      
      // Determinar si el grupo es privado
      const isPrivate = group.visibility === 'private';
      
      if (isPrivate) {
        // Verificar si ya hay una solicitud pendiente
        const existingRequest = group.joinRequests?.find(
          (req) => req.userId === currentUser.uid && req.status === 'pending'
        );
        
        if (existingRequest) {
          setError('Ya tienes una solicitud pendiente para unirte a este grupo.');
          setStatus('found');
          return;
        }

        // Crear solicitud de unión
        const newRequest = {
          userId: currentUser.uid,
          userName: currentUser.displayName || currentUser.email || 'Usuario',
          userEmail: currentUser.email || '',
          requestedAt: now,
          status: 'pending' as const,
        };

        await setDocumentNonBlocking(
          chatRef,
          {
            joinRequests: arrayUnion(newRequest),
          },
          { merge: true }
        );

        setStatus('request-sent');
        
        // Redirigir al dashboard después de 3 segundos
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        // Grupo público - unirse directamente
        await setDocumentNonBlocking(
          chatRef,
          {
            participantIds: arrayUnion(currentUser.uid),
            lastMessageAt: now,
          },
          { merge: true }
        );

        // Crear mensaje del sistema
        const messagesRef = collection(firestore, 'chats', group.id, 'messages');
        const userName = currentUser.displayName || currentUser.email || 'Usuario';
        
        const joinMessage = {
          senderId: 'system',
          content: `${userName} se ha unido al grupo`,
          type: 'system',
          systemMessageType: 'member_joined',
          readBy: [],
          sentAt: now,
          edited: false,
        };
        
        await addDocumentNonBlocking(messagesRef, joinMessage);

        setStatus('success');
        
        // Redirigir al chat después de 1.5 segundos
        setTimeout(() => {
          router.push(`/dashboard/chat/${group.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      setStatus('error');
      setError('Error al unirse al grupo');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Buscando grupo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Invitación no válida</CardTitle>
            <CardDescription>
              Este enlace de invitación no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'already-member') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Ya eres miembro</CardTitle>
            <CardDescription>
              Ya formas parte de <strong>{group?.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirigiendo al chat...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">¡Te has unido al grupo!</CardTitle>
            <CardDescription>
              Bienvenido a <strong>{group?.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirigiendo al chat...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'request-sent') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Solicitud enviada</CardTitle>
            <CardDescription>
              Tu solicitud para unirte a <strong>{group?.name}</strong> ha sido enviada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                Los administradores del grupo revisarán tu solicitud. Serás notificado cuando sea aprobada.
              </p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Redirigiendo al dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Error</CardTitle>
            <CardDescription>
              {error || 'Ocurrió un error al intentar unirse al grupo'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Estado 'found' - Mostrar detalles del grupo
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            {group?.groupImage ? (
              <div className="text-4xl">{group.groupImage}</div>
            ) : (
              <Users className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl mb-2">{group?.name || 'Grupo'}</CardTitle>
            {group?.description && (
              <CardDescription className="text-base">
                {group.description}
              </CardDescription>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Información del grupo */}
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{group?.participantIds.length || 0} miembros</span>
            </div>
            {group?.visibility && (
              <Badge className={group.visibility === 'public' ? '' : 'bg-secondary'}>
                {group.visibility === 'public' ? (
                  <>
                    <Unlock className="h-3 w-3 mr-1" />
                    Público
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 mr-1" />
                    Privado
                  </>
                )}
              </Badge>
            )}
          </div>

          {/* Mensaje informativo */}
          {group?.visibility === 'private' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Este grupo es privado. Tu solicitud será revisada por los administradores.
              </p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleJoinGroup}
              disabled={status === 'joining'}
              className="w-full"
            >
              {status === 'joining' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {group?.visibility === 'private' ? 'Enviando solicitud...' : 'Uniéndose...'}
                </>
              ) : (
                <>
                  {group?.visibility === 'private' ? 'Solicitar Unirse' : 'Unirse al Grupo'}
                </>
              )}
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full border"
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
