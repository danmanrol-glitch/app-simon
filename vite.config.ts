import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { Readable } from 'node:stream'

// En desarrollo, sirve /api/chat y /api/publish con las mismas funciones que usa Vercel en producción.
function devApi(): Plugin {
  return {
    name: 'ean-dev-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api', async (req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\//, '')
        if (!['chat', 'publish', 'health'].includes(name)) return next()
        try {
          const mod = (await server.ssrLoadModule(`/api/${name}.ts`)) as { POST?: (r: Request) => Promise<Response> }
          if (req.method !== 'POST' || !mod.POST) {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const request = new Request(`http://localhost${req.originalUrl ?? '/api/' + name}`, {
            method: 'POST',
            headers: {
              'Content-Type': req.headers['content-type'] ?? 'application/json',
              Authorization: req.headers.authorization ?? '',
            },
            body: Buffer.concat(chunks),
          })
          const response = await mod.POST(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          if (response.body) Readable.fromWeb(response.body as import('node:stream/web').ReadableStream).pipe(res)
          else res.end()
        } catch (err) {
          console.error(err)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Error en el servidor de desarrollo.' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Carga .env sin prefijo solo en el proceso de Node (servidor). Nada de esto se inyecta en el bundle del cliente.
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SECRET_KEY', 'GEMINI_MODERATION_MODEL', 'AI_PROVIDER', 'GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODELS', 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL']) {
    if (env[key] && !process.env[key]) process.env[key] = env[key]
  }

  return {
    build: {
      rollupOptions: {
        output: {
          // Librerías en archivos separados: se guardan en caché y no se re-descargan en cada deploy.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            motion: ['framer-motion'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
    plugins: [
      react(),
      devApi(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        includeAssets: ['icon-192.png', 'apple-touch-icon.png', 'ean-logo.png'],
        workbox: { navigateFallbackDenylist: [/^\/api\//], cleanupOutdatedCaches: true, clientsClaim: true, skipWaiting: true, importScripts: ['sw-reload.js'] },
        manifest: {
          name: 'EAN Connect',
          short_name: 'EAN Connect',
          description: 'La comunidad de estudiantes de la Universidad EAN',
          theme_color: '#f8fafc',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
  }
})
