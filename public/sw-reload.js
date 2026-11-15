// Se carga dentro del service worker. Cuando se activa una versión nueva, recarga las pestañas
// abiertas para que nadie se quede viendo una versión anterior guardada en caché.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url))
    }),
  )
})
