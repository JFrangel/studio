'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';

type AuthCallback = (error: any) => void;

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
  email: string,
  password: string,
  callback?: AuthCallback
): void {
  createUserWithEmailAndPassword(authInstance, email, password).catch(
    (error) => {
      callback?.(error);
    }
  );
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
  callback?: AuthCallback
): void {
  const provider = new GoogleAuthProvider();
  signInWithPopup(authInstance, provider).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData?.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    callback?.(error);
  });
}
