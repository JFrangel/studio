'use client';
import Link from 'next/link';
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
import { Logo } from '@/components/logo';
import { useState, useEffect } from 'react';
import { useAuth, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking, useUser } from '@/firebase';
import { initiateEmailSignUp } from '@/firebase/non-blocking-login';
import { useRouter } from 'next/navigation';
import { doc, collection } from 'firebase/firestore';

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const handleRegister = async () => {
    if(!auth) return;
    // Initiate sign up, but don't wait for it to complete.
    // The onAuthStateChanged listener will handle the result.
    initiateEmailSignUp(auth, email, password);
    // Don't redirect here. Let the useEffect handle it.
  };

  useEffect(() => {
    if (user && firestore && name) {
      // User is signed in, create their profile document
      const userDocRef = doc(firestore, 'users', user.uid);
      const userPin = generatePin();
      
      setDocumentNonBlocking(userDocRef, {
        id: user.uid,
        name: name,
        email: user.email,
        pin: userPin,
        role: 'user',
        photo: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
        lastLogin: new Date().toISOString(),
        status: 'active',
      }, { merge: true }); 

      // Create a personal chat for the user
      const chatsColRef = collection(firestore, 'chats');
      addDocumentNonBlocking(chatsColRef, {
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        participantIds: [user.uid],
        type: 'private',
        name: 'My Notes'
      });
      
      router.push('/dashboard');
    }
  }, [user, firestore, name, router]);


  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="space-y-1 text-center">
             <div className="flex justify-center mb-4">
               <Logo />
            </div>
            <CardTitle className="font-headline text-2xl">Create an account</CardTitle>
            <CardDescription>Enter your details below to create your account</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="Jose Frangel" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
             <Button className="w-full" onClick={handleRegister}>
              Create Account
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="underline hover:text-primary">
                Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
