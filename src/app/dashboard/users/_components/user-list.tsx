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
import { MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const roleVariantMap: { [key in User['rol']]: 'default' | 'secondary' | 'outline' } = {
  admin: 'default',
  moderador: 'secondary',
  usuario: 'outline',
};

const statusClasses: { [key in User['estado']]: string } = {
  activo: 'bg-green-500',
  ausente: 'bg-yellow-500',
  ocupado: 'bg-red-500',
  inactivo: 'bg-gray-400',
};

export function UserList({ users }: { users: User[] }) {
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
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} className="h-10 w-10" />
                  <div className="font-medium">
                    <p>{user.nombre}</p>
                    <p className="text-sm text-muted-foreground md:hidden">{user.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                 <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusClasses[user.estado]}`} />
                    <span className="capitalize">{user.estado}</span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={roleVariantMap[user.rol]} className="capitalize">
                  {user.rol}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDistanceToNow(new Date(user.ultimoLogin), { addSuffix: true })}
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
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
// Add Card import for the component
import { Card } from '@/components/ui/card';