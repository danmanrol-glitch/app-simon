import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { Toast } from './components/Toast'

// Cada pantalla se descarga solo cuando se abre: la primera carga en el celular es más liviana.
const Home = lazy(() => import('./pages/Home'))
const Activities = lazy(() => import('./pages/Activities'))
const Community = lazy(() => import('./pages/Community'))
const Assistant = lazy(() => import('./pages/Assistant'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))

function PageFallback() {
  return (
    <div className="grid h-full place-items-center py-24" aria-label="Cargando">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <Layout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="actividades" element={<Activities />} />
            <Route path="comunidad" element={<Community />} />
            <Route path="asistente" element={<Assistant />} />
            <Route path="perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toast />
    </>
  )
}
