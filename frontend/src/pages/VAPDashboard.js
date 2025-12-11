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

    try {
      const response = await api.turnos.generar({
        servicio_id: servicioSeleccionado,
        prioridad: prioridad || null
      });

      setTurnoGenerado(response.data);
      toast.success('Turno generado exitosamente');

      if (config?.impresion_habilitada) {
        handleImprimir(response.data);
      }

      setServicioSeleccionado('');
      setPrioridad('');
    } catch (error) {
      toast.error('Error al generar turno');
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
          <div>
            <label className="block text-lg font-semibold mb-3 text-slate-900">Selecciona el Servicio</label>
            <Select value={servicioSeleccionado} onValueChange={setServicioSeleccionado}>
              <SelectTrigger className="h-16 text-lg" data-testid="servicio-select">
                <SelectValue placeholder="Selecciona un servicio" />
              </SelectTrigger>
              <SelectContent>
                {servicios.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-lg py-3">
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-3">Prioridad (Opcional)</label>
            <Select value={prioridad || "ninguna"} onValueChange={(val) => setPrioridad(val === "ninguna" ? "" : val)}>
              <SelectTrigger className="h-16 text-lg" data-testid="prioridad-select">
                <SelectValue placeholder="Sin prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguna" className="text-lg py-3">Sin prioridad</SelectItem>
                {prioridades.map(p => (
                  <SelectItem key={p} value={p} className="text-lg py-3">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerar}
            className="w-full h-20 text-xl bg-primary"
            data-testid="generar-turno-button"
          >
            <Ticket className="mr-3 h-8 w-8" />
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
