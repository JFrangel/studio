// Este archivo es ejecutado por Next.js al inicio del servidor
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export function register() {
  // Solo ejecutar en el servidor
  if (typeof window === "undefined") {
    // Parchear localStorage globalmente
    const storage = {
      getItem: function() { return null; },
      setItem: function() {},
      removeItem: function() {},
      clear: function() {},
      key: function() { return null; },
      length: 0
    };
    
    // @ts-ignore
    global.localStorage = storage;
    // @ts-ignore
    globalThis.localStorage = storage;
    
    console.log('[Instrumentation] localStorage polyfill applied for server');
  }
}
