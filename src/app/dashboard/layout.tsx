'use client';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { ChatList } from './_components/chat-list';
import { UserMenu } from './_components/user-menu';
import { MainHeader } from './_components/main-header';
import { usePathname } from 'next/navigation';
import { usePushNotifications } from '@/hooks/use-push-notifications';

function getTitleForPath(path: string): string {
  if (path.startsWith('/dashboard/chat')) {
    return 'Chat';
  }
  if (path.startsWith('/dashboard/settings')) {
    return 'Settings';
  }
  if (path.startsWith('/dashboard/users')) {
    return 'Users';
  }
  return 'Dashboard';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title = getTitleForPath(pathname);
  
  // Inicializar notificaciones push
  usePushNotifications();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="grid h-screen w-full grid-cols-1 md:grid-cols-[auto_1fr] bg-background">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent>
            <ChatList />
          </SidebarContent>
          <SidebarFooter>
            <UserMenu />
          </SidebarFooter>
        </Sidebar>
        <div className="flex flex-col h-screen overflow-hidden">
          <MainHeader title={title} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
