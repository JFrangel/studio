# Configuración de Notificaciones Push

Este documento explica cómo configurar completamente las notificaciones push en la aplicación.

## 🚀 Estado Actual

✅ **Implementado:**
- Hook `usePushNotifications` para manejar permisos y tokens FCM
- Service Worker configurado (`firebase-messaging-sw.js`)
- Función helper `sendMessageNotification` para preparar notificaciones
- Integración en el input de mensajes
- Navegación automática al chat al hacer clic en la notificación

⚠️ **Pendiente (Requiere configuración del servidor):**
- Clave VAPID de Firebase
- Cloud Function o API endpoint para enviar notificaciones
- Pruebas en producción con HTTPS

## 📋 Pasos para Completar la Configuración

### 1. Generar Clave VAPID en Firebase

1. Ve a la [Consola de Firebase](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️) > **Cloud Messaging**
4. En la sección **Web Push certificates**, haz clic en **Generate key pair**
5. Copia la clave VAPID generada

### 2. Actualizar la Clave VAPID

Edita el archivo `src/hooks/use-push-notifications.ts` línea 62:

```typescript
const currentToken = await getToken(messagingInstance, {
  vapidKey: 'TU_CLAVE_VAPID_AQUI' // Reemplazar con tu clave real
});
```

### 3. Crear Cloud Function para Enviar Notificaciones

Crea un archivo `functions/src/index.ts` con el siguiente código:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendNotificationOnNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const messageData = snap.data();
    const chatId = context.params.chatId;
    const senderId = messageData.senderId;

    try {
      // Obtener información del chat
      const chatRef = admin.firestore().doc(`chats/${chatId}`);
      const chatSnap = await chatRef.get();
      
      if (!chatSnap.exists) return;
      
      const chatData = chatSnap.data();
      const participantIds = chatData?.participantIds || [];
      
      // Obtener información del remitente
      const senderRef = admin.firestore().doc(`users/${senderId}`);
      const senderSnap = await senderRef.get();
      const senderName = senderSnap.data()?.name || senderSnap.data()?.email || 'Usuario';

      // Filtrar destinatarios (excluir remitente)
      const recipientIds = participantIds.filter((id: string) => id !== senderId);
      
      // Obtener tokens FCM
      const tokens: string[] = [];
      for (const userId of recipientIds) {
        const userRef = admin.firestore().doc(`users/${userId}`);
        const userSnap = await userRef.get();
        const fcmToken = userSnap.data()?.fcmToken;
        if (fcmToken) tokens.push(fcmToken);
      }

      if (tokens.length === 0) return;

      // Preparar notificación
      const isGroup = chatData?.type === 'group';
      const title = isGroup 
        ? `${senderName} en ${chatData?.name || 'grupo'}`
        : senderName;
      
      const body = messageData.content?.length > 100
        ? messageData.content.substring(0, 100) + '...'
        : messageData.content;

      // Enviar notificación
      const payload = {
        notification: {
          title,
          body,
        },
        data: {
          chatId,
          url: `/dashboard/chat/${chatId}`,
        },
      };

      await admin.messaging().sendToDevice(tokens, payload);
      console.log('Notificaciones enviadas exitosamente');
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  });
```

### 4. Desplegar Cloud Functions

```bash
# Instalar Firebase CLI si no lo tienes
npm install -g firebase-tools

# Inicializar Functions
firebase init functions

# Desplegar
firebase deploy --only functions
```

### 5. Configurar Permisos

Asegúrate de que tu proyecto de Firebase tenga habilitado **Cloud Messaging** y que las reglas de seguridad permitan la lectura de usuarios y chats.

## 🧪 Pruebas

### En Desarrollo Local (con limitaciones)

Las notificaciones push requieren HTTPS. Para probar en local:

1. Usa `ngrok` o similar para exponer tu servidor local con HTTPS
2. Actualiza las URLs en tu configuración
3. Prueba con un dispositivo móvil o navegador

### En Producción

1. Despliega en Firebase Hosting o similar (con HTTPS automático)
2. Abre la aplicación en múltiples pestañas/dispositivos
3. Envía un mensaje desde un dispositivo
4. Verifica que llegue la notificación en los otros dispositivos

## 📱 Comportamiento Esperado

### Aplicación en Primer Plano
- Muestra un toast con el mensaje
- Reproduce sonido del navegador (si está habilitado)
- NO muestra notificación del sistema operativo

### Aplicación en Segundo Plano
- El Service Worker intercepta el mensaje
- Muestra notificación del sistema operativo
- Al hacer clic, abre/enfoca la app y navega al chat

### Aplicación Cerrada
- El Service Worker sigue activo (limitado por el navegador)
- Muestra notificación del sistema operativo
- Al hacer clic, abre la app y navega al chat

## 🔧 Solución de Problemas

### No llegan notificaciones

1. **Verifica permisos:**
   ```javascript
   console.log('Permiso de notificaciones:', Notification.permission);
   ```

2. **Verifica token FCM:**
   ```javascript
   // En la consola del navegador
   localStorage.getItem('fcmToken');
   ```

3. **Verifica Service Worker:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => console.log(regs));
   ```

### Errores comunes

- **"messaging/unsupported-browser"**: El navegador no soporta notificaciones
- **"messaging/permission-blocked"**: El usuario bloqueó las notificaciones
- **"messaging/token-unsubscribe-failed"**: Token FCM inválido o expirado

## 📚 Recursos

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## 🎯 Próximos Pasos

1. Implementar preferencias de notificación por usuario
2. Agregar soporte para notificaciones de menciones
3. Implementar sistema de badges para notificaciones no leídas
4. Agregar soporte para rich notifications (con imágenes)
