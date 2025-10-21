export type User = {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario' | 'moderador';
  foto: string;
  ultimoLogin: string;
  estado: 'activo' | 'inactivo' | 'ocupado' | 'ausente';
};

export type Chat = {
  id: string;
  nombre?: string;
  tipo: 'privado' | 'grupal';
  participantes: string[];
  creadoEn: string;
  ultimoMensaje: string;
  ultimoMensajeTimestamp: string;
  creadoPor: string;
};

export type Message = {
  id: string;
  remitenteId: string;
  contenido: string;
  tipo: 'texto' | 'imagen';
  leidoPor: string[];
  enviadoEn: string;
  editado: boolean;
};
