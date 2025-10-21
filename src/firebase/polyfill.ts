// Este archivo debe importarse ANTES de cualquier código de Firebase
// Parchea localStorage en el servidor para evitar errores

if (typeof window === "undefined" && typeof global !== "undefined") {
  // Crear un objeto con métodos que mantengan el contexto correcto
  const storage = {
    getItem: function(key: string) { return null; },
    setItem: function(key: string, value: string) {},
    removeItem: function(key: string) {},
    clear: function() {},
    key: function(index: number) { return null; },
    length: 0
  };
  
  // @ts-ignore - Necesario para el servidor
  if (!global.localStorage) {
    // @ts-ignore
    global.localStorage = storage;
  }
  
  // También definir localStorage directamente en el scope global
  // @ts-ignore
  if (typeof localStorage === "undefined") {
    // @ts-ignore
    globalThis.localStorage = storage;
  }
}

export {};
