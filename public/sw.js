self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/SPARKLE BEV. LOGO A No BG.png', 
      badge: '/SPARKLE BEV. LOGO A No BG.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200], 
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/'
      }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});