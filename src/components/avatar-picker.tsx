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
  const [selectedSeed, setSelectedSeed] = useState<string>(currentSeed);
  const [previewSeeds] = useState(() => {
    // Generar 12 seeds aleatorios para previsualización
    return Array.from({ length: 12 }, (_, i) => `preview-${Date.now()}-${i}`);
  });

  const handleSelectAvatar = (seed: string, style: AvatarStyle) => {
    const fullSeed = `${style}-${seed}`;
    setSelectedSeed(fullSeed);
    onSelect(fullSeed, style);
  };

  const currentStyleAndSeed = currentSeed.split('-');
  const currentStyle = currentStyleAndSeed[0] as AvatarStyle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Elige tu Avatar Animado
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Selecciona un estilo y avatar que te represente
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="female" className="w-full">
          <ScrollArea className="w-full pb-2">
            <TabsList className="inline-flex w-max min-w-full">
              {Object.entries(AVATAR_CATEGORIES).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-xs px-2 sm:px-3">
                  <span className="mr-1">{category.icon}</span>
                  <span className="hidden sm:inline">{category.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {Object.entries(AVATAR_CATEGORIES).map(([categoryKey, category]) => (
            <TabsContent key={categoryKey} value={categoryKey} className="mt-4">
              <ScrollArea className="h-[50vh] sm:h-[400px] pr-2 sm:pr-4">
                {category.styles.map((style) => (
                  <div key={style} className="mb-4 sm:mb-6">
                    <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 capitalize">
                      {style.replace(/-/g, ' ')}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                      {previewSeeds.map((seed) => {
                        const fullSeed = `${style}-${seed}`;
                        const isSelected = selectedSeed === fullSeed;
                        
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
                                <div className="bg-primary text-primary-foreground rounded-full p-0.5 sm:p-1">
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Avatares generados por DiceBear
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => onOpenChange(false)} className="border flex-1 sm:flex-initial text-sm">
              Cancelar
            </Button>
            <Button 
              onClick={() => onOpenChange(false)}
              disabled={!selectedSeed}
              className="flex-1 sm:flex-initial text-sm"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
