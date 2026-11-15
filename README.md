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

## EAN Assistant (IA)

El chat vive en `src/components/EanAssistant.tsx` y llama a `POST /api/chat` (`api/chat.ts`), una Vercel Function con respuesta en streaming. Usa Gemini (`@google/genai`) por defecto y deja Claude (`@anthropic-ai/sdk`) como alternativa: se elige con `AI_PROVIDER`. Las API keys se leen solo en el servidor; nunca se usa el prefijo `VITE_`, porque Vite publica esas variables en el navegador.

1. Copia `.env.example` como `.env` y pon tu `GEMINI_API_KEY`.
2. `npm run dev`: Vite sirve `/api/chat` con la misma función que corre en Vercel.
3. En Vercel, agrega `GEMINI_API_KEY` en Settings > Environment Variables y vuelve a desplegar.

Los datos son ficticios y el estado se reinicia al recargar la página.
