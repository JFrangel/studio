'use client';

import { UserList } from './_components/user-list';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSidebar } from '@/components/ui/sidebar';

export default function UsersPage() {
  const { user: authUser } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading } = useDoc<User>(userDocRef);

  // Verificar si el usuario es admin
  const isAdmin = userProfile?.role === 'admin';

  const handleBackToDashboard = () => {
    if (isMobile) {
      // En móvil, abrir el sidebar en lugar de navegar
      setOpenMobile(true);
    }
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </main>
    );
  }

  // Si no es admin, mostrar mensaje de acceso denegado
  if (!isAdmin) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Button
          onClick={handleBackToDashboard}
          className="mb-4 border"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Alert className="max-w-md">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">Acceso Denegado</AlertTitle>
            <AlertDescription className="mt-2">
              No tienes permisos para acceder a esta página. Solo los administradores pueden ver y gestionar usuarios.
            </AlertDescription>
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6">
      <Button
        onClick={handleBackToDashboard}
        className="mb-4 border"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-headline font-semibold">Users Management</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
      <UserList />
    </main>
  );
}
