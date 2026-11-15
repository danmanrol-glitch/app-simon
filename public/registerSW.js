// Compatibilidad: la primera versión de la app cargaba este archivo. Se mantiene para que esas
// copias en caché registren el service worker nuevo y se actualicen solas.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' })
}
