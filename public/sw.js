const CACHE_NAME = 'khh-cache-v3';

self.addEventListener('push', function (event) {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: 'Kinder Hive Hub', body: event.data.text() };
    }

    // Normalizar datos de Firebase (pueden venir en .notification o .data)
    const title = data.notification?.title || data.title || 'Aviso del Colegio';
    const body = data.notification?.body || data.body || 'Tienes una nueva actualización en Kinder Hive Hub.';
    const icon = '/icons/icon-192x192.png';
    const url = data.data?.url || data.url || '/dashboard/padre';

    const options = {
        body: body,
        icon: icon,
        badge: icon,
        vibrate: [100, 50, 100],
        data: {
            url: url
        },
        actions: [
            { action: 'open', title: 'Ver ahora' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (windowClients) {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
