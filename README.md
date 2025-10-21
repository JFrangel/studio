# ChatStatus - Plataforma de Mensajería

¡Bienvenido a ChatStatus! Esta es una aplicación web de mensajería empresarial construida con Next.js, Firebase y Tailwind CSS. Permite a los usuarios registrarse, iniciar sesión, chatear en tiempo real y gestionar sus perfiles.

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
