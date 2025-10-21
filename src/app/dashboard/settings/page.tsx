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
import { currentUser } from '@/lib/data';
import { Camera } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <div className="flex h-screen flex-col">
      <MainHeader title="Settings" />
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Profile</CardTitle>
              <CardDescription>
                This is your public display name and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <UserAvatar user={currentUser} className="h-20 w-20" />
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
                  <Input id="name" defaultValue={currentUser.nombre} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={currentUser.estado}>
                  <SelectTrigger id="status" className="w-[200px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Active</SelectItem>
                    <SelectItem value="ausente">Away</SelectItem>
                    <SelectItem value="ocupado">Busy</SelectItem>
                    <SelectItem value="inactivo">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button>Save</Button>
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
              </CardDescription>
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
