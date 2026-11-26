/* ==========================================================================
   ATOYAC · FIREBASE CLOUD SYNC ADAPTER (OPTIONAL PLUG & PLAY)
   ==========================================================================
   Por defecto el sistema sincroniza en tiempo real entre pestañas/pantallas
   locales (BroadcastChannel + LocalStorage). Cuando crees tu proyecto en
   Firebase Console (https://console.firebase.google.com), pega aquí tus
   credenciales para sincronizar el iPad de la barra, la Caja y los pedidos
   Web a través de internet con Firestore.
   ========================================================================== */

export const FIREBASE_CONFIG = {
  enabled: true,
  apiKey: "AIzaSyB-og7jsZleSXKpbFUYCiHTQnQ6tXjMwy4",
  authDomain: "atoyac-kitchen.firebaseapp.com",
  projectId: "atoyac-kitchen",
  storageBucket: "atoyac-kitchen.firebasestorage.app",
  messagingSenderId: "555325906681",
  appId: "1:555325906681:web:9061384db3848d7aab4c28",
  measurementId: "G-LFBG314FL9"
};
