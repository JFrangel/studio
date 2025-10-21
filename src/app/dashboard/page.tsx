import { MessagesSquare } from 'lucide-react';
import { MainHeader } from './_components/main-header';

export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col">
      <MainHeader title="Dashboard" />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
        <MessagesSquare className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold tracking-tight font-headline">
          Welcome to ChatStatus
        </h2>
        <p className="text-muted-foreground">
          Select a chat from the sidebar to start messaging.
        </p>
      </main>
    </div>
  );
}
