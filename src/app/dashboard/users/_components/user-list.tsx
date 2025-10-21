'use client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/user-avatar';
import type { User } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ShieldAlert, Eye, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RoleBadge } from '@/components/role-badges';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { UserDetailsDialog } from './user-details-dialog';
import { useRouter } from 'next/navigation';

const roleVariantMap: { [key in User['role']]: 'default' | 'secondary' | 'outline' } = {
  admin: 'default',
  moderator: 'secondary',
  user: 'outline',
};

const statusClasses: { [key in User['status']]: string } = {
  active: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  inactive: 'bg-gray-400',
};

export function UserList() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  
  const { data: users, isLoading, error } = useCollection<User>(usersQuery);

  const handleViewDetails = (user: User) => {
    console.log('View details for user:', user);
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  const handleSendMessage = async (user: User) => {
    console.log('Send message to user:', user);
    if (!firestore || !currentUser) return;
    
    // Buscar si ya existe un chat privado con este usuario
    const chatsRef = collection(firestore, 'chats');
    const q = query(
      chatsRef,
      where('type', '==', 'private'),
      where('participantIds', 'array-contains', currentUser.uid)
    );
    
    // Por ahora, simplemente navegar al dashboard
    // La lógica de crear/buscar chat se puede implementar después
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Role</TableHead>
              <TableHead className="hidden lg:table-cell">Last Login</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="font-medium">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32 mt-1 md:hidden" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 flex flex-col items-center justify-center gap-4 text-center">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h3 className="text-xl font-semibold">Error fetching users</h3>
        <p className="text-muted-foreground text-sm">{error.message}</p>
        <p className="text-xs text-muted-foreground">Please check your Firestore security rules.</p>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden md:table-cell">Role</TableHead>
            <TableHead className="hidden lg:table-cell">Last Login</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} className="h-10 w-10" />
                  <div className="font-medium">
                    <div className="flex items-center gap-2">
                      <p>{user.name}</p>
                      {user.role === 'admin' && <RoleBadge type="platform-admin" size="sm" />}
                    </div>
                    <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                 <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusClasses[user.status]}`} />
                    <span className="capitalize">{user.status}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={roleVariantMap[user.role]} className="capitalize">
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button aria-haspopup="true" size="icon" variant="ghost">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendMessage(user)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Enviar Mensaje
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <UserDetailsDialog
          user={selectedUser}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
        />
      )}
    </Card>
  );
}
