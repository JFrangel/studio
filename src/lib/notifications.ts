import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface NotificationPayload {
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  chatName?: string;
  isGroup: boolean;
}

/**
 * Envía notificaciones push a los participantes de un chat
 * Esta función debe ser llamada desde el cliente cuando se envía un mensaje
 */
export async function sendMessageNotification(
  firestore: Firestore,
  payload: NotificationPayload
) {
  try {
    // Obtener el chat para ver los participantes
    const chatRef = doc(firestore, 'chats', payload.chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      console.error('Chat no encontrado');
      return;
    }

    const chatData = chatSnap.data();
    const participantIds: string[] = chatData.participantIds || [];

    // Filtrar para excluir al remitente
    const recipientIds = participantIds.filter(id => id !== payload.senderId);

    if (recipientIds.length === 0) {
      return; // No hay destinatarios
    }

    // Obtener los tokens FCM de los destinatarios
    const usersRef = collection(firestore, 'users');
    const tokens: string[] = [];

    for (const userId of recipientIds) {
      const userRef = doc(usersRef, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
        }
      }
    }

    if (tokens.length === 0) {
      console.log('No hay tokens FCM para enviar notificaciones');
      return;
    }

    // Preparar el título y cuerpo de la notificación
    const title = payload.isGroup 
      ? `${payload.senderName} en ${payload.chatName || 'grupo'}`
      : payload.senderName;
    
    const body = payload.message.length > 100 
      ? payload.message.substring(0, 100) + '...'
      : payload.message;

    // Aquí deberías llamar a tu Cloud Function o API para enviar las notificaciones
    // Por ahora, solo logueamos la información
    console.log('Preparando notificación:', {
      title,
      body,
      tokens,
      data: {
        chatId: payload.chatId,
        url: `/dashboard/chat/${payload.chatId}`
      }
    });

    // En producción, llamarías a tu Cloud Function:
    // await fetch('/api/send-notification', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     tokens,
    //     notification: { title, body },
    //     data: {
    //       chatId: payload.chatId,
    //       url: `/dashboard/chat/${payload.chatId}`
    //     }
    //   })
    // });

  } catch (error) {
    console.error('Error al enviar notificación:', error);
  }
}
