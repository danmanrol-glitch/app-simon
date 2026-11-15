# EAN Connect

Prototipo PWA para estudiantes de la Universidad EAN: actividades, comunidad, consejos para la vida universitaria y perfil con privacidad.

Stack: Vite · React 18 · TypeScript · Tailwind CSS · React Router · Framer Motion · Lucide React · vite-plugin-pwa.

```bash
npm install
npm run dev      # desarrollo
npm run build    # build de producción + service worker
npm run preview  # servir el build
```

## Estructura

- `src/mock/db.ts`: interfaces y datos simulados (tips, actividades, publicaciones, usuarios, notificaciones, encuesta).
- `src/context/AppContext.tsx`: estado en memoria (inscripciones, reacciones, comentarios, denuncias/bloqueos, ajustes).
- `src/pages/`: Inicio, Actividades, Comunidad, Perfil.
- `src/components/`: barra inferior, tarjetas, hoja modal, calendario, notificaciones, banner de bienestar.

Los datos son ficticios y el estado se reinicia al recargar la página.
