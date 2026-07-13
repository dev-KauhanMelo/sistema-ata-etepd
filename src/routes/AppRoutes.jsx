import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'
import Login from '../pages/Login'
import Cadastro from '../pages/Cadastro'
import DashboardRepresentante from '../pages/DashboardRepresentante'
import Chamada from '../pages/Chamada'
import Correcoes from '../pages/Correcoes'
import Calendario from '../pages/Calendario'
import ProfessorHome from '../pages/ProfessorHome'
import Coordenacao from '../pages/Coordenacao'

// RBAC: o cargo vem do banco no login e determina as rotas — nunca há
// seleção manual de "modo" pelo usuário (contexto §4.2).
function RotaRepresentante() {
  const { perfil, carregando } = useAuth()
  if (carregando) return null
  if (!perfil) return <Navigate to="/login" replace />
  if (perfil.usuario.cargo !== 'aluno') return <Navigate to="/professor" replace />
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}

function RotaProfessor() {
  const { perfil, carregando } = useAuth()
  if (carregando) return null
  if (!perfil) return <Navigate to="/login" replace />
  if (perfil.usuario.cargo !== 'professor') return <Navigate to="/" replace />
  return <Outlet />
}

function RotaPublica() {
  const { perfil, carregando } = useAuth()
  if (carregando) return null
  if (perfil) return <Navigate to={perfil.usuario.cargo === 'professor' ? '/professor' : '/'} replace />
  return <Outlet />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>

      <Route element={<RotaRepresentante />}>
        <Route path="/" element={<DashboardRepresentante />} />
        <Route path="/chamada" element={<Chamada />} />
        <Route path="/correcoes" element={<Correcoes />} />
        <Route path="/calendario" element={<Calendario />} />
      </Route>

      <Route element={<RotaProfessor />}>
        <Route path="/professor" element={<ProfessorHome />} />
      </Route>

      {/* Ferramenta utilitária isolada — fora do RBAC (contexto §4.5) */}
      <Route path="/coordenacao" element={<Coordenacao />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
