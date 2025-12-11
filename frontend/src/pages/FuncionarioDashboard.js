import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { PhoneCall, PhoneForwarded, CheckCircle, AlertCircle } from 'lucide-react';

const FuncionarioDashboard = () => {
  const [turnos, setTurnos] = useState([]);
  const [turnoActual, setTurnoActual] = useState(null);
  const { socket } = useSocket();
  const { usuario } = useAuth();

  useEffect(() => {
    cargarTurnos();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('turno_generado', () => {
        cargarTurnos();
      });

      socket.on('turno_cerrado', () => {
        cargarTurnos();
      });

      return () => {
        socket.off('turno_generado');
        socket.off('turno_cerrado');
      };
    }
  }, [socket]);

  const cargarTurnos = async () => {
    try {
      const response = await api.turnos.obtenerTodos();
      setTurnos(response.data);
    } catch (error) {
      console.error('Error al cargar turnos:', error);
    }
  };

  const handleLlamar = async () => {
    if (turnos.length === 0) {
      toast.error('No hay turnos en espera');
      return;
    }

    const turnosDisponibles = turnos.filter(t => 
      usuario.servicios_asignados.includes(t.servicio_id)
    );

    if (turnosDisponibles.length === 0) {
      toast.error('No hay turnos disponibles para tus servicios');
      return;
    }

    const siguienteTurno = turnosDisponibles[0];

    try {
      const response = await api.turnos.llamar({ turno_id: siguienteTurno.id });
      setTurnoActual(response.data);
      toast.success(`Turno ${response.data.codigo} llamado`);
      cargarTurnos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al llamar turno');
    }
  };

  const handleRellamar = async () => {
    if (!turnoActual) return;
    toast.info(`Rellamando turno ${turnoActual.codigo}`);
  };

  const handleCerrar = async () => {
    if (!turnoActual) return;

    try {
      await api.turnos.cerrar({ turno_id: turnoActual.id });
      toast.success(`Turno ${turnoActual.codigo} cerrado`);
      setTurnoActual(null);
      cargarTurnos();
    } catch (error) {
      toast.error('Error al cerrar turno');
    }
  };

  const turnosPorServicio = usuario?.servicios_asignados?.reduce((acc, servicioId) => {
    const turnosServicio = turnos.filter(t => t.servicio_id === servicioId);
    if (turnosServicio.length > 0) {
      acc[servicioId] = {
        nombre: turnosServicio[0].servicio_nombre,
        turnos: turnosServicio
      };
    }
    return acc;
  }, {}) || {};

  return (
    <div data-testid="funcionario-dashboard">
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-primary mb-2">Módulo de Atención</h1>
        <p className="text-slate-600">Gestiona la atención de turnos</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card className="p-6 bg-white border-2 border-slate-200">
            <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">Cola de Turnos</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {Object.values(turnosPorServicio).map(({ nombre, turnos: turnosServicio }) => (
                <div key={nombre} className="mb-4">
                  <p className="text-sm font-semibold text-slate-700 mb-2">{nombre}</p>
                  {turnosServicio.map((turno) => (
                    <div
                      key={turno.id}
                      className="p-3 bg-slate-50 rounded-md mb-2 border-l-4 border-primary"
                      data-testid={`turno-item-${turno.id}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-lg">{turno.codigo}</span>
                        {turno.prioridad && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                            {turno.prioridad}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {turnos.length === 0 && (
                <p className="text-center text-slate-500 py-8">No hay turnos en espera</p>
              )}
            </div>
          </Card>
        </div>

        <div className="col-span-8">
          <Card className="p-8">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-6">Turno Actual</h2>
            
            {turnoActual ? (
              <div>
                <div className="text-center mb-6">
                  <p className="text-slate-600 mb-2">Atendiendo</p>
                  <p className="font-mono text-6xl font-black text-primary mb-4">
                    {turnoActual.codigo}
                  </p>
                  <p className="text-xl text-slate-700">{turnoActual.servicio_nombre}</p>
                  {turnoActual.prioridad && (
                    <div className="mt-4 inline-flex items-center px-4 py-2 bg-red-100 rounded-full">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="text-red-600 font-semibold">{turnoActual.prioridad}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Información del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 font-medium">Documento</p>
                      <p className="text-slate-900 font-semibold">{turnoActual.tipo_documento} {turnoActual.numero_documento}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium">Tipo de Usuario</p>
                      <p className="text-slate-900 capitalize">{turnoActual.tipo_usuario}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-600 font-medium">Nombre Completo</p>
                      <p className="text-slate-900 font-semibold text-lg">{turnoActual.nombre_completo}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium">Teléfono</p>
                      <p className="text-slate-900">{turnoActual.telefono}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 font-medium">Correo</p>
                      <p className="text-slate-900">{turnoActual.correo}</p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 justify-center">
                  <Button
                    onClick={handleRellamar}
                    variant="outline"
                    size="lg"
                    data-testid="rellamar-button"
                  >
                    <PhoneCall className="mr-2 h-5 w-5" />
                    Rellamar
                  </Button>
                  <Button
                    onClick={handleCerrar}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    data-testid="cerrar-turno-button"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Cerrar Turno
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-8">No hay turno en atención</p>
                <Button
                  onClick={handleLlamar}
                  size="lg"
                  className="bg-primary text-lg h-14 px-8"
                  data-testid="llamar-siguiente-button"
                >
                  <PhoneForwarded className="mr-2 h-6 w-6" />
                  Llamar Siguiente Turno
                </Button>
              </div>
            )}
          </Card>

          <Card className="p-6 mt-6">
            <h3 className="text-lg font-heading font-bold text-slate-900 mb-4">Información</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{turnos.length}</p>
                <p className="text-sm text-slate-600">En Espera</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {turnoActual ? 1 : 0}
                </p>
                <p className="text-sm text-slate-600">En Atención</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-600">{usuario?.servicios_asignados?.length || 0}</p>
                <p className="text-sm text-slate-600">Servicios Asignados</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FuncionarioDashboard;
