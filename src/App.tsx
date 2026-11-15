import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { Toast } from './components/Toast'
import Home from './pages/Home'
import Activities from './pages/Activities'
import Community from './pages/Community'
import Assistant from './pages/Assistant'
import Profile from './pages/Profile'
import Login from './pages/Login'

export default function App() {
  return (
    <>
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
      <Toast />
    </>
  )
}
