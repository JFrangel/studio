'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Mic, Send, Smile, Image as ImageIcon, FileText, X, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, useUploadFile } from '@/firebase';
import { collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { sendMessageNotification } from '@/lib/notifications';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

// Lista de emojis comunes
const EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '😶‍🌫️', '🥴', '😵', '🤯', '🤠', '🥳', '😎',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
  '👐', '🤲', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
];

export function MessageInput({ chatId }: { chatId: string }) {
  const [message, setMessage] = useState('');
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'file'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const { uploadFile, uploadState, resetUploadState } = useUploadFile();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !firestore) return;

    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    const now = new Date().toISOString();
    
    addDocumentNonBlocking(messagesColRef, {
      senderId: user.uid,
      content: message,
      type: 'text',
      readBy: [],
      sentAt: now,
      edited: false,
    });
    
    const chatDocRef = doc(firestore, 'chats', chatId);
    setDocumentNonBlocking(chatDocRef, {
        lastMessage: message,
        lastMessageAt: now,
        lastMessageSender: user.uid,
    }, { merge: true });

    // Enviar notificación push
    try {
      const chatSnap = await getDoc(chatDocRef);
      if (chatSnap.exists()) {
        const chatData = chatSnap.data();
        await sendMessageNotification(firestore, {
          chatId,
          senderId: user.uid,
          senderName: user.displayName || user.email || 'Usuario',
          message: message,
          chatName: chatData.name,
          isGroup: chatData.type === 'group',
        });
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }

    setMessage('');
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setIsEmojiOpen(false);
  };

  const handleFileSelect = (type: 'image' | 'file') => {
    setFileType(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : '*/*';
      fileInputRef.current.click();
    }
    setIsAttachDialogOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !firestore) return;

    try {
      // Crear path único para el archivo
      const timestamp = Date.now();
      const fileName = `${user.uid}_${timestamp}_${file.name}`;
      const storagePath = `chats/${chatId}/${fileType}s/${fileName}`;

      // Subir archivo a Firebase Storage
      const downloadURL = await uploadFile(file, storagePath);

      // Crear mensaje con la URL del archivo
      const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
      const now = new Date().toISOString();
      
      const messageData: any = {
        senderId: user.uid,
        content: fileType === 'image' ? 'Sent an image' : file.name,
        type: fileType,
        readBy: [],
        sentAt: now,
        edited: false,
      };

      if (fileType === 'image') {
        messageData.imageUrl = downloadURL;
      } else {
        messageData.fileUrl = downloadURL;
        messageData.fileName = file.name;
        messageData.fileSize = file.size;
      }

      addDocumentNonBlocking(messagesColRef, messageData);
      
      // Actualizar último mensaje del chat
      const chatDocRef = doc(firestore, 'chats', chatId);
      setDocumentNonBlocking(chatDocRef, {
          lastMessage: fileType === 'image' ? '📷 Image' : `📎 ${file.name}`,
          lastMessageAt: now,
          lastMessageSender: user.uid,
      }, { merge: true });

      // Reset estado de subida
      resetUploadState();
      
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file: ' + (error as Error).message);
      resetUploadState();
    }
  };

  return (
    <div className="border-t bg-card p-4">
      {uploadState.isUploading && (
        <div className="mb-3 p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">
              Uploading {fileType === 'image' ? 'image' : 'file'}...
            </span>
          </div>
          <Progress value={uploadState.progress} className="h-2" />
          <span className="text-xs text-muted-foreground mt-1 block">
            {Math.round(uploadState.progress)}%
          </span>
        </div>
      )}
      <form className="relative" onSubmit={handleSendMessage}>
        <Textarea
          placeholder="Type a message..."
          className="min-h-12 resize-none pr-32"
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground"
              >
                <Smile className="h-5 w-5" />
                <span className="sr-only">Emoji</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2" align="end" side="top">
              <div className="grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
                {EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-2xl hover:bg-accent rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Dialog open={isAttachDialogOpen} onOpenChange={setIsAttachDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md h-10 w-10 hover:bg-accent hover:text-accent-foreground"
              >
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach</span>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Attach File</DialogTitle>
                <DialogDescription>
                  Choose the type of file you want to send
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <button
                  onClick={() => handleFileSelect('image')}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-primary hover:bg-accent transition-colors"
                >
                  <ImageIcon className="h-8 w-8" />
                  <span className="text-sm font-medium">Image</span>
                </button>
                <button
                  onClick={() => handleFileSelect('file')}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-primary hover:bg-accent transition-colors"
                >
                  <FileText className="h-8 w-8" />
                  <span className="text-sm font-medium">Document</span>
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="submit"
            disabled={!message.trim()}
            className="inline-flex items-center justify-center rounded-md h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
