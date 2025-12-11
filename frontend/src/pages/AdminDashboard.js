import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/card';
import { Users, Briefcase, Ticket, Clock } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    usuarios: 0,
    servicios: 0,
    turnosHoy: 0,
    turnosEspera: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const [usuariosRes, serviciosRes, turnosRes] = await Promise.all([
        api.usuarios.listar(),
        api.servicios.listar(),
        api.turnos.obtenerTodos()
      ]);

      const hoy = new Date().toISOString().split('T')[0];
      const turnosHoy = turnosRes.data.filter(t => 
        t.fecha_creacion.split('T')[0] === hoy
      );

      setStats({
        usuarios: usuariosRes.data.length,
        servicios: serviciosRes.data.filter(s => s.activo).length,
        turnosHoy: turnosHoy.length,
        turnosEspera: turnosRes.data.filter(t => t.estado === 'espera').length
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const statCards = [
    {
      title: 'Usuarios Activos',
      value: stats.usuarios,
      icon: Users,
      color: 'bg-primary',
      testId: 'stat-usuarios'
    },
    {
      title: 'Servicios',
      value: stats.servicios,
      icon: Briefcase,
      color: 'bg-secondary',
      testId: 'stat-servicios'
    },
    {
      title: 'Turnos Hoy',
      value: stats.turnosHoy,
      icon: Ticket,
      color: 'bg-accent',
      testId: 'stat-turnos-hoy'
    },
    {
      title: 'En Espera',
      value: stats.turnosEspera,
      icon: Clock,
      color: 'bg-green-600',
      testId: 'stat-en-espera'
    }
  ];

  return (
    <div data-testid="admin-dashboard">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Dashboard</h1>
        <p className="text-slate-600">Resumen general del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.testId} className="p-6" data-testid={stat.testId}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-heading font-bold text-primary mb-4">Actividad Reciente</h2>
          <p className="text-slate-600">Sistema de turnos en operación</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-heading font-bold text-primary mb-4">Accesos Rápidos</h2>
          <div className="space-y-2">
            <a href="/usuarios" className="block p-3 hover:bg-slate-50 rounded-md transition-colors">
              <p className="font-medium text-slate-900">Gestionar Usuarios</p>
              <p className="text-sm text-slate-600">Crear y administrar usuarios del sistema</p>
            </a>
            <a href="/servicios" className="block p-3 hover:bg-slate-50 rounded-md transition-colors">
              <p className="font-medium text-slate-900">Gestionar Servicios</p>
              <p className="text-sm text-slate-600">Configurar servicios de atención</p>
            </a>
            <a href="/reportes" className="block p-3 hover:bg-slate-50 rounded-md transition-colors">
              <p className="font-medium text-slate-900">Ver Reportes</p>
              <p className="text-sm text-slate-600">Generar reportes de atención</p>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
