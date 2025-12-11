import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { Ticket, Printer, CheckCircle } from 'lucide-react';

const VAPDashboard = () => {
  const [servicios, setServicios] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [prioridades, setPrioridades] = useState([]);
  const [turnoGenerado, setTurnoGenerado] = useState(null);
  const [config, setConfig] = useState(null);
  const [datosCliente, setDatosCliente] = useState({
    tipo_documento: 'CC',
    numero_documento: '',
    nombre_completo: '',
    telefono: '',
    correo: '',
    tipo_usuario: 'estudiante'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [serviciosRes, configRes] = await Promise.all([
        api.servicios.listar(),
        api.configuracion.obtener()
      ]);
      setServicios(serviciosRes.data.filter(s => s.activo));
      setConfig(configRes.data);
      setPrioridades(configRes.data.prioridades || []);
    } catch (error) {
      toast.error('Error al cargar datos');
    }
  };

  const handleGenerar = async () => {
    if (!servicioSeleccionado) {
      toast.error('Selecciona un servicio');
      return;
    }

    if (!datosCliente.numero_documento || !datosCliente.nombre_completo || !datosCliente.telefono || !datosCliente.correo) {
      toast.error('Completa todos los datos del cliente');
      return;
    }

    try {
      const response = await api.turnos.generar({
        servicio_id: servicioSeleccionado,
        prioridad: prioridad || null,
        ...datosCliente
      });

      setTurnoGenerado(response.data);
      toast.success('Turno generado exitosamente');

      if (config?.impresion_habilitada) {
        handleImprimir(response.data);
      }

      setServicioSeleccionado('');
      setPrioridad('');
      setDatosCliente({
        tipo_documento: 'CC',
        numero_documento: '',
        nombre_completo: '',
        telefono: '',
        correo: '',
        tipo_usuario: 'estudiante'
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al generar turno');
    }
  };

  const handleImprimir = (turno) => {
    toast.info('Imprimiendo ticket...');
    console.log('Comando ESC-POS para:', turno.codigo);
  };

  return (
    <div data-testid="vap-dashboard" className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-heading font-bold text-primary mb-2">Generar Turno</h1>
        <p className="text-lg text-slate-600">Ventanilla de Atención Presencial</p>
      </div>

      <Card className="p-8 bg-white">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Tipo de Documento</label>
              <Select 
                value={datosCliente.tipo_documento} 
                onValueChange={(val) => setDatosCliente({...datosCliente, tipo_documento: val})}
              >
                <SelectTrigger className="h-12" data-testid="tipo-documento-select">
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
              <label className="block text-sm font-semibold mb-2 text-slate-900">Número de Documento *</label>
              <Input
                value={datosCliente.numero_documento}
                onChange={(e) => setDatosCliente({...datosCliente, numero_documento: e.target.value})}
                placeholder="Ej: 1234567890"
                className="h-12"
                data-testid="numero-documento-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Nombre Completo *</label>
            <Input
              value={datosCliente.nombre_completo}
              onChange={(e) => setDatosCliente({...datosCliente, nombre_completo: e.target.value})}
              placeholder="Ej: Juan Pérez García"
              className="h-12"
              data-testid="nombre-completo-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Teléfono *</label>
              <Input
                value={datosCliente.telefono}
                onChange={(e) => setDatosCliente({...datosCliente, telefono: e.target.value})}
                placeholder="Ej: 3001234567"
                className="h-12"
                data-testid="telefono-input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-900">Correo Electrónico *</label>
              <Input
                type="email"
                value={datosCliente.correo}
                onChange={(e) => setDatosCliente({...datosCliente, correo: e.target.value})}
                placeholder="correo@ejemplo.com"
                className="h-12"
                data-testid="correo-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Tipo de Usuario</label>
            <Select 
              value={datosCliente.tipo_usuario} 
              onValueChange={(val) => setDatosCliente({...datosCliente, tipo_usuario: val})}
            >
              <SelectTrigger className="h-12" data-testid="tipo-usuario-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aspirante">Aspirante</SelectItem>
                <SelectItem value="estudiante">Estudiante</SelectItem>
                <SelectItem value="tercero">Tercero</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <div>
              <label className="block text-lg font-semibold mb-3 text-slate-900">Servicio a Solicitar *</label>
              <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
                <SelectTrigger className="h-14 text-base" data-testid="servicio-select">
                  <SelectValue placeholder="Selecciona un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-base py-3">
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900">Prioridad (Opcional)</label>
            <Select value={prioridad || "ninguna"} onValueChange={(val) => setPrioridad(val === "ninguna" ? "" : val)}>
              <SelectTrigger className="h-12" data-testid="prioridad-select">
                <SelectValue placeholder="Sin prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna">Sin prioridad</SelectItem>
                {prioridades.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerar}
            className="w-full h-16 text-lg bg-primary"
            data-testid="generar-turno-button"
          >
            <Ticket className="mr-3 h-6 w-6" />
            Generar Turno
          </Button>
        </div>
      </Card>

      {turnoGenerado && (
        <Card className="p-8 mt-6 text-center border-4 border-primary">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <p className="text-xl text-slate-600 mb-2">Turno Generado</p>
          <p className="font-mono text-7xl font-black text-primary mb-4">
            {turnoGenerado.codigo}
          </p>
          <p className="text-2xl text-slate-700 mb-6">{turnoGenerado.servicio_nombre}</p>
          {turnoGenerado.prioridad && (
            <div className="inline-flex items-center px-6 py-3 bg-red-100 rounded-full mb-6">
              <span className="text-red-600 text-xl font-semibold">{turnoGenerado.prioridad}</span>
            </div>
          )}
          {config?.impresion_habilitada && (
            <Button
              onClick={() => handleImprimir(turnoGenerado)}
              variant="outline"
              size="lg"
              data-testid="reimprimir-button"
            >
              <Printer className="mr-2 h-5 w-5" />
              Reimprimir Ticket
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default VAPDashboard;
