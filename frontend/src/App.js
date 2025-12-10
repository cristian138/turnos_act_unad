import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Usuarios from './pages/Usuarios';
import Servicios from './pages/Servicios';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import FuncionarioDashboard from './pages/FuncionarioDashboard';
import VAPDashboard from './pages/VAPDashboard';
import PantallaPublica from './pages/PantallaPublica';

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 p-8 bg-slate-50">
        {children}
      </div>
    </div>
  );
};

const DashboardRouter = () => {
  const { usuario } = useAuth();

  if (!usuario) return null;

  if (usuario.rol === 'administrador') {
    return <AdminDashboard />;
  } else if (usuario.rol === 'funcionario') {
    return <FuncionarioDashboard />;
  } else if (usuario.rol === 'vap') {
    return <VAPDashboard />;
  }

  return <div>Rol no reconocido</div>;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/pantalla-publica" element={<PantallaPublica />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardRouter />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/usuarios"
              element={
                <ProtectedRoute rolesPermitidos={['administrador']}>
                  <DashboardLayout>
                    <Usuarios />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/servicios"
              element={
                <ProtectedRoute rolesPermitidos={['administrador']}>
                  <DashboardLayout>
                    <Servicios />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/reportes"
              element={
                <ProtectedRoute rolesPermitidos={['administrador', 'funcionario']}>
                  <DashboardLayout>
                    <Reportes />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/configuracion"
              element={
                <ProtectedRoute rolesPermitidos={['administrador']}>
                  <DashboardLayout>
                    <Configuracion />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
