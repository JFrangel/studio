// Parchear localStorage en el servidor para evitar errores de Firebase
if (typeof window === "undefined" && typeof global !== "undefined") {
  // @ts-ignore
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
}

export const firebaseConfig = {
  "projectId": "studio-2423527268-b13e6",
  "appId": "1:1077436105805:web:6faadcbbf0d311332ac804",
  "apiKey": "AIzaSyCEfPTKTL9SbO0Nj997ist84OkZPww2_Y4",
  "authDomain": "studio-2423527268-b13e6.firebaseapp.com",
  "measurementId": "G-EXAMPLE1234",
  "messagingSenderId": "1077436105805",
  "storageBucket": "studio-2423527268-b13e6.firebasestorage.app"
};
