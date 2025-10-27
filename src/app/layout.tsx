'use client';

// IMPORTANTE: Parchear localStorage ANTES de cualquier otra importación
if (typeof window === "undefined" && typeof global !== "undefined") {
  const storage = {
    getItem: function(key: string) { return null; },
    setItem: function(key: string, value: string) {},
    removeItem: function(key: string) {},
    clear: function() {},
    key: function(index: number) { return null; },
    length: 0
  };
  // @ts-ignore
  if (!global.localStorage) {
    // @ts-ignore
    global.localStorage = storage;
  }
  // @ts-ignore
  if (typeof localStorage === "undefined") {
    // @ts-ignore
    globalThis.localStorage = storage;
  }
}

import dynamic from 'next/dynamic';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/contexts/theme-context';

// Importar dinámicamente los proveedores de Firebase solo en el cliente
const FirebaseClientProvider = dynamic(() => import('@/firebase/client-provider').then(mod => ({ default: mod.FirebaseClientProvider })), {
  ssr: false,
  loading: () => <div>Loading Firebase...</div>
});

const AuthProvider = dynamic(() => import('@/firebase/auth-provider').then(mod => ({ default: mod.AuthProvider })), {
  ssr: false
});

const metadata: Metadata = {
  title: 'ChatStatus',
  description: 'Plataforma Web de Mensajería Empresarial',
};

function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div>Loading...</div>;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider>
          <FirebaseClientProvider>
            <AppLayout>{children}</AppLayout>
          </FirebaseClientProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
