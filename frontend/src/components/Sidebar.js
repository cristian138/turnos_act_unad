import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  FileText,
  LogOut,
  Ticket,
  Monitor
} from 'lucide-react';

const Sidebar = () => {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = {
    administrador: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Usuarios', path: '/usuarios' },
      { icon: Briefcase, label: 'Servicios', path: '/servicios' },
      { icon: FileText, label: 'Reportes', path: '/reportes' },
      { icon: Settings, label: 'Configuración', path: '/configuracion' }
    ],
    funcionario: [
      { icon: LayoutDashboard, label: 'Módulo de Atención', path: '/dashboard' },
      { icon: FileText, label: 'Reportes', path: '/reportes' }
    ],
    vap: [
      { icon: Ticket, label: 'Generar Turno', path: '/dashboard' },
      { icon: Monitor, label: 'Cerrar Turnos', path: '/cerrar-turnos' }
    ]
  };

  const items = menuItems[usuario?.rol] || [];

  return (
    <div className="w-64 bg-primary min-h-screen flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-primary-600 bg-white">
        <img src="/logo-unad.png" alt="UNAD Logo" className="h-16 w-auto" />
        <p className="text-primary text-xs mt-2 font-semibold">Gestión de Turnos</p>
      </div>

      <div className="p-4 border-b border-primary-600">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
            <span className="text-white font-bold">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{usuario?.nombre}</p>
            <p className="text-primary-100 text-xs capitalize">{usuario?.rol}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`menu-item-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Button
                variant="ghost"
                className={`w-full justify-start text-white hover:bg-primary-600 ${
                  isActive ? 'bg-primary-600' : ''
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-600">
        <Button
          variant="ghost"
          className="w-full justify-start text-white hover:bg-primary-600"
          onClick={handleLogout}
          data-testid="logout-button"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
