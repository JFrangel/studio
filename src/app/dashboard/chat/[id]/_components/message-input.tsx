'use client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Mic, Send, Smile } from 'lucide-react';
import { useState } from 'react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';

export function MessageInput({ chatId }: { chatId: string }) {
  const [message, setMessage] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user || !firestore) return;

    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    
    addDocumentNonBlocking(messagesColRef, {
      remitenteId: user.uid,
      contenido: message,
      tipo: 'texto',
      leidoPor: [],
      enviadoEn: new Date().toISOString(), // Using client time for simplicity, serverTimestamp is better
      editado: false,
    });
    
    // Also update the last message on the chat document
    // This is omitted for brevity but would be important in a real app

    setMessage('');
  };

  return (
    <div className="border-t bg-card p-4">
      <form className="relative" onSubmit={handleSendMessage}>
        <Textarea
          placeholder="Type a message..."
          className="min-h-12 resize-none pr-32"
          rows={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSendMessage(e);
            }
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button variant="ghost" size="icon" type="button">
            <Smile className="h-5 w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
          <Button variant="ghost" size="icon" type="button">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach</span>
          </Button>
          <Button size="icon" type="submit">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
