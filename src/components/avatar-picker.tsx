'use client';

import { useState } from 'react';
import { 
  AVATAR_CATEGORIES, 
  getAvatarUrl, 
  type AvatarStyle 
} from '@/lib/avatars';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Sparkles } from 'lucide-react';

interface AvatarPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSeed: string;
  onSelect: (seed: string, style: AvatarStyle) => void;
}

export function AvatarPicker({ open, onOpenChange, currentSeed, onSelect }: AvatarPickerProps) {
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle | null>(null);
  const [previewSeeds] = useState(() => {
    // Generar 12 seeds aleatorios para previsualización
    return Array.from({ length: 12 }, (_, i) => `preview-${Date.now()}-${i}`);
  });

  const handleSelectAvatar = (seed: string, style: AvatarStyle) => {
    setSelectedStyle(style);
    onSelect(`${style}-${seed}`, style);
  };

  const currentStyleAndSeed = currentSeed.split('-');
  const currentStyle = currentStyleAndSeed[0] as AvatarStyle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Elige tu Avatar Animado
          </DialogTitle>
          <DialogDescription>
            Selecciona un estilo y avatar que te represente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="female" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {Object.entries(AVATAR_CATEGORIES).map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                <span className="mr-1">{category.icon}</span>
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(AVATAR_CATEGORIES).map(([categoryKey, category]) => (
            <TabsContent key={categoryKey} value={categoryKey} className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {category.styles.map((style) => (
                  <div key={style} className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 capitalize">
                      {style.replace(/-/g, ' ')}
                    </h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {previewSeeds.map((seed) => {
                        const fullSeed = `${style}-${seed}`;
                        const isSelected = currentSeed === fullSeed;
                        
                        return (
                          <button
                            key={seed}
                            onClick={() => handleSelectAvatar(seed, style)}
                            className={`
                              relative aspect-square rounded-lg overflow-hidden 
                              border-2 transition-all hover:scale-105
                              ${isSelected 
                                ? 'border-primary ring-2 ring-primary ring-offset-2' 
                                : 'border-border hover:border-primary/50'
                              }
                            `}
                          >
                            <img
                              src={getAvatarUrl(seed, style)}
                              alt={`Avatar ${style}`}
                              className="w-full h-full object-cover bg-muted"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="h-4 w-4" />
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Los avatares son generados por DiceBear
          </p>
          <div className="flex gap-2">
            <Button onClick={() => onOpenChange(false)} className="border">
              Cancelar
            </Button>
            <Button 
              onClick={() => onOpenChange(false)}
              disabled={!selectedStyle}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
