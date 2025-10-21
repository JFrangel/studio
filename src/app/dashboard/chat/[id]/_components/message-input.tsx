import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Mic, Send, Smile } from 'lucide-react';

export function MessageInput() {
  return (
    <div className="border-t bg-card p-4">
      <form className="relative">
        <Textarea
          placeholder="Type a message..."
          className="min-h-12 resize-none pr-32"
          rows={1}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Smile className="h-5 w-5" />
            <span className="sr-only">Emoji</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach</span>
          </Button>
          <Button size="icon">
            <Send className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
