import { MainHeader } from '../_components/main-header';
import { UserList } from './_components/user-list';
import { users } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="flex h-screen flex-col">
      <MainHeader title="User Management" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-headline font-semibold">Users</h2>
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add User
            </Button>
        </div>
        <UserList users={users} />
      </main>
    </div>
  );
}
