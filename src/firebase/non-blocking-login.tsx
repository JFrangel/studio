'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
} from 'firebase/firestore';

type AuthCallback = (error: any) => void;

function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function setupNewUser(
  firestore: Firestore,
  user: User,
  customName?: string
) {
  const userDocRef = doc(firestore, 'users', user.uid);
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    // New user, create profile document
    const userPin = generatePin();
    await setDoc(userDocRef, {
      id: user.uid,
      name: customName || user.displayName, // Use provided name or Google display name
      email: user.email,
      pin: userPin,
      role: 'user',
      photo: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
      lastLogin: new Date().toISOString(),
      status: 'active',
    });

    // Create a personal chat for the user
    const chatsColRef = collection(firestore, 'chats');
    await addDoc(chatsColRef, {
      createdAt: new Date().toISOString(),
      createdBy: user.uid,
      participantIds: [user.uid],
      type: 'private',
      name: 'My Notes',
    });
  } else {
    // Existing user, just update last login
    await setDoc(
      userDocRef,
      { lastLogin: new Date().toISOString(), status: 'active' },
      { merge: true }
    );
  }
}

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(
  authInstance: Auth,
  callback?: AuthCallback
): void {
  signInAnonymously(authInstance).catch((error) => {
    callback?.(error);
  });
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  firestore: Firestore,
  email: string,
  password: string,
  name: string,
  callback?: AuthCallback
): void {
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((credential) => setupNewUser(firestore, credential.user, name))
    .catch((error) => {
      callback?.(error);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(
  authInstance: Auth,
  email: string,
  password: string,
  callback?: AuthCallback
): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    callback?.(error);
  });
}

/** Initiate Google Sign-In (non-blocking). */
export function initiateGoogleSignIn(
  authInstance: Auth,
  firestore: Firestore,
  callback?: AuthCallback
): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider)
    .then((credential) => setupNewUser(firestore, credential.user))
    .catch((error) => {
      callback?.(error);
    });
}
