'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, ArrowLeft, Users } from 'lucide-react';

export default function LeftGroupPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [groupName, setGroupName] = useState<string>('');

  useEffect(() => {
    // Intentar obtener el nombre del grupo del localStorage
    const savedGroupName = localStorage.getItem(`left-group-${groupId}`);
    if (savedGroupName) {
      setGroupName(savedGroupName);
      // Limpiar después de obtenerlo
      localStorage.removeItem(`left-group-${groupId}`);
    }
  }, [groupId]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
            <LogOut className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Has abandonado el grupo</CardTitle>
          <CardDescription className="text-base">
            Ya no formas parte de este grupo
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Información del grupo */}
          {groupName && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl shrink-0">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Grupo</p>
                  <p className="text-base font-semibold truncate">{groupName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje informativo */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Has salido exitosamente del grupo. Ya no podrás:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Ver los mensajes del grupo</li>
              <li>Participar en conversaciones</li>
              <li>Acceder a los archivos compartidos</li>
            </ul>
          </div>

          {/* Opciones de reingreso */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              💡 <strong>¿Quieres volver?</strong> Puedes reingresar si el grupo es público 
              o si un administrador te invita nuevamente.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleBackToDashboard}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
