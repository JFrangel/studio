'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserAvatar } from '@/components/user-avatar';
import { useUser, useFirestore, setDocumentNonBlocking, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { Camera, Copy, LogOut, ArrowLeft, Search, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AvatarPicker } from '@/components/avatar-picker';
import { generateAvatarSeed, getDefaultAvatarStyle, type AvatarStyle } from '@/lib/avatars';
import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useSidebar } from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { setOpenMobile, isMobile } = useSidebar();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !authUser) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [searchable, setSearchable] = useState(true);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setDescription(userProfile.description || '');
      setStatus(userProfile.status || 'active');
      setSearchable(userProfile.searchable !== false); // Por defecto true
    }
  }, [userProfile]);

  const handleProfileSave = () => {
    if (!userDocRef) return;
    setDocumentNonBlocking(userDocRef, {
      name: name,
      description: description,
      status: status,
      searchable: searchable,
    }, { merge: true });
    toast({ title: "Profile saved!", description: "Your changes have been updated." });
  };
  
  const handleAvatarSelect = (seed: string, style: AvatarStyle) => {
    if (!userDocRef) return;
    setDocumentNonBlocking(userDocRef, {
      avatarStyle: 'avatar',
      avatarSeed: seed,
    }, { merge: true });
    toast({ 
      title: "Avatar actualizado!", 
      description: "Tu nuevo avatar se ha guardado correctamente." 
    });
  };
  
  const handleUseGooglePhoto = () => {
    if (!userDocRef || !authUser?.photoURL) return;
    setDocumentNonBlocking(userDocRef, {
      avatarStyle: 'photo',
      photo: authUser.photoURL,
    }, { merge: true });
    toast({ 
      title: "Foto actualizada!", 
      description: "Ahora usas tu foto de Google." 
    });
  };
  
  const handleCopyPin = () => {
    if(userProfile?.pin) {
      navigator.clipboard.writeText(userProfile.pin);
      toast({ title: "PIN Copied!", description: "You can now share your PIN with others." });
    }
  }

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading || !userProfile || !authUser) {
    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="mx-auto grid max-w-3xl gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Public Profile</CardTitle>
                <CardDescription>
                  This is your public display name, avatar, and PIN.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="grid flex-1 gap-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                 </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-48" />
                 </div>
              </CardContent>
               <CardFooter className="border-t px-6 py-4">
                <Button disabled>Save Changes</Button>
              </CardFooter>
            </Card>
          </div>
        </main>
    )
  }

  const handleBackToDashboard = () => {
    if (isMobile) {
      // En móvil, abrir el sidebar en lugar de navegar
      setOpenMobile(true);
    }
    router.push('/dashboard');
  };

  return (
      <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
        <div className="mx-auto grid max-w-3xl gap-4 sm:gap-6">
          <Button
            onClick={handleBackToDashboard}
            className="mb-2 sm:mb-4 w-full sm:w-auto border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="font-headline text-lg sm:text-xl">Public Profile</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                This is your public display name, avatar, and PIN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Avatar Section */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <div className="relative mx-auto sm:mx-0">
                    <UserAvatar user={userProfile} className="h-16 w-16 sm:h-20 sm:w-20" />
                  </div>
                  <div className="flex-1 space-y-2 w-full">
                    <Label className="text-sm sm:text-base">Avatar</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Elige un avatar animado o usa tu foto de Google
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                      <Button
                        onClick={() => setIsAvatarPickerOpen(true)}
                        className="border w-full sm:w-auto text-xs sm:text-sm"
                      >
                        <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Elegir Avatar Animado</span>
                        <span className="sm:hidden">Avatar Animado</span>
                      </Button>
                      {authUser?.photoURL && (
                        <Button
                          onClick={handleUseGooglePhoto}
                          className="border w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Camera className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Usar Foto de Google</span>
                          <span className="sm:hidden">Foto Google</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name Section */}
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Full Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Description Section */}
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  disabled={isLoading}
                  placeholder="Tell others about yourself..."
                  className="text-sm sm:text-base min-h-[80px] resize-none"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {description.length}/200 characters
                </p>
              </div>

               <div className="grid gap-2">
                  <Label htmlFor="pin" className="text-sm sm:text-base">Your User PIN</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="pin" 
                      value={userProfile.pin} 
                      readOnly 
                      className="font-mono text-sm sm:text-lg tracking-widest" 
                    />
                    <Button onClick={handleCopyPin} className="border shrink-0 h-9 w-9 sm:h-10 sm:w-10 p-0">
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="sr-only">Copy PIN</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this PIN to let others start a chat with you.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-sm sm:text-base">Status</Label>
                <Select value={status} onValueChange={setStatus} disabled={isLoading}>
                  <SelectTrigger id="status" className="w-full sm:w-[200px] text-sm sm:text-base">
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
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <Label htmlFor="searchable" className="text-sm sm:text-base">Aparecer en búsquedas</Label>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Permite que otros usuarios puedan encontrarte en el buscador
                    </p>
                  </div>
                  <Switch
                    id="searchable"
                    checked={searchable}
                    onCheckedChange={setSearchable}
                    disabled={isLoading}
                    className="shrink-0"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-4 sm:px-6 py-3 sm:py-4">
              <Button 
                onClick={handleProfileSave} 
                disabled={isLoading}
                className="w-full sm:w-auto text-sm sm:text-base"
              >
                Save Changes
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="font-headline text-lg sm:text-xl">Password</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Update your password here. Please choose a strong one.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
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
              <CardTitle className="font-headline">Session</CardTitle>
              <CardDescription>
                Log out of your account on this device.
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </CardFooter>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle className="font-headline">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all of your content. This action is not reversible.
              </CardDescription>
            </CardHeader>
            <CardFooter className="border-t bg-destructive/10 px-6 py-4">
              <Button variant="destructive">Delete My Account</Button>
            </CardFooter>
          </Card>

        </div>

        {/* Avatar Picker Dialog */}
        <AvatarPicker
          open={isAvatarPickerOpen}
          onOpenChange={setIsAvatarPickerOpen}
          currentSeed={userProfile?.avatarSeed || generateAvatarSeed(userProfile?.id || '')}
          onSelect={handleAvatarSelect}
        />
      </main>
  );
}
