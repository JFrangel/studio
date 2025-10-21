import type { User, Chat, Message } from './types';

export const users: User[] = [
  {
    id: "u1",
    nombre: "Jose Frangel",
    email: "jose@example.com",
    rol: "admin",
    foto: "https://picsum.photos/seed/user1/200/200",
    ultimoLogin: "2025-10-20T15:45:00Z",
    estado: "activo"
  },
  {
    id: "u2",
    nombre: "Ana Lopez",
    email: "ana@example.com",
    rol: "usuario",
    foto: "https://picsum.photos/seed/user2/200/200",
    ultimoLogin: "2025-10-21T10:00:00Z",
    estado: "activo"
  },
  {
    id: "u3",
    nombre: "Carlos Ruiz",
    email: "carlos@example.com",
    rol: "usuario",
    foto: "https://picsum.photos/seed/user3/200/200",
    ultimoLogin: "2025-10-21T11:30:00Z",
    estado: "ausente"
  },
  {
    id: "u4",
    nombre: "Maria Garcia",
    email: "maria@example.com",
    rol: "moderador",
    foto: "https://picsum.photos/seed/user4/200/200",
    ultimoLogin: "2025-10-21T09:15:00Z",
    estado: "activo"
  },
  {
    id: "u5",
    nombre: "Pedro Martinez",
    email: "pedro@example.com",
    rol: "usuario",
    foto: "https://picsum.photos/seed/user5/200/200",
    ultimoLogin: "2025-10-19T18:00:00Z",
    estado: "inactivo"
  },
  {
    id: "u6",
    nombre: "Sofia Hernandez",
    email: "sofia@example.com",
    rol: "usuario",
    foto: "https://picsum.photos/seed/user6/200/200",
    ultimoLogin: "2025-10-21T11:45:00Z",
    estado: "ocupado"
  }
];

export const chats: Chat[] = [
  {
    id: "chat_1",
    nombre: "Equipo Inventrack",
    tipo: "grupal",
    participantes: ["u1", "u2", "u3", "u4"],
    creadoEn: "2025-10-20T14:00:00Z",
    ultimoMensaje: "Perfecto, quedo atento.",
    ultimoMensajeTimestamp: "2025-10-21T11:45:00Z",
    creadoPor: "u1"
  },
  {
    id: "chat_2",
    tipo: "privado",
    participantes: ["u1", "u2"],
    creadoEn: "2025-10-19T10:00:00Z",
    ultimoMensaje: "Sí, ya lo revisé. Todo en orden.",
    ultimoMensajeTimestamp: "2025-10-20T18:30:00Z",
    creadoPor: "u2"
  },
  {
    id: "chat_3",
    nombre: "Proyecto Q4",
    tipo: "grupal",
    participantes: ["u1", "u4", "u6"],
    creadoEn: "2025-10-18T09:00:00Z",
    ultimoMensaje: "Mañana tenemos la reunión de seguimiento.",
    ultimoMensajeTimestamp: "2025-10-20T15:00:00Z",
    creadoPor: "u4"
  },
  {
    id: "chat_4",
    tipo: "privado",
    participantes: ["u1", "u3"],
    creadoEn: "2025-10-21T12:00:00Z",
    ultimoMensaje: "Hola Carlos, ¿cómo vas?",
    ultimoMensajeTimestamp: "2025-10-21T12:00:00Z",
    creadoPor: "u1"
  }
];

export const messages: { [key: string]: Message[] } = {
  "chat_1": [
    { id: "msg_001", remitenteId: "u1", contenido: "Hola equipo 👋, ¿cómo va la revisión del inventario?", tipo: "texto", leidoPor: ["u2", "u3", "u4"], enviadoEn: "2025-10-21T11:05:00Z", editado: false },
    { id: "msg_002", remitenteId: "u2", contenido: "¡Hola Jose! Ya casi termino mi parte. Estimo que en 30 minutos está listo.", tipo: "texto", leidoPor: ["u1", "u3", "u4"], enviadoEn: "2025-10-21T11:10:00Z", editado: false },
    { id: "msg_003", remitenteId: "u4", contenido: "Yo encontré algunas discrepancias en la sección de electrónicos. Lo estoy documentando.", tipo: "texto", leidoPor: ["u1", "u2", "u3"], enviadoEn: "2025-10-21T11:12:00Z", editado: true },
    { id: "msg_004", remitenteId: "u1", contenido: "Gracias por el aviso, Maria. Por favor, adjunta el reporte cuando lo tengas.", tipo: "texto", leidoPor: ["u2", "u3", "u4"], enviadoEn: "2025-10-21T11:15:00Z", editado: false },
    { id: "msg_005", remitenteId: "u3", contenido: "Entendido. Yo estoy disponible por si necesitan ayuda.", tipo: "texto", leidoPor: ["u1", "u2", "u4"], enviadoEn: "2025-10-21T11:20:00Z", editado: false },
    { id: "msg_006", remitenteId: "u2", contenido: "¡Listo! Mi parte ya está actualizada en el sistema.", tipo: "texto", leidoPor: ["u1", "u3", "u4"], enviadoEn: "2025-10-21T11:40:00Z", editado: false },
    { id: "msg_007", remitenteId: "u1", contenido: "Perfecto, quedo atento.", tipo: "texto", leidoPor: ["u2", "u3", "u4"], enviadoEn: "2025-10-21T11:45:00Z", editado: false },
  ],
  "chat_2": [
    { id: "msg_101", remitenteId: "u2", contenido: "Hola Jose, ¿revisaste el documento que te envié?", tipo: "texto", leidoPor: ["u1"], enviadoEn: "2025-10-20T18:25:00Z", editado: false },
    { id: "msg_102", remitenteId: "u1", contenido: "Sí, ya lo revisé. Todo en orden.", tipo: "texto", leidoPor: ["u2"], enviadoEn: "2025-10-20T18:30:00Z", editado: false },
  ],
  "chat_3": [
    { id: "msg_201", remitenteId: "u4", contenido: "Recordatorio equipo: Mañana tenemos la reunión de seguimiento del proyecto Q4 a las 10:00 am.", tipo: "texto", leidoPor: ["u1", "u6"], enviadoEn: "2025-10-20T15:00:00Z", editado: false },
    { id: "msg_202", remitenteId: "u1", contenido: "Confirmado. ¡Allí estaré!", tipo: "texto", leidoPor: ["u4", "u6"], enviadoEn: "2025-10-20T15:02:00Z", editado: false },
    { id: "msg_203", remitenteId: "u6", contenido: "Enterada, gracias.", tipo: "texto", leidoPor: ["u1", "u4"], enviadoEn: "2025-10-20T15:05:00Z", editado: false },
  ],
  "chat_4": [
    { id: "msg_301", remitenteId: "u1", contenido: "Hola Carlos, ¿cómo vas?", tipo: "texto", leidoPor: [], enviadoEn: "2025-10-21T12:00:00Z", editado: false },
  ]
};

export const currentUser: User = users[0];
