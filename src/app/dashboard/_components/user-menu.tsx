'use client';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Users } from 'lucide-react';
import { UserAvatar } from '@/components/user-avatar';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function UserMenu() {
  const { user } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    if(!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-4">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex flex-col">
          <div className="h-4 w-24 rounded-md bg-muted" />
          <div className="h-3 w-32 rounded-md bg-muted mt-1" />
        </div>
      </div>
    );
  }
  
  const userProfile = {
      id: user.uid,
      nombre: user.displayName || user.email || 'User',
      email: user.email || '',
      rol: 'usuario',
      foto: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
      ultimoLogin: user.metadata.lastSignInTime || new Date().toISOString(),
      estado: 'activo',
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto w-full justify-start text-left"
        >
          <div className="flex items-center gap-2">
            <UserAvatar user={userProfile} className="h-8 w-8" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{userProfile.nombre}</span>
              <span className="text-xs text-muted-foreground">{userProfile.email}</span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile.nombre}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/users">
            <Users className="mr-2 h-4 w-4" />
            <span>Users</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
