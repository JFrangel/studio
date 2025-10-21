import { MessagesSquare } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="hidden md:flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
      <MessagesSquare className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight font-headline">
        Welcome to ChatStatus
      </h2>
      <p className="text-sm sm:text-base text-muted-foreground">
        Select a chat from the sidebar to start messaging.
      </p>
    </div>
  );
}
