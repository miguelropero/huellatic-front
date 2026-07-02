import { Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegistroEmpresaPage from './pages/RegistroEmpresaPage'
import DashboardLayout from './components/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import OrganizacionesPage from './pages/OrganizacionesPage'
import EmpresaDetallePage from './pages/EmpresaDetallePage'
import RegistroEmpleadoPage from './pages/RegistroEmpleadoPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import LogsPage from './pages/LogsPage'
import ReportesPage from './pages/ReportesPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro-empresa" element={<RegistroEmpresaPage />} />
      <Route path="/registro/:token" element={<RegistroEmpleadoPage />} />
      
      {/* Rutas protegidas del Dashboard usando el Layout */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="organizaciones" element={<OrganizacionesPage />} />
        <Route path="organizaciones/:id" element={<EmpresaDetallePage />} />
        <Route path="configuracion" element={<ConfiguracionPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="logs" element={<LogsPage />} />
      </Route>

      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}

export default App
