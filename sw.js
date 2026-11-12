/* Minimal push-ready service worker. A VAPID sender can use this later. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (event) { event.waitUntil(self.clients.claim()); });
self.addEventListener('message', function (event) {
  const data = event.data || {};
  if (data.type === 'notify') event.waitUntil(self.registration.showNotification(data.title || '课题组工作台', { body: data.body || '', tag: data.tag || 'lab-workbench', renotify: true }));
});
self.addEventListener('push', function (event) {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data ? event.data.text() : '' }; }
  event.waitUntil(self.registration.showNotification(data.title || '课题组工作台', { body: data.body || '有新的任务提醒', tag: data.tag || 'lab-push', renotify: true }));
});
self.addEventListener('notificationclick', function (event) {
  event.notification.close(); event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) { for (const client of list) if ('focus' in client) return client.focus(); return clients.openWindow('/'); }));
});
