import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { PhoneCall, PhoneForwarded, CheckCircle, AlertCircle, Plus, Bell, ArrowRightLeft } from 'lucide-react';

const FuncionarioDashboard = () => {
  const [turnos, setTurnos] = useState([]);
  const [turnoActual, setTurnoActual] = useState(null);
  const { socket } = useSocket();
  const { usuario } = useAuth();
  const [dialogGenerar, setDialogGenerar] = useState(false);
  const [dialogRedirigir, setDialogRedirigir] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [turnosAnteriores, setTurnosAnteriores] = useState(0);
  const [datosCliente, setDatosCliente] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombre_completo: '',
    telefono: '',
    correo: '',
    tipo_usuario: 'estudiante',
    observaciones: ''
  });
  const [formGenerar, setFormGenerar] = useState({
    servicio_id: '',
    prioridad: ''
  });
  const [servicioRedirigir, setServicioRedirigir] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  useEffect(() => {
    cargarTurnos();
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [serviciosRes, configRes] = await Promise.all([
        api.servicios.listar(),
        api.configuracion.obtener()
      ]);
      setServicios(serviciosRes.data.filter(s => s.activo));
      setPrioridades(configRes.data.prioridades || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const buscarClientePorDocumento = async (numeroDocumento) => {
    if (!numeroDocumento || numeroDocumento.length < 5) {
      setClienteEncontrado(false);
      return;
    }

    setBuscandoCliente(true);
    try {
      const response = await api.clientes.buscarPorDocumento(numeroDocumento);
      const cliente = response.data;
      
      setDatosCliente({
        ...datosCliente,
        tipo_documento: cliente.tipo_documento,
        numero_documento: cliente.numero_documento,
        nombre_completo: cliente.nombre_completo,
        telefono: cliente.telefono,
        correo: cliente.correo,
        tipo_usuario: cliente.tipo_usuario
      });
      
      setClienteEncontrado(true);
      toast.success(`¡Cliente encontrado! ${cliente.nombre_completo}`);
    } catch (error) {
      if (error.response?.status === 404) {
        setClienteEncontrado(false);
      } else {
        console.error('Error al buscar cliente:', error);
      }
    } finally {
      setBuscandoCliente(false);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('turno_generado', (turno) => {
        const cantidadAnterior = turnos.length;
        cargarTurnos();
        
        // Verificar si el turno es para los servicios del funcionario
        if (usuario?.servicios_asignados?.includes(turno.servicio_id)) {
          toast.info(
            `Nuevo turno ${turno.codigo} en ${turno.servicio_nombre}`,
            {
              icon: <Bell className="h-4 w-4" />,
              duration: 5000
            }
          );
          
          // Notificación sonora (opcional)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Nuevo Turno Disponible', {
              body: `${turno.codigo} - ${turno.servicio_nombre}`,
              icon: '/logo-unad.png'
            });
          }
        }
      });

      socket.on('turno_cerrado', () => {
        cargarTurnos();
      });

      return () => {
        socket.off('turno_generado');
        socket.off('turno_cerrado');
      };
    }
  }, [socket, turnos, usuario]);

  const cargarTurnos = async () => {
    try {
      const response = await api.turnos.obtenerTodos();
      const nuevosTurnos = response.data;
      
      // Detectar incremento en turnos
      if (nuevosTurnos.length > turnosAnteriores && turnosAnteriores > 0) {
        const diferencia = nuevosTurnos.length - turnosAnteriores;
        if (diferencia > 0) {
          toast.success(`${diferencia} nuevo(s) turno(s) en cola`, {
            icon: <Bell className="h-4 w-4" />
          });
        }
      }
      
      setTurnos(nuevosTurnos);
      setTurnosAnteriores(nuevosTurnos.length);
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
      const response = await api.turnos.llamar({ 
        turno_id: siguienteTurno.id,
        modulo: `Módulo ${usuario.nombre.split(' ')[0]}`
      });
      setTurnoActual(response.data);
      toast.success(`Turno ${response.data.codigo} llamado`);
      cargarTurnos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al llamar turno');
    }
  };

  const handleAtender = async () => {
    if (!turnoActual) return;
    
    if (turnoActual.estado !== 'llamado') {
      toast.error('El turno debe estar en estado llamado');
      return;
    }

    try {
      const response = await api.turnos.atender({ turno_id: turnoActual.id });
      setTurnoActual(response.data);
      toast.success('Turno en atención');
    } catch (error) {
      toast.error('Error al atender turno');
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

  const handleGenerarTurno = async () => {
    if (!formGenerar.servicio_id || !datosCliente.numero_documento || 
        !datosCliente.nombre_completo || !datosCliente.telefono || !datosCliente.correo) {
      toast.error('Completa todos los datos requeridos');
      return;
    }

    try {
      const response = await api.turnos.generar({
        servicio_id: formGenerar.servicio_id,
        prioridad: formGenerar.prioridad || null,
        ...datosCliente
      });

      toast.success(`Turno ${response.data.codigo} generado exitosamente`);
      setDialogGenerar(false);
      
      // Reset form
      setFormGenerar({ servicio_id: '', prioridad: '' });
      setDatosCliente({
        tipo_documento: 'CC',
        numero_documento: '',
        nombre_completo: '',
        telefono: '',
        correo: '',
        tipo_usuario: 'estudiante',
        observaciones: ''
      });
      
      cargarTurnos();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar turno');
    }
  };

  const handleRedirigir = async () => {
    if (!turnoActual || !servicioRedirigir) {
      toast.error('Selecciona un servicio de destino');
      return;
    }

    try {
      await api.turnos.redirigir({
        turno_id: turnoActual.id,
        nuevo_servicio_id: servicioRedirigir
      });

      const servicioNombre = servicios.find(s => s.id === servicioRedirigir)?.nombre;
      toast.success(`Turno ${turnoActual.codigo} redirigido a ${servicioNombre}`);
      setDialogRedirigir(false);
      setServicioRedirigir('');
      setTurnoActual(null);
      cargarTurnos();
    } catch (error) {
      toast.error('Error al redireccionar turno');
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">Módulo de Atención</h1>
          <p className="text-slate-600">Gestiona la atención de turnos</p>
        </div>
        <Dialog open={dialogGenerar} onOpenChange={setDialogGenerar}>
          <DialogTrigger asChild>
            <Button className="bg-secondary" data-testid="generar-turno-funcionario-button">
              <Plus className="mr-2 h-4 w-4" />
              Generar Nuevo Turno
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generar Nuevo Turno</DialogTitle>
              <DialogDescription>
                Completa los datos del cliente para generar un nuevo turno
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Documento</Label>
                  <Select 
                    value={datosCliente.tipo_documento} 
                    onValueChange={(val) => setDatosCliente({...datosCliente, tipo_documento: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                      <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                      <SelectItem value="PAS">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Número de Documento *</Label>
                  <Input
                    value={datosCliente.numero_documento}
                    onChange={(e) => setDatosCliente({...datosCliente, numero_documento: e.target.value})}
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={datosCliente.nombre_completo}
                  onChange={(e) => setDatosCliente({...datosCliente, nombre_completo: e.target.value})}
                  placeholder="Juan Pérez García"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={datosCliente.telefono}
                    onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})}
                    placeholder="3001234567"
                  />
                </div>
                <div>
                  <Label>Correo Electrónico *</Label>
                  <Input
                    type="email"
                    value={datosCliente.correo}
                    onChange={(e) => setDatosCliente({...datosCliente, correo: e.target.value})}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <Label>Tipo de Usuario</Label>
                <Select 
                  value={datosCliente.tipo_usuario} 
                  onValueChange={(val) => setDatosCliente({...datosCliente, tipo_usuario: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aspirante">Aspirante</SelectItem>
                    <SelectItem value="estudiante">Estudiante</SelectItem>
                    <SelectItem value="tercero">Tercero</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observaciones / Motivo de la Solicitud</Label>
                <textarea
                  value={datosCliente.observaciones}
                  onChange={(e) => setDatosCliente({...datosCliente, observaciones: e.target.value})}
                  placeholder="Ej: Solicita información sobre inscripciones..."
                  className="w-full h-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="border-t pt-4">
                <div className="mb-4">
                  <Label>Servicio *</Label>
                  <Select 
                    value={formGenerar.servicio_id} 
                    onValueChange={(val) => setFormGenerar({...formGenerar, servicio_id: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicios.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridad (Opcional)</Label>
                  <Select 
                    value={formGenerar.prioridad || "ninguna"} 
                    onValueChange={(val) => setFormGenerar({...formGenerar, prioridad: val === "ninguna" ? "" : val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ninguna">Sin prioridad</SelectItem>
                      {prioridades.map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerarTurno} className="w-full bg-primary">
                <Plus className="mr-2 h-4 w-4" />
                Generar Turno
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card className="p-6 bg-white border-2 border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-bold text-slate-900">Cola de Turnos</h2>
              {turnos.length > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-bold text-primary">{turnos.length}</span>
                </div>
              )}
            </div>
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
          <Card className="p-8 bg-white border-2 border-slate-200">
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
                    {turnoActual.observaciones && (
                      <div className="col-span-2 pt-4 border-t">
                        <p className="text-slate-600 font-medium mb-2">Observaciones / Motivo de la Solicitud</p>
                        <p className="text-slate-900 text-base bg-white p-3 rounded border border-slate-200">{turnoActual.observaciones}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estado: llamado */}
                {turnoActual.estado === 'llamado' && (
                  <div className="space-y-4">
                    <div className="bg-accent/10 border-2 border-accent rounded-lg p-4 mb-4">
                      <p className="text-center text-accent font-semibold text-lg">
                        🔔 Turno llamado - Cliente debe acercarse al módulo
                      </p>
                    </div>
                    <div className="flex space-x-3 justify-center flex-wrap gap-2">
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
                        onClick={handleAtender}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                        data-testid="atender-button"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Cliente Presente - Atender
                      </Button>
                    </div>
                  </div>
                )}

                {/* Estado: atendiendo */}
                {turnoActual.estado === 'atendiendo' && (
                  <div className="space-y-4">
                    <div className="bg-primary/10 border-2 border-primary rounded-lg p-4 mb-4">
                      <p className="text-center text-primary font-semibold text-lg">
                        ✅ Cliente en atención - {turnoActual.modulo}
                      </p>
                    </div>
                    <div className="flex space-x-3 justify-center flex-wrap gap-2">
                      <Dialog open={dialogRedirigir} onOpenChange={setDialogRedirigir}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="lg"
                            data-testid="redirigir-button"
                          >
                            <ArrowRightLeft className="mr-2 h-5 w-5" />
                            Redirigir
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Redirigir Turno</DialogTitle>
                            <DialogDescription>
                              Selecciona el servicio al que deseas redirigir el turno {turnoActual?.codigo}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Servicio de Destino</Label>
                              <Select value={servicioRedirigir} onValueChange={setServicioRedirigir}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                  {servicios
                                    .filter(s => s.id !== turnoActual?.servicio_id)
                                    .map(s => (
                                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={handleRedirigir} className="w-full">
                              <ArrowRightLeft className="mr-2 h-4 w-4" />
                              Confirmar Redirección
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        onClick={handleCerrar}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="finalizar-turno-button"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Finalizar Turno
                      </Button>
                    </div>
                  </div>
                )}
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

          <Card className="p-6 mt-6 bg-white border-2 border-slate-200">
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
