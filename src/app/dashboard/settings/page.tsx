'use client';
import { MainHeader } from '../_components/main-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/user-avatar';
import { useUser, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { Camera, Copy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const [name, setName] = useState('');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setStatus(userProfile.status || 'active');
    }
  }, [userProfile]);

  const handleProfileSave = () => {
    if (!userDocRef) return;
    setDocumentNonBlocking(userDocRef, {
      name: name,
      status: status,
    }, { merge: true });
    toast({ title: "Profile saved!", description: "Your changes have been updated." });
  };
  
  const handleCopyPin = () => {
    if(userProfile?.pin) {
      navigator.clipboard.writeText(userProfile.pin);
      toast({ title: "PIN Copied!", description: "You can now share your PIN with others." });
    }
  }

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !userProfile || !authUser) {
    return (
      <div className="flex h-screen flex-col">
        <MainHeader title="Profile" />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto grid max-w-3xl gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Profile</CardTitle>
                <CardDescription>
                  This is your public display name, avatar, and PIN.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="h-20 w-full bg-muted rounded-md animate-pulse"></div>
                 <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
                 <div className="h-10 w-full bg-muted rounded-md animate-pulse"></div>
              </CardContent>
               <CardFooter className="border-t px-6 py-4">
                <Button disabled>Save</Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <MainHeader title="Profile" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Public Profile</CardTitle>
              <CardDescription>
                This is your public display name, avatar, and PIN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar user={userProfile} className="h-20 w-20" />
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Change photo</span>
                  </Button>
                </div>
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              </div>
               <div className="grid gap-2">
                  <Label htmlFor="pin">Your User PIN</Label>
                  <div className="flex items-center gap-2">
                    <Input id="pin" value={userProfile.pin} readOnly className="font-mono text-lg tracking-widest" />
                    <Button variant="outline" size="icon" onClick={handleCopyPin}>
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy PIN</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this PIN to let others start a chat with you.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" className="w-[200px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button onClick={handleProfileSave}>Save Changes</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Password</CardTitle>
              <CardDescription>
                Update your password here. Please choose a strong one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Update Password</Button>
            </CardFooter>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all of your content. This action is not reversible.
              </C           </CardDescription>
            </CardHeader>
            <CardFooter className="border-t bg-destructive/10 px-6 py-4">
              <Button variant="destructive">Delete My Account</Button>
            </CardFooter>
          </Card>

        </div>
      </main>
    </div>
  );
}

    