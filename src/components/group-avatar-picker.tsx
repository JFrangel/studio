'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GROUP_AVATAR_CATEGORIES, getAvatarUrl, type GroupAvatarStyle } from '@/lib/avatars';
import { Check } from 'lucide-react';

interface GroupAvatarPickerProps {
  onSelect: (avatarSeed: string) => void;
  currentSeed?: string;
}

export function GroupAvatarPicker({ onSelect, currentSeed }: GroupAvatarPickerProps) {
  const [selectedSeed, setSelectedSeed] = useState<string | null>(currentSeed || null);

  const handleSelect = (style: GroupAvatarStyle, previewIndex: number) => {
    const seed = `${style}-preview-${previewIndex}`;
    setSelectedSeed(seed);
    onSelect(seed);
  };

  const getCategoryEntries = () => {
    return Object.entries(GROUP_AVATAR_CATEGORIES) as [keyof typeof GROUP_AVATAR_CATEGORIES, typeof GROUP_AVATAR_CATEGORIES[keyof typeof GROUP_AVATAR_CATEGORIES]][];
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Selecciona un avatar para el grupo</h3>
        <p className="text-xs text-muted-foreground">
          Elige un estilo y diseño que represente tu grupo
        </p>
      </div>

      <Tabs defaultValue="teams" className="w-full">
        <ScrollArea className="w-full pb-2">
          <TabsList className="inline-flex w-max min-w-full md:min-w-0">
            {getCategoryEntries().map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="gap-1 md:gap-2 text-xs md:text-sm px-2 md:px-3">
                <span>{category.icon}</span>
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {getCategoryEntries().map(([categoryKey, category]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
            <p className="text-xs text-muted-foreground">{category.description}</p>
            
            {category.styles.map((style) => (
              <div key={style} className="space-y-2">
                <h4 className="text-sm font-medium capitalize">
                  {style.replace(/-/g, ' ')}
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Array.from({ length: 12 }).map((_, index) => {
                    const seed = `${style}-preview-${index}`;
                    const isSelected = selectedSeed === seed;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelect(style, index)}
                        className={`relative p-1 sm:p-2 rounded-lg border-2 transition-all hover:border-primary ${
                          isSelected ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <Avatar className="w-full h-full aspect-square">
                          <AvatarImage 
                            src={getAvatarUrl(seed, style)} 
                            alt={`${style} ${index}`}
                          />
                          <AvatarFallback>{index + 1}</AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-primary text-primary-foreground rounded-full p-0.5 sm:p-1">
                            <Check className="h-2 w-2 sm:h-3 sm:w-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
