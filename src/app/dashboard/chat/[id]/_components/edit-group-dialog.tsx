'use client';

import { useState, useEffect } from 'react';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Chat } from '@/lib/types';

const DEFAULT_GROUP_IMAGES = [
  '👥', '🎉', '💼', '🏠', '🎮', '📚', '🎨', '🏋️', 
  '🍕', '🎵', '⚽', '🌟', '💡', '🚀', '🎯', '🌈'
];

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: (Chat & { id: string }) | null;
}

export function EditGroupDialog({ open, onOpenChange, chat }: EditGroupDialogProps) {
  const firestore = useFirestore();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(DEFAULT_GROUP_IMAGES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when dialog opens or chat changes
  useEffect(() => {
    if (chat && open) {
      setGroupName(chat.name || '');
      setDescription(chat.description || '');
      setSelectedImage(chat.groupImage || DEFAULT_GROUP_IMAGES[0]);
      setError('');
    }
  }, [chat, open]);

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (!chat || !firestore) return;

    setIsSaving(true);
    setError('');

    try {
      const chatRef = doc(firestore, 'chats', chat.id);
      setDocumentNonBlocking(chatRef, {
        name: groupName,
        description: description || undefined,
        groupImage: selectedImage,
      }, { merge: true });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating group:', error);
      setError('Error updating group');
    } finally {
      setIsSaving(false);
    }
  };

  if (!chat) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update group name, description, and image
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Group Image Selection */}
          <div>
            <Label>Group Image</Label>
            <div className="grid grid-cols-8 gap-2 mt-2">
              {DEFAULT_GROUP_IMAGES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedImage(emoji)}
                  className={`text-3xl p-2 rounded-lg hover:bg-accent transition-colors ${
                    selectedImage === emoji ? 'bg-accent ring-2 ring-primary' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Group Name */}
          <div>
            <Label htmlFor="edit-group-name">Group Name *</Label>
            <Input
              id="edit-group-name"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={50}
            />
          </div>

          {/* Group Description */}
          <div>
            <Label htmlFor="edit-group-description">Description</Label>
            <Textarea
              id="edit-group-description"
              placeholder="What's this group about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 hover:bg-accent"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSave}
            disabled={isSaving || !groupName.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
