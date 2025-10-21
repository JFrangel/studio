'use client';

import { useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useFirebaseApp } from '@/firebase';

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error: Error | null;
  downloadURL: string | null;
}

export function useUploadFile() {
  const app = useFirebaseApp();
  const [uploadState, setUploadState] = useState<UploadProgress>({
    progress: 0,
    isUploading: false,
    error: null,
    downloadURL: null,
  });

  const uploadFile = async (
    file: File,
    path: string,
    onComplete?: (downloadURL: string) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploadState({
        progress: 0,
        isUploading: true,
        error: null,
        downloadURL: null,
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadState((prev) => ({ ...prev, progress }));
        },
        (error) => {
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error,
          }));
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadState({
              progress: 100,
              isUploading: false,
              error: null,
              downloadURL,
            });
            onComplete?.(downloadURL);
            resolve(downloadURL);
          } catch (error) {
            const err = error as Error;
            setUploadState((prev) => ({
              ...prev,
              isUploading: false,
              error: err,
            }));
            reject(err);
          }
        }
      );
    });
  };

  const resetUploadState = () => {
    setUploadState({
      progress: 0,
      isUploading: false,
      error: null,
      downloadURL: null,
    });
  };

  return {
    uploadFile,
    uploadState,
    resetUploadState,
  };
}
