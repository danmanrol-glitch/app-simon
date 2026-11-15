import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Activities from './pages/Activities'
import Community from './pages/Community'
import Profile from './pages/Profile'
import Assistant from './pages/Assistant'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="actividades" element={<Activities />} />
        <Route path="comunidad" element={<Community />} />
        <Route path="asistente" element={<Assistant />} />
        <Route path="perfil" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
