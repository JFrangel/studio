'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

export function usePushNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [messaging, setMessaging] = useState<Messaging | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined' || !user || !firestore) return;

    const initializeMessaging = async () => {
      try {
        // Verificar si el navegador soporta notificaciones
        if (!('Notification' in window)) {
          console.log('Este navegador no soporta notificaciones');
          return;
        }

        // Verificar si ya tenemos permiso
        if (Notification.permission === 'granted') {
          await setupMessaging();
        } else if (Notification.permission !== 'denied') {
          // Solicitar permiso si aún no lo hemos hecho
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            await setupMessaging();
          }
        }
      } catch (error) {
        console.error('Error al inicializar notificaciones:', error);
      }
    };

    const setupMessaging = async () => {
      try {
        // Registrar el service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registrado:', registration);
        }

        // Inicializar Firebase Messaging
        const firebaseModule = await import('firebase/app');
        const firebaseConfig = {
          projectId: "studio-2423527268-b13e6",
          appId: "1:1077436105805:web:6faadcbbf0d311332ac804",
          apiKey: "AIzaSyCEfPTKTL9SbO0Nj997ist84OkZPww2_Y4",
          authDomain: "studio-2423527268-b13e6.firebaseapp.com",
          messagingSenderId: "1077436105805",
          storageBucket: "studio-2423527268-b13e6.firebasestorage.app"
        };
        
        // @ts-ignore - Importación dinámica de Firebase
        const app = firebaseModule.default.initializeApp(firebaseConfig, `messaging-app-${Date.now()}`);
        const messagingInstance = getMessaging(app);
        setMessaging(messagingInstance);

        // Obtener el token de FCM
        const currentToken = await getToken(messagingInstance, {
          vapidKey: 'BKagOny0KF_2pCJQ3m....TpavVYm4g' // Reemplazar con tu clave VAPID real
        });

        if (currentToken) {
          console.log('Token FCM obtenido:', currentToken);
          setToken(currentToken);

          // Guardar el token en Firestore
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmToken: currentToken,
            fcmTokenUpdatedAt: new Date().toISOString()
          });
        } else {
          console.log('No se pudo obtener el token de FCM');
        }

        // Manejar mensajes en primer plano
        onMessage(messagingInstance, (payload) => {
          console.log('Mensaje recibido en primer plano:', payload);
          
          const title = payload.notification?.title || 'Nuevo Mensaje';
          const body = payload.notification?.body || '';
          const chatId = payload.data?.chatId;

          // Mostrar toast con el mensaje
          toast({
            title,
            description: body,
          });

          // Mostrar notificación del navegador si está en segundo plano
          if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
              body,
              icon: '/icon-192x192.png',
              tag: chatId || 'default'
            });

            notification.onclick = () => {
              window.focus();
              if (chatId) {
                router.push(`/dashboard/chat/${chatId}`);
              }
              notification.close();
            };
          }
        });
      } catch (error) {
        console.error('Error al configurar messaging:', error);
      }
    };

    initializeMessaging();
  }, [user, firestore, toast, router]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error al solicitar permiso:', error);
      return false;
    }
  };

  return {
    messaging,
    token,
    requestPermission,
    hasPermission: typeof window !== 'undefined' && 
                   'Notification' in window && 
                   Notification.permission === 'granted'
  };
}
