import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { IngredientesProvider } from './contexts/IngredientesContext'
import { RecetasProvider } from './contexts/RecetasContext'
import { PartidasProvider } from './contexts/PartidasContext'
import { PedidosProvider } from './contexts/PedidosContext'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import IngredientesPage from './features/ingredientes/IngredientesPage'
import RecetasPage from './features/recetas/RecetasPage'
import PartidasPage from './features/partidas/PartidasPage'
import CalculadorPage from './features/calculador/CalculadorPage'
import PedidosPage from './features/pedidos/PedidosPage'
import ReportesPage from './features/reportes/ReportesPage'

function ProtectedRoutes() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <IngredientesProvider>
      <RecetasProvider>
        <PartidasProvider>
          <PedidosProvider>
            <AppLayout />
          </PedidosProvider>
        </PartidasProvider>
      </RecetasProvider>
    </IngredientesProvider>
  )
}

function PublicRoute() {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute />} />
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingredientes" element={<IngredientesPage />} />
            <Route path="/recetas" element={<RecetasPage />} />
            <Route path="/partidas" element={<PartidasPage />} />
            <Route path="/calculador" element={<CalculadorPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/reportes" element={<ReportesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
