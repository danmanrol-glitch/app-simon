# EAN Connect

PWA para estudiantes de la Universidad EAN: actividades, comunidad, consejos para la vida universitaria, perfil con privacidad y asistente con IA. Los datos y la autenticación viven en Supabase.

Stack: Vite · React 18 · TypeScript · Tailwind CSS · React Router · Framer Motion · Lucide React · vite-plugin-pwa · Supabase.

**Antes de empezar:** sigue `SUPABASE_SETUP.txt` (variables de entorno y `supabase/schema.sql`).

```bash
npm install
npm run dev      # desarrollo
npm run build    # build de producción + service worker
npm run preview  # servir el build
```

## Estructura

- `supabase/schema.sql`: tablas, vista `public_profiles`, triggers y políticas RLS.
- `src/lib/supabase.ts`: cliente de Supabase (lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).
- `src/context/AuthContext.tsx`: sesión, perfil, registro, login y edición del perfil.
- `src/hooks/`: `useActivities` (actividades e inscripciones), `useCommunity` (posts, comentarios, reacciones, denuncias, bloqueos) y `useProfiles` (perfiles públicos).
- `src/pages/`: Login, Inicio, Actividades, Comunidad, Asistente y Perfil. Todas menos Login exigen sesión.
- `src/data/catalog.ts`: contenido estático (tips, frases, categorías). Las notificaciones de la campana siguen siendo de ejemplo.

## EAN Assistant (IA)

El chat vive en `src/components/EanAssistant.tsx` y llama a `POST /api/chat` (`api/chat.ts`), una Vercel Function con respuesta en streaming. Usa Gemini (`@google/genai`) por defecto y deja Claude (`@anthropic-ai/sdk`) como alternativa: se elige con `AI_PROVIDER`. Las API keys se leen solo en el servidor; nunca se usa el prefijo `VITE_`, porque Vite publica esas variables en el navegador.

1. Copia `.env.example` como `.env` y pon tu `GEMINI_API_KEY`.
2. `npm run dev`: Vite sirve `/api/chat` con la misma función que corre en Vercel.
3. En Vercel, agrega `GEMINI_API_KEY` en Settings > Environment Variables y vuelve a desplegar.

`/api/publish` revisa con IA (Gemini) cada post, comentario y foto antes de guardarlo con la secret key del servidor; los estudiantes no pueden insertar directamente en esas tablas.

`/api/chat` exige la sesión de Supabase del estudiante (header `Authorization: Bearer <access_token>`), así que nadie sin cuenta puede gastar tu cuota de IA.
