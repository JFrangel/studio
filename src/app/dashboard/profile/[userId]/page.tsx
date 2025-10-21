'use client';

import { use } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { UserAvatar } from '@/components/user-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Copy, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const { userId } = use(params);
  const [copied, setCopied] = useState(false);

  const userRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'users', userId);
  }, [firestore, userId]);

  const { data: profileUser, isLoading, error } = useDoc<User>(userRef);

  const handleCopyPin = () => {
    if (profileUser?.pin) {
      navigator.clipboard.writeText(profileUser.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOwnProfile = currentUser?.uid === userId;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading profile</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>User not found</AlertTitle>
          <AlertDescription>This user doesn't exist or you don't have permission to view their profile.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col items-center text-center">
            <UserAvatar user={profileUser} className="h-24 w-24 mb-4" showStatus={true} />
            <CardTitle className="text-2xl font-headline">
              {profileUser.name}
              {isOwnProfile && <span className="text-muted-foreground ml-2">(yo)</span>}
            </CardTitle>
            <CardDescription className="mt-2">
              {profileUser.status === 'active' ? '🟢 Online' : '⚪ Offline'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileUser.description && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{profileUser.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-semibold mb-2">PIN Code</h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono">
                {profileUser.pin}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPin}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isOwnProfile 
                ? 'Share this PIN with others so they can chat with you'
                : 'Use this PIN to start a chat with this user'}
            </p>
          </div>

          {profileUser.email && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Email</h3>
              <p className="text-sm text-muted-foreground">{profileUser.email}</p>
            </div>
          )}

          {!isOwnProfile && (
            <Button className="w-full" onClick={() => router.push('/dashboard')}>
              Start Chat
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
