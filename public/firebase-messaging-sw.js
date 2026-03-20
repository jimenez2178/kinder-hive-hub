/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// Configuración de Firebase - Cargada desde el cliente
// En producción, FCM buscará este archivo para manejar mensajes en segundo plano.
firebase.initializeApp({
  apiKey: "AIzaSy...",
  authDomain: "kinder-hive.firebaseapp.com",
  projectId: "kinder-hive",
  storageBucket: "kinder-hive.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ', payload);
  const notificationTitle = payload.notification.title || "Aviso de Kinder Hive Hub";
  const notificationOptions = {
    body: payload.notification.body || "Tienes una nueva actualización escolar.",
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
