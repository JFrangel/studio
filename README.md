# 💬 Studio - Real-time Chat Platform

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-10.0-FFCA28?style=for-the-badge&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)

**Una plataforma moderna de chat en tiempo real con características avanzadas de mensajería, gestión de grupos y roles personalizados.**

</div>

---

## ✨ Características Principales

### 💬 **Mensajería en Tiempo Real**
- 💬 Chat privado 1-a-1
- 👥 Grupos con múltiples participantes
- ⚡ Mensajes instantáneos con Firebase Realtime
- 🔴 Indicadores de mensajes no leídos con contador preciso
- 🔍 Búsqueda de mensajes dentro de los chats
- 📝 Notas personales ("My Notes")

### 👥 **Gestión de Grupos**
- ➕ Crear grupos con emoji o avatar personalizado
- 🎭 Sistema de roles: Creador y Co-creadores
- 👤 Añadir/remover miembros
- 🔐 PIN de invitación único para cada grupo
- ⚙️ Gestión de permisos de administración
- 👁️ Ver perfil de miembros desde el grupo

### 🎨 **Personalización**
- 🖼️ Avatares animados con DiceBear (11 estilos diferentes)
- 📸 Foto de perfil de Google
- 🌈 Temas: Claro, Oscuro y **Monocromático único**
- 🏅 Insignias de roles con colores distintivos:
  - 👑 **Admin de Plataforma** (Púrpura)
  - ⭐ **Creador de Grupo** (Dorado con animación)
  - 🛡️ **Co-creador** (Azul)
- ✨ Bordes animados para mensajes de roles especiales

### 🔐 **Seguridad y Privacidad**
- 🔒 Autenticación con Firebase Auth
- 🛡️ Reglas de seguridad de Firestore
- 🔍 Control de visibilidad en búsquedas
- 👮 Sistema de permisos por roles

### 📱 **Diseño Responsive**
- 📱 Optimizado para móviles, tablets y desktop
- 🎯 Sidebar adaptativo
- 📏 Truncado inteligente de texto
- ✂️ Componentes con tamaños responsivos

---

## 📋 Tabla de Contenidos

- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Características Detalladas](#-características-detalladas)
- [Temas](#-temas)
- [Deploy](#-deploy)

---

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+ instalado
- npm o yarn
- Cuenta de Firebase

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/JFrangel/studio.git
cd studio
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
```

4. **Configurar Firestore**

Despliega las reglas de seguridad en Firebase Console o copia el contenido de `firestore.rules` manualmente.

5. **Ejecutar en desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ⚙️ Configuración

### Firebase Setup

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** con Email/Password y Google
3. Crea una base de datos **Firestore**
4. Configura las reglas de seguridad desde `firestore.rules`
5. Habilita **Storage** para archivos (opcional)

### Estructura de Firestore

```
users/
  {userId}/
    - name: string
    - email: string
    - role: 'admin' | 'moderator' | 'user'
    - status: 'active' | 'away' | 'busy' | 'inactive'
    - description: string
    - pin: string (único)
    - chatLastReadAt: { [chatId]: timestamp }

chats/
  {chatId}/
    - type: 'private' | 'group'
    - name: string
    - participantIds: string[]
    - adminIds: string[]
    - lastMessageAt: timestamp
    - lastMessageSender: string
    
    messages/
      {messageId}/
        - content: string
        - senderId: string
        - sentAt: string (ISO)
        - type: 'text' | 'image' | 'file'
```

---

## 🎯 Características Detalladas

### 🔴 Sistema de Mensajes No Leídos

- ✅ Contador preciso de mensajes no leídos
- ✅ Se actualiza en tiempo real
- ✅ No muestra notificación de tus propios mensajes
- ✅ Marca como leído al abrir el chat automáticamente
- ✅ Throttling inteligente (actualiza cada 2 segundos máximo)

### 🔍 Búsqueda de Mensajes

- Búsqueda case-insensitive
- Filtrado instantáneo
- Contador de resultados
- Botón para limpiar búsqueda

### 🎭 Sistema de Roles

#### 👑 Admin de Plataforma
- Acceso completo a todos los chats
- Vista de usuarios con permisos elevados
- Puede eliminar cualquier grupo
- Insignia púrpura con corona

#### ⭐ Creador de Grupo
- Puede añadir/remover miembros
- Asignar co-creadores
- Eliminar el grupo
- Insignia dorada con estrella
- Borde animado en mensajes

#### 🛡️ Co-creador de Grupo
- Puede añadir/remover miembros
- No puede eliminar el grupo
- Insignia azul con escudo

---

## 🎨 Temas

### ☀️ Tema Claro
- Colores vibrantes y claros
- Fondo blanco
- Ideal para uso diurno

### 🌙 Tema Oscuro
- Colores suaves y oscuros
- Fondo negro
- Reduce fatiga visual

### ⚫⚪ Tema Monocromático
- **Único en su clase** ⭐
- Blanco y negro puro (alto contraste)
- **Mantiene colores en insignias de roles**
- Perfecto para accesibilidad
- Reduce distracciones visuales
- Sin bordes en elementos de chat para limpieza visual

---

## Documentación de la Estructura del Proyecto

A continuación se detalla la estructura de carpetas y archivos del proyecto para facilitar su comprensión y desarrollo.

```
.
├── src
│   ├── app
│   │   ├── dashboard
│   │   │   ├── _components
│   │   │   ├── chat
│   │   │   │   └── [id]
│   │   │   │       ├── _components
│   │   │   │       └── page.tsx
│   │   │   ├── settings
│   │   │   │   └── page.tsx
│   │   │   ├── users
│   │   │   │   ├── _components
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── login
│   │   │   └── page.tsx
│   │   ├── register
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components
│   │   ├── ui
│   │   ├── FirebaseErrorListener.tsx
│   │   ├── logo.tsx
│   │   └── user-avatar.tsx
│   ├── firebase
│   │   ├── firestore
│   │   │   ├── use-collection.tsx
│   │   │   └── use-doc.tsx
│   │   ├── auth-provider.tsx
│   │   ├── client-provider.tsx
│   │   ├── config.ts
│   │   ├── error-emitter.ts
│   │   ├── errors.ts
│   │   ├── index.ts
│   │   ├── non-blocking-login.tsx
│   │   ├── non-blocking-updates.tsx
│   │   └── provider.tsx
│   ├── hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib
│   │   ├── placeholder-images.json
│   │   ├── placeholder-images.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── ai
│   │   ├── dev.ts
│   │   └── genkit.ts
├── docs
│   └── backend.json
├── public
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

### `src/app`

Esta carpeta contiene todas las rutas y páginas de la aplicación, siguiendo la convención del App Router de Next.js.

-   `globals.css`: Estilos globales y configuración de variables CSS para el tema (light/dark).
-   `layout.tsx`: El layout raíz de la aplicación. Envuelve todas las páginas e incluye los proveedores de contexto principales como `FirebaseClientProvider` y `Toaster`.
-   `page.tsx`: La página de inicio, que actualmente redirige al `/dashboard`.

#### `src/app/login` y `src/app/register`

-   Contienen las páginas de **Inicio de Sesión** y **Registro**, respectivamente.
-   Manejan la autenticación a través de correo electrónico/contraseña y Google, utilizando las funciones de `src/firebase/non-blocking-login.tsx`.

#### `src/app/dashboard`

-   Es el área principal de la aplicación, accesible solo para usuarios autenticados.
-   `layout.tsx`: Define la estructura del panel de control, incluyendo la barra lateral (`Sidebar`) y el encabezado principal (`MainHeader`).
-   `page.tsx`: La página de bienvenida que se muestra al entrar al dashboard.
-   `_components`: Componentes específicos para el dashboard, como la lista de chats (`ChatList`) y el menú de usuario (`UserMenu`).

##### `src/app/dashboard/chat/[id]`

-   Ruta dinámica para las conversaciones de chat individuales.
-   `page.tsx`: Renderiza la interfaz de un chat, incluyendo el encabezado, los mensajes y el campo de entrada.
-   `_components`: Contiene los componentes que conforman la página de chat: `ChatHeader`, `ChatMessages`, `MessageInput`.

##### `src/app/dashboard/settings`

-   `page.tsx`: La página de **Perfil**, donde los usuarios pueden ver su información (nombre, PIN, foto), actualizar su estado y cerrar sesión.

##### `src/app/dashboard/users`

-   `page.tsx`: Muestra una lista de todos los usuarios registrados en la aplicación.
-   `_components/user-list.tsx`: El componente que obtiene y renderiza la tabla de usuarios desde Firestore.

### `src/components`

Contiene componentes de React reutilizables en toda la aplicación.

-   `ui/`: Componentes de UI de **ShadCN**, como `Button`, `Card`, `Input`, etc. Son la base del diseño del sistema.
-   `logo.tsx`: El logo de la aplicación "ChatStatus".
-   `user-avatar.tsx`: Un componente para mostrar el avatar de un usuario con su indicador de estado (activo, inactivo, etc.).
-   `FirebaseErrorListener.tsx`: Componente crucial para la depuración que captura errores de permisos de Firestore y los muestra en el overlay de desarrollo de Next.js.

### `src/firebase`

Centraliza toda la configuración y la lógica de interacción con Firebase.

-   `config.ts`: Contiene el objeto de configuración de tu proyecto de Firebase.
-   `provider.tsx`: El `FirebaseProvider` principal que utiliza el Context API de React para proveer las instancias de Firebase (App, Auth, Firestore) y el estado del usuario a toda la aplicación. También exporta hooks como `useFirebase`, `useAuth`, `useFirestore` y `useUser`.
-   `client-provider.tsx`: Un proveedor que se asegura de que Firebase se inicialice una sola vez en el lado del cliente.
-   `auth-provider.tsx`: Un componente que protege las rutas. Si un usuario no está autenticado, lo redirige a la página de login.
-   `index.ts`: Un archivo "barril" que exporta todas las funciones y hooks importantes de esta carpeta para facilitar las importaciones.
-   `non-blocking-login.tsx`: Contiene la lógica para registrar e iniciar sesión de forma no bloqueante, incluyendo la creación del perfil del usuario en Firestore al registrarse.
-   `non-blocking-updates.tsx`: Funciones para realizar operaciones de escritura en Firestore (`setDoc`, `addDoc`) sin bloquear el hilo principal y con un manejo de errores centralizado.
-   `firestore/`: Hooks personalizados para interactuar con Firestore.
    -   `useCollection.tsx`: Hook para suscribirse a una colección de Firestore en tiempo real.
    -   `useDoc.tsx`: Hook para suscribirse a un documento de Firestore en tiempo real.
-   `errors.ts` y `error-emitter.ts`: Un sistema avanzado para crear y emitir errores de permisos de Firestore con contexto, facilitando enormemente la depuración de reglas de seguridad.

### `src/hooks`

Hooks de React personalizados.

-   `use-mobile.tsx`: Detecta si el usuario está en un dispositivo móvil.
-   `use-toast.ts`: Un hook para mostrar notificaciones (toasts) en la aplicación.

### `src/lib`

Utilidades, tipos y datos compartidos.

-   `types.ts`: Define las interfaces de TypeScript para los modelos de datos principales (`User`, `Chat`, `Message`).
-   `utils.ts`: Contiene la función `cn` para combinar clases de Tailwind CSS de forma segura.
-   `placeholder-images.json` y `placeholder-images.ts`: gestiona los datos de las imágenes de placeholder para toda la aplicación.

### `src/ai`

Carpeta preparada para funcionalidades de Inteligencia Artificial utilizando Genkit.

-   `genkit.ts`: Configuración e inicialización de Genkit.
-   `dev.ts`: Archivo para registrar flujos de Genkit en el entorno de desarrollo.

### `docs/backend.json`

Un archivo de "plano" que describe la estructura de datos (entidades y colecciones de Firestore) y la configuración de autenticación. Sirve como una referencia central para la lógica del backend y puede ser usado para herramientas de generación de código o configuración automática.

### Archivos de Configuración Raíz

-   `next.config.ts`: Configuración de Next.js.
-   `tailwind.config.ts`: Configuración de Tailwind CSS, incluyendo la definición de la paleta de colores y fuentes.
-   `package.json`: Lista de dependencias y scripts del proyecto.
-   `firestore.rules`: Reglas de seguridad para la base de datos de Firestore.

---

## 🚀 Deploy

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

```bash
npm install -g vercel
vercel
```

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

---

## 🛠️ Tecnologías

### Frontend
- **[Next.js 15](https://nextjs.org/)** - Framework React con App Router
- **[React 19](https://react.dev/)** - Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipado estático
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utility-first
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes UI accesibles

### Backend
- **[Firebase](https://firebase.google.com/)**
  - **Firestore** - Base de datos NoSQL en tiempo real
  - **Authentication** - Sistema de autenticación
  - **Storage** - Almacenamiento de archivos

### Librerías Adicionales
- **[Lucide Icons](https://lucide.dev/)** - Iconos modernos
- **[DiceBear Avatars](https://www.dicebear.com/)** - Generación de avatares
- **[date-fns](https://date-fns.org/)** - Manipulación de fechas

---

## 📱 Responsive Design

### Breakpoints

```css
sm: 640px   /* Tablet pequeña */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop grande */
```

### Optimizaciones Móviles

- ✅ Sidebar colapsable automático
- ✅ Textos truncados con puntos suspensivos
- ✅ Botones táctiles optimizados
- ✅ Padding y spacing adaptativo
- ✅ Navegación optimizada
- ✅ Botón de 3 puntos siempre visible

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Roadmap

- [ ] Llamadas de voz y video
- [ ] Envío de archivos e imágenes
- [ ] Reacciones a mensajes
- [ ] Mensajes destacados
- [ ] Encriptación end-to-end
- [ ] Notificaciones push
- [ ] App móvil nativa

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

<div align="center">

**Hecho con ❤️ por [JFrangel](https://github.com/JFrangel)**

⭐ Si te gusta este proyecto, dale una estrella en GitHub

</div>
